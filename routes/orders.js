// routes/orders.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const connectSecondaryDB = require("../config/secondaryDb");
const mongoose = require("mongoose");

// Connect to secondary DB to access delivery partners
const secondaryConnection = connectSecondaryDB();
const DeliveryPartner = secondaryConnection.model("DeliveryPartner", new mongoose.Schema({
  name: String,
  email: String
}, { collection: "deliverypartners" }));

const COMMISSION_RATE = 0.10;

// Utility to get random rider name
async function getRandomRiderName() {
  const count = await DeliveryPartner.countDocuments();
  if (count === 0) return "Rider";
  const randomIndex = Math.floor(Math.random() * count);
  const rider = await DeliveryPartner.findOne().skip(randomIndex);
  return rider?.name || "Rider";
}

// ✅ GET all customer orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("items.product");

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const riderName = await getRandomRiderName();
        return {
          ...order.toObject(),
          riderName
        };
      })
    );

    res.json(enrichedOrders);
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ message: "Failed to fetch orders", error: err });
  }
});

// ✅ POST create a new customer order
router.post("/", async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerPhone,
      deliveryLocation,
      totalPrice,
      items
    } = req.body;

    const riderCommission = +(totalPrice * COMMISSION_RATE).toFixed(2);
    const platformProfit = +(totalPrice - riderCommission).toFixed(2);

    const newOrder = new Order({
      orderId,
      customerName,
      customerPhone,
      deliveryLocation,
      totalPrice,
      riderCommission,
      platformProfit,
      items
    });

    await newOrder.save();
    res.status(201).json({ message: "Order created", order: newOrder });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ message: "Failed to create order", error: err });
  }
});

// ✅ PUT update order status (with inventory deduction on "packed")
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending", "packed", "cancelled", "picked_up",
      "in_transit", "delivered", "completed"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Handle inventory deduction if status is "packed"
    if (status === "packed" && order.status === "pending") {
      for (const item of order.items) {
        const product = await Product.findById(item.product._id);
        if (!product) {
          return res.status(400).json({ message: `Product not found for item ${item.product._id}` });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
        }

        product.stock -= item.quantity;
        await product.save();
      }
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("❌ Error updating order status:", err);
    res.status(500).json({ message: "Failed to update order status", error: err });
  }
});

// ✅ GET order by ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const riderName = await getRandomRiderName();
    res.json({ ...order.toObject(), riderName });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err });
  }
});

module.exports = router;