const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Attendance = sequelize.define("Attendance", {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // status: {
  //   type: DataTypes.STRING,
  //   allowNull: true,
  // },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  // attendancesite: {
  //   type: DataTypes.STRING,
  //   allowNull: false,
  // },
  isLate: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  remark:{
    type:DataTypes.STRING,
    allowNull: true
  },
  latitude:{
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  }
});
Attendance.sync({ alter: false })

  .then(() => {
    console.log("Attendance table created");
  })
  .catch((error) => {
    console.error("Error creating Attendance table:", error);
  });

module.exports = Attendance;
