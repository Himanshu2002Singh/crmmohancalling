// models/lead.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Employee = require("../models/employeesModel");


const Lead = sequelize.define(
  "Lead",
  {
    lead_id:{
      type: DataTypes.INTEGER,
      primaryKey : true,
      autoIncrement: true,
    },
    person_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dob :{
      type: DataTypes.DATEONLY
    },
    // branch: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    // source: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    // priority: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    next_meeting: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    employment_type: {
      type: DataTypes.STRING,
    },
    // loan_term: {
    //   type: DataTypes.STRING
    // },
    // refrence: {
    //   type: DataTypes.STRING,
    //   allowNull: true,
    // },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // loan_type: {
    //   type : DataTypes.TEXT,
    //   allowNull: null
    // },
    est_salary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company_name:{
      type: DataTypes.STRING,
    }
  },
  {
    tableName: "leads",
    timestamps: true,
  }
);

// Create table if not exists
Lead.sync({ alter: false })
  .then(() => {
    console.log("Lead table created");
  })
  .catch((error) => {
    console.error("Error creating Lead table:", error);
  });

module.exports = Lead;
