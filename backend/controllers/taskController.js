const { json } = require("sequelize");
const Tasks = require("../models/taskModel");
const { Op } = require("sequelize");

exports.addTask = async (req, res)=>{
    const {emp_id} = req.body;
    if(emp_id == null){
        return res.status(400).json({message: "empid is required"});
    } 

    try{
        const newTask = await Tasks.create(req.body);
        res.status(200).json({message: "Task added successfully", task: newTask});
    }catch(error){
        console.log("error while adding task");
        res.status(500).json({message: "Database Error", error});
    }
};

exports.getTasks = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query; // ⭐️ date filter query se milega

    try {
        const whereClause = { emp_id: id };

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            };
        }

        const tasks = await Tasks.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ tasks: tasks });
    } catch (error) {
        console.error("Error fetching tasks", error);
        res.status(500).json({ message: "Database error", error });
    }
};
exports.getTasksByLeadId = async(req, res)=>{
    const {id} = req.params;
    try{
        const task = await Tasks.findAll({
            where : {lead_id : id}
        });
        res.status(200).json({tasks: task});
    }catch(error){
        console.error("Error fetching tasks", error);
        res.status(500).json({message: "Database error", error});
    }
}

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const updates = req.body;

  try {
    const task = await Tasks.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Dynamically update only the passed fields
    Object.keys(updates).forEach(key => {
      if (task[key] !== undefined) {
        task[key] = updates[key];
      }
    });

    await task.save();

    return res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Database error", error });
  }
};

exports.deleteTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const task = await Tasks.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.destroy();

    return res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Database error", error });
  }
};
