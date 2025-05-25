const express = require('express');
const router = express.Router();
const SupplierOrder = require('../models/SupplierOrder');
const Product = require('../models/Product');
const crypto = require('crypto');

// ✅ Confirm order (from email link)
router.get('/confirm/:id', async (req, res) => {
  try {
    const { token } = req.query;
    const order = await SupplierOrder.findById(req.params.id);
    if (!order || order.emailToken !== token) {
      return res.status(403).send("❌ Invalid or expired confirmation link.");
    }

    order.status = 'confirmed';
    order.updatedAt = Date.now();
    await order.save();

    res.send("✅ Order has been confirmed. Thank you.");
  } catch (error) {
    console.error("❌ Error confirming supplier order:", error);
    res.status(500).send("❌ Failed to confirm order.");
  }
});

// ✅ Mark as shipped (from email link)
router.get('/shipped/:id', async (req, res) => {
  try {
    const { token } = req.query;
    const order = await SupplierOrder.findById(req.params.id);
    if (!order || order.emailToken !== token) {
      return res.status(403).send("❌ Invalid or expired shipping link.");
    }

    order.status = 'shipped';
    order.updatedAt = Date.now();
    await order.save();

    res.send("📦 Order has been marked as shipped.");
  } catch (error) {
    console.error("❌ Error marking order as shipped:", error);
    res.status(500).send("❌ Failed to update shipping status.");
  }
});

// ✅ Admin: Mark as delivered (manually from site)
router.put('/delivered/:id', async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = 'delivered';
    order.updatedAt = Date.now();
    await order.save();

    res.json({ message: "Order marked as delivered" });
  } catch (error) {
    console.error("❌ Error marking order as delivered:", error);
    res.status(500).json({ message: "Failed to mark order as delivered" });
  }
});

// ✅ Admin: Mark as completed and update stock
router.put('/complete/:id', async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);
if (!order || (order.status !== 'delivered' && order.status !== 'shipped')) {
      return res.status(400).json({ message: "Order must be marked as delivered before completing" });
    }

    for (const item of order.products) {
      const product = await Product.findOne({ name: item.product, supplier: order.supplier });
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'completed';
    order.updatedAt = Date.now();
    await order.save();

    res.json({ message: "Order marked as completed and stock updated" });
  } catch (error) {
    console.error("❌ Error completing supplier order:", error);
    res.status(500).json({ message: "Failed to complete order" });
  }
});

// ✅ GET all supplier orders (for dashboard display)
router.get('/', async (req, res) => {
  try {
    const orders = await SupplierOrder.find()
      .populate('supplier', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching supplier orders:", error);
    res.status(500).json({ message: "Failed to load supplier orders" });
  }
});

module.exports = router;