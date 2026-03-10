const { DataTypes } = require('sequelize');
const sequelize = require("../config/database");

const Template = sequelize.define('Template', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileType: {
    type: DataTypes.STRING
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'templates',
  timestamps: true
});

Template.sync({alter: false}).then(()=>{
    console.log("Template table created");
}).catch((error)=>{
    console.error("Error creating Template table:", error);
});


module.exports = Template;
