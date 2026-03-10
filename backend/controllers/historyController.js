const History = require("../models/historyModel");

exports.addHistory = async (req, res) => {
    const { lead_id } = req.body;

    if (lead_id == null) {
        return res.status(400).json({ message: "lead_id is required" });
    }

    try {
        const newHistory = await History.create(req.body);
        res.status(200).json({ message: "New History added successfully", id: newHistory.history_id });
    } catch (error) {
        console.error("Error adding History:", error);
        res.status(500).json({ message: "Database error", error });
    }
};

exports.getHistory = async (req, res) => {
    const { id } = req.params;

    try {
        const historyData = await History.findAll({
            where: { lead_id: id },
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json({ history: historyData });
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Database error", error });
    }
};
