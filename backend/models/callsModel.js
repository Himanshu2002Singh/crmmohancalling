const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");

const Calls = sequelize.define(
    "Calls",
    {
        call_id : {
            type : DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement : true
        },
        lead_id : {
            type: DataTypes.STRING,
        },
        emp_id: {
            type : DataTypes.STRING,
        },
        name:{
            type: DataTypes.STRING,
        },
        number : {
            type: DataTypes.STRING,
        },
        remark : {
            type : DataTypes.STRING,
        }
    },
    {
        tableName : "calls",
        timestamps : true
    }
);

Calls.sync({ alter: false })
  .then(() => {
    console.log("Calls table created");
  })
  .catch((error) => {
    console.error("Error creating Calls table:", error);
  });

module.exports = Calls;