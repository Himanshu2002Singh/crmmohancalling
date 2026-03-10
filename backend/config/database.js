const { Sequelize, DataTypes } = require("sequelize");

// const sequelize = new Sequelize("cdipl", "root", "admin", {
//   host: "localhost",
//   dialect: "mysql",
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//   },
// });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DBUSER,
  process.env.DBPASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    timezone: "+05:30", // IST time zone offset

    dialectOptions: {
      ssl:false
      //  {
      //   require: false,
      //   rejectUnauthorized: false,
      // },
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;
