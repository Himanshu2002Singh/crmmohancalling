// models/adminSubscriptionModel.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Admin = require("./adminModel");
const SubscriptionPlan = require("./subscriptionPlanModel");

const AdminSubscription = sequelize.define(
  "AdminSubscription",
  {
    subscription_id: {
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
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "subscription_plans",
        key: "plan_id",
      },
    },
    plan_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    num_employees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    billing_type: {
      type: DataTypes.ENUM("monthly", "daily"),
      defaultValue: "monthly",
    },
    billing_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    wallet_amount_used: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    is_renewal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_amount: {
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
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled", "pending"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "admin_subscriptions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Sync model
AdminSubscription.sync({ alter: false })
  .then(() => {
    console.log("AdminSubscription table ready");
  })
  .catch((error) => {
    console.error("Error creating AdminSubscription table:", error);
  });

module.exports = AdminSubscription;

