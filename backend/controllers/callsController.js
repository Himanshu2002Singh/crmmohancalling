// Calls = require("../models/callsModel");
const { Op } = require("sequelize");
const Calls = require("../models/callsModel");
const Leads = require("../models/leadModel");

exports.addCalls = async (req, res) => {
  const { emp_id } = req.body;

  if (!emp_id) {
    return res.status(400).json({ message: "emp_id is required" });
  }

  try {
    const newCalls = await Calls.create(req.body);
    res.status(201).json(newCalls); 
  } catch (error) {
    console.error("Error adding Call: ", error);
    res.status(500).json({ message: "Database error", error });
  }
};


exports.getCalls = async(req, res)=> {
    const {id} = req.params;
    try{
        const callsData = await Calls.findAll({
            where :{emp_id : id},
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({calls : callsData});
    }catch(error){
        console.error("Error fetching Calls", error);
        res.status(500).json({message : "Database error", error});
    }
};

exports.getCallsByLeadId = async(req, res) =>{
    const{id} = req.params;
    try{
        const callData = await Calls.findAll({
            where :{lead_id: id},
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({calls: callData});
    }catch(error){
        console.error("Error fetching calls", error);
        res.status(500).json({message : "Database error", error});
    }
};

exports.updateCall = async (req, res) => {
  const { callId } = req.params;
  const updatedData = req.body;

  try {
    const [updated] = await Calls.update(updatedData, {
      where: { call_id: callId },
    });

    if (updated === 0) {
      return res.status(404).json({ message: 'Call not found or no changes made' });
    }

    res.status(200).json({ message: 'Call updated successfully' });
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ message: 'Database error', error });
  }
};

exports.getCallsByDates = async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
    }

    try {
        const callsData = await Calls.findAll({
            where: {
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ calls: callsData });
    } catch (error) {
        console.error("Error fetching calls by dates", error);
        res.status(500).json({ message: "Database error", error });
    }
}

exports.getCallsByEmpIdAndDates = async (req, res) => {
    const { startDate, endDate } = req.query;
    const { emp_id } = req.params;  

    if (!emp_id || !startDate || !endDate) {
        return res.status(400).json({ message: "emp_id, startDate and endDate are required" });
    }

    try {
        const callsData = await Calls.findAll({
            where: {
                emp_id: emp_id,
                createdAt: {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                }
            },
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ calls: callsData });
    } catch (error) {
        console.error("Error fetching calls by emp_id and dates", error);
        res.status(500).json({ message: "Database error", error });
    }
};

exports.getTotalCallsCountByEmployeeId = async (req, res) => {
  const { emp_id } = req.params;

  if (!emp_id) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    const totalCount = await Calls.count({
      where: { emp_id: emp_id },  // ✅ Make sure 'emp_id' exists in Call model
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // ✅ Count today's calls for employee
    const todayCount = await Calls.count({
      where: {
        emp_id: emp_id,
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    });


    res.status(200).json({ total: totalCount, today: todayCount });
  } catch (error) {
    console.error('Error getting total call count:', error);
    res.status(500).json({ message: 'Database error', error });
  }
};

exports.filterCalls = async (req, res) => {
  try {
    const { startDate, endDate, status, loanType } = req.query;
    const { emp_id } = req.params; // 🔥 emp_id from route params

    if (!emp_id) {
      return res.status(400).json({ message: "emp_id is required" });
    }

    const whereClause = {
      emp_id, // ✅ Filter by emp_id
    };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // 1. Fetch all calls for this emp_id and date range
    const allCalls = await Calls.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    // 2. Filter by lead's status and loanType
    const filteredCalls = [];

    for (const call of allCalls) {
      if (!call.lead_id) continue;

      const lead = await Leads.findOne({ where: { lead_id: call.lead_id } });
      if (!lead) continue;

      if (status && status !== 'All' && lead.status !== status) continue;
      if (loanType && loanType !== 'All' && lead.loan_type !== loanType) continue;

      filteredCalls.push({
        ...call.toJSON(),
        lead: {
          status: lead.status,
          loan_type: lead.loan_type,
        },
      });
    }

    res.json(filteredCalls);
  } catch (error) {
    console.error("Error filtering calls:", error);
    res.status(500).json({ message: "Error filtering calls", error });
  }
};
