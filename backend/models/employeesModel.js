// models/employee.js
const { DataTypes, INTEGER, STRING } = require("sequelize");
const sequelize = require("../config/database");
const Employee = sequelize.define(
  "Employee",
  {
    emp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    ename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'admins',
        key: 'admin_id'
      }
    },
  },
  {
    tableName: "employees",
    timestamps: false, // set to true if using createdAt/updatedAt
  }
);

Employee.sync({ alter: true })

  .then(() => {
    console.log("Employee table created");
  })
  .catch((error) => {
    console.error("Error creating Employee table:", error);
  });

module.exports = Employee;
