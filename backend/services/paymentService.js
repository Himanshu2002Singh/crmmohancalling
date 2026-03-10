// services/paymentService.js
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_razorpay_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret",
});

// Create a new order
const createOrder = async (amount, currency, receipt, notes) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency || "INR",
      receipt: receipt,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

// Verify payment signature
const verifySignature = (orderId, paymentId, signature) => {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "your_razorpay_key_secret";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    return generatedSignature === signature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw error;
  }
};

// Refund payment
const refundPayment = async (paymentId, amount) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
    });
    return refund;
  } catch (error) {
    console.error("Error refunding payment:", error);
    throw error;
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifySignature,
  getPaymentDetails,
  refundPayment,
};

