const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const Task = sequelize.define(
    "Tasks", 
    {
        task_id : {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement : true
        },
        emp_id : {
            type: DataTypes.STRING,
        },
        title: {
            type: DataTypes.STRING,
        },
        choose_lead : {
            type: DataTypes.STRING,
        },
        lead_id :{
            type: DataTypes.STRING,
        },
        start_date :{
            type: DataTypes.DATE
        },
        end_date: {
            type: DataTypes.DATE,
        },
        // assign_to : {
        //     type: DataTypes.STRING,
        // },
        // observer:{
        //     type: DataTypes.STRING,
        // },
        priority: {
            type : DataTypes.STRING,
        },
        // is_active: {
        //     type: DataTypes.BOOLEAN
        // },
        description: {
            type : DataTypes.STRING,
        },
        assigned_by_name: {
            type: DataTypes.STRING,
        },
        assigned_by_id: {
            type: DataTypes.STRING,
        },
        status: {
            type : DataTypes.STRING,
        }
    },
    {
        tableName : "tasks",
        timestamps : true
    }
);
Task.sync({alter: false}).then(()=>{
    console.log("Tasks table created");
}).catch((error)=>{
    console.error("Error creating Tasks table:", error);
});

module.exports = Task;