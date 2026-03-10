// models/subscriptionPlanModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Admin = require("./adminModel");

const SubscriptionPlan = sequelize.define(
  "SubscriptionPlan",
  {
    plan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    plan_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price_per_employee_per_month: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    min_employees: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    max_employees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "admins",
        key: "admin_id",
      },
    },
  },
  {
    tableName: "subscription_plans",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Sync model
SubscriptionPlan.sync({ alter: false })
  .then(() => {
    console.log("SubscriptionPlan table ready");
  })
  .catch((error) => {
    console.error("Error creating SubscriptionPlan table:", error);
  });

module.exports = SubscriptionPlan;

