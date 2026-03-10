const Lead = require('../models/leadModel');
const XLSX = require("xlsx");
const { Op } = require('sequelize'); // Import Op for date queries
const Employee = require("../models/employeesModel");
const { startOfToday, endOfToday, startOfTomorrow, endOfTomorrow } = require('date-fns');

exports.addLead = async (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({ message: 'Name and number are required' });
  }

  try {
    const newLead = await Lead.create(req.body); 
    res.status(200).json({
      message: "Lead added successfully",
      id: newLead.lead_id,
    });
  } catch (error) {
    console.error("Error adding lead:", error);
    res.status(500).json({ message: "Database error", error });
  }
};

exports.importLeadsFromExcel = async (req, res) => {
  try {
    const { userid } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }

    // 🔍 Find assigned employee
    const assignedEmployee = await Employee.findOne({
      where: { emp_id: userid },
    });

    if (!assignedEmployee) {
      return res.status(404).json({ message: "Assigned employee not found" });
    }

    const ownerName = assignedEmployee.ename || assignedEmployee.username;

    // 📥 Parse Excel from buffer with date cell support
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let count = 0;

    for (const row of sheetData) {
      const {
        name,
        number,
        email,
        dob,
        next_meeting,
        employment_type,
        description,
        address,
        remark,
        est_salary,
        company_name,
      } = row;

      // 🔁 Skip if name or number missing
      if (!name || !number) continue;

      // 🛠️ Handle date conversion - support both string and Date objects
      let dobDate = null;
      if (dob) {
        if (dob instanceof Date && !isNaN(dob)) {
          dobDate = dob;
        } else if (typeof dob === 'string' && dob.includes('-')) {
          // Try parsing string date like "1990-05-15"
          const parsed = new Date(dob);
          if (!isNaN(parsed)) {
            dobDate = parsed;
          }
        }
      }

      let meetingDate = null;
      if (next_meeting) {
        if (next_meeting instanceof Date && !isNaN(next_meeting)) {
          meetingDate = next_meeting;
        } else if (typeof next_meeting === 'string' && next_meeting.includes('-')) {
          // Try parsing string date like "2024-12-20"
          const parsed = new Date(next_meeting);
          if (!isNaN(parsed)) {
            meetingDate = parsed;
          }
        }
      }

      await Lead.create({
        name,
        number,
        email,
        dob: dobDate,
        next_meeting: meetingDate,
        employment_type,
        description,
        address,
        remark,
        est_salary,
        company_name,
        status: "Fresh Lead",
        person_id: userid,
        owner: ownerName || "Unassigned",
      });

      count++;
    }

    return res.status(200).json({
      message: `✅ Successfully imported ${count} leads and assigned to ${ownerName}`,
    });

  } catch (error) {
    console.error("❌ Error importing leads:", error);
    return res.status(500).json({
      message: "Failed to import leads",
      error: error.message,
    });
  }
};

exports.updateLead = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;  // Accept any fields from the request body

    if (!id) {
        return res.status(400).json({ message: 'Lead ID is required' });
    }

    try {
        const [updated] = await Lead.update(updateData, {
            where: { lead_id: id }
        });

        if (updated === 0) {
            return res.status(404).json({ message: 'Lead not found or no changes made' });
        }

        res.status(200).json({ message: 'Lead updated successfully' });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ message: 'Database error', error });
    }
};

exports.getLeadsForAdminPanel = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const fromDate = req.query.fromDate; 
    const toDate = req.query.toDate;     

    const offset = (page - 1) * limit;

    // 🛡️ Search condition (name or phone)
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { number: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};
      console.log(searchCondition);

    // 📅 Date filter condition
    const dateCondition =
      fromDate && toDate
        ? {
            createdAt: {
              [Op.between]: [new Date(fromDate), new Date(toDate)],
            },
          }
        : {};

    // 🛡️ Final where clause
let whereCondition = {};

if (search) {
  // 🔍 Only search filter (ignore date)
  whereCondition = searchCondition;
} else if (fromDate && toDate) {
  // 📅 Only date filter (when no search)
  whereCondition = {
    createdAt: {
      [Op.between]: [
        new Date(fromDate),
        new Date(new Date(toDate).setHours(23, 59, 59, 999)),
      ],
    },
  };
}

    // 🔍 Find leads with filters + pagination
    const { rows: leads, count: totalCount } = await Lead.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching leads",
    });
  }
};


exports.getLeads = async (req, res)=>{
    try{
         const lead = await Lead.findAll();
          res.status(200).json(lead);
    }catch(error){
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Database error', error });
    } 
};

exports.getLeadsById = async (req, res)=>{
    const {emp_id} = req.params;
    try{
         const lead = await Lead.findAll({
            where: {person_id : emp_id},
            order: [['createdAt', 'DESC']],
         });
          res.status(200).json(lead);
    }catch(error){
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Database error', error : error });
    } 
};

exports.deleteLead = async (req, res)=> {
    const{id} = req.params;
    try{
        const deleted = Lead.destroy({where:{lead_id : id}});
        if (deleted) {
      res.status(200).json({ message: 'Lead deleted successfully' });
    } else {
      res.status(404).json({ message: 'Lead not found' });
    }
    }catch(error){
        console.error('Error deleting lead:', err);
    res.status(500).json({ message: 'Server error' });
    }
};

exports.getLeadDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const lead = await Lead.findByPk(id); // find by primary key

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        return res.status(200).json(lead);
    } catch (error) {
        console.error("Error fetching lead details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.searchByName = async (req, res)=>{
  const search = req.query.search || "";

  const leads = await Lead.find({
    name: { $regex: search, $options: "i" }, 
  });

  res.json(leads);
};

exports.leadsByDate = async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }

  try {
    const leads = await Lead.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads by date:', error);
    res.status(500).json({ message: 'Database error', error });
  }
} 
exports.leadsByEmpIdAndDate = async (req, res) => {
  const { startDate, endDate } = req.query;
  const { emp_id } = req.params;

  if (!emp_id || !startDate || !endDate) {
    return res.status(400).json({ message: 'Employee ID, start date, and end date are required' });
  }

  try {
    const leads = await Lead.findAll({
      where: {
        person_id: emp_id,
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads by employee ID and date:', error);
    res.status(500).json({ message: 'Database error', error });
  }
}

exports.getLeadCountByEmpId = async (req, res) => {
  const { emp_id } = req.params;

  if (!emp_id) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    // Total leads by emp_id
    const leadsCount = await Lead.count({
      where: {
        person_id: emp_id
      }
    });
    const joinedCount = await Lead.count({
      where:{
        person_id : emp_id,
        status: "Joined"
      }
    })

    // File Login status count (specific to this employee)
    const interviewSelected = await Lead.findAll({
      where: {
        person_id: emp_id,
        status: 'Interview Selected'
      }
    });

    // Today’s date range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Tomorrow’s date range
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const endOfTomorrow = new Date(endOfToday);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);

    // Today meeting count
    const todayLeads = await Lead.findAll({
      where: {
        person_id: emp_id,
        next_meeting: {
          [Op.between]: [startOfToday, endOfToday]
        }
      }
    });

    // Tomorrow meeting count
    const tomorrowLeads = await Lead.findAll({
      where: {
        person_id: emp_id,
        next_meeting: {
          [Op.between]: [startOfTomorrow, endOfTomorrow]
        }
      }
    });

    return res.status(200).json({
      totalLeads: leadsCount,
      interviewSelectedCount : interviewSelected,
      todayLineups: todayLeads,
      tomorrowLineups: tomorrowLeads,
      totalJoined : joinedCount
    });

  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Database error", error });
  }
};
exports.getFreshLeadsByEmpId = async (req, res) =>{
  const { emp_id } = req.params;
  if(!emp_id){
    return res.status(400).json({ message: "Employee ID is required" });
  }
  try {
    const leads = await Lead.findAll({
      where : {
        person_id : emp_id,
        status : "Fresh Lead"
      }
    });
    return res.status(200).json(leads);
  }catch(error){
    console.error("Error fetching fresh leads:", error);
    res.status(500).json({ message: "Database error", error });
  }
}

exports.getLeadByNumber = async (req, res) =>{
  const { lead_number } = req.params;
  try {
    const lead = await Lead.findOne({
      where: {
        number: lead_number
      }});
      return res.status(200).json(lead);
  }catch(error){
    console.error("Error fetching lead by number:", error);
    return res.status(500).json({message: "Database error", error});
  }
}

exports.getLeadsByNextMeeting = async (req, res) => {
  try {
    // Get today's date range
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    // Get tomorrow's date range
    const tomorrowStart = startOfTomorrow();
    const tomorrowEnd = endOfTomorrow();

    // Today's lineups
    const todayLineups = await Lead.findAll({
      where: {
        next_meeting: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    // Tomorrow's lineups
    const tomorrowLineups = await Lead.findAll({
      where: {
        next_meeting: {
          [Op.between]: [tomorrowStart, tomorrowEnd],
        },
      },
    });

    // Pending lineups (next meeting after tomorrow)
    const pendingLineups = await Lead.findAll({
      where: {
        next_meeting: {
          [Op.gt]: tomorrowEnd,
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        todayLineups,
        tomorrowLineups,
        pendingLineups,
        // freshLeads,
      },
    });
  } catch (error) {
    console.error('Error in getLeadsByNextMeeting:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getFilteredLeads = async (req, res) => {
  try {
    const { emp_id, startDate, endDate, status } = req.query;

    const whereClause = {};

    if (emp_id) {
      whereClause.person_id = emp_id;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (status && status !== "All") {
      whereClause.status = status;
    }

    const leads = await Lead.findAll({
      attributes: ['lead_id', 'name', 'number', 'person_id', 'status', 'createdAt'], // Only required fields
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ leads });
  } catch (error) {
    console.error("Error fetching filtered leads", error);
    res.status(500).json({ message: "Server error", error });
  }
};
