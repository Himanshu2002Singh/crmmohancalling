const {DataTypes} = require("sequelize");
const sequelize = require("../config/database");
const Lead = require("../models/leadModel");

const History = sequelize.define(
    "History",
    {
        history_id : {
            type : DataTypes.INTEGER,
            primaryKey : true,
            autoIncrement : true
        },
        lead_id :{
            type : DataTypes.INTEGER,
            allowNull : false
        },
        owner:{
            type : DataTypes.STRING
        },
        next_meeting:{
            type : DataTypes.DATE
        },
        status:{
            type: DataTypes.STRING
        },
        // loanType: {
        //     type: DataTypes.STRING
        // },
        remark: {
            type: DataTypes.STRING
        }
    },
    {
    tableName: "histories",
    timestamps: true,
  }
);

    History.sync({alter : false}).then(()=> {
        console.log("History table created")
    }).catch((error) => {
        console.error("Error creating history table", error);
    });

module.exports = History;