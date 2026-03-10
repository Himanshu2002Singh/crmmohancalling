// models/transactionModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Admin = require("./adminModel");

const Transaction = sequelize.define(
  "Transaction",
  {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "admins",
        key: "admin_id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpay_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    razorpay_signature: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM("razorpay", "wallet", "free"),
      defaultValue: "razorpay",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("success", "failed", "pending", "refunded"),
      defaultValue: "success",
    },
  },
  {
    tableName: "transactions",
    timestamps: true,
    createdAt: "created_at",
  }
);

// Sync model
Transaction.sync({ alter: false })
  .then(() => {
    console.log("Transaction table ready");
  })
  .catch((error) => {
    console.error("Error creating Transaction table:", error);
  });

module.exports = Transaction;

