const express = require('express');
const router = express.Router();
const SupplierOrder = require('../models/SupplierOrder');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ Auto-progress status when triggered by shared email button
router.get('/next/:id', async (req, res) => {
  try {
    const { token } = req.query;
    const order = await SupplierOrder.findById(req.params.id).populate('supplier');

    if (!order || order.emailToken !== token) {
      return res.sendStatus(403);
    }

    const currentStatus = order.status;

    if (currentStatus === 'pending') {
      order.status = 'confirmed';
      order.updatedAt = Date.now();
      await order.save();

      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      const shipUrl = `${baseUrl}/trigger-action.html?id=${order._id}&token=${order.emailToken}`;

      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"NL-Dashboard Orders" <niltiva@proton.me>`,
        to: order.supplier.email,
        subject: `✅ Order Confirmed – Ready to Ship?`,
        html: `
          <p>Hi ${order.supplier.name},</p>
          <p>You confirmed the order. Please mark it as shipped when ready.</p>
          <p>
            <a href="${shipUrl}" onclick="window.open(this.href, 'popup', 'width=10,height=10,left=9999,top=9999'); return false;" style="
              display:inline-block;
              padding:12px 20px;
              background-color:#2196f3;
              color:#ffffff;
              text-decoration:none;
              font-weight:bold;
              border-radius:5px;
              font-family:Arial,sans-serif;
            ">📦 Mark as Shipped</a>
          </p>
          <p>Thank you,<br>NL-Dashboard Team</p>
        `
      };

      transporter.sendMail(mailOptions, err => {
        if (err) console.error("❌ Failed to send ship prompt:", err);
      });

    } else if (currentStatus === 'confirmed') {
      order.status = 'shipped';
      order.updatedAt = Date.now();
      await order.save();
    }

    res.sendStatus(204);
  } catch (error) {
    console.error("❌ Error updating supplier order status:", error);
    res.sendStatus(500);
  }
});

// ✅ Admin: Mark as delivered (optional/manual)
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

// ✅ Admin: Mark as completed and update stock and rating
router.put('/complete/:id', async (req, res) => {
  try {
    const order = await SupplierOrder.findById(req.params.id);
    if (!order || (order.status !== 'delivered' && order.status !== 'shipped')) {
      return res.status(400).json({ message: "Order must be marked as shipped before completing" });
    }

    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    const now = new Date();
    const isOnTime = order.deliveryDate && now <= order.deliveryDate;

    // Update order status accordingly
    order.status = isOnTime ? 'completed' : 'delayed';
    order.updatedAt = now;
    await order.save();

    // Update supplier stats and rating
    const supplier = await Supplier.findById(order.supplier);
    if (supplier) {
      supplier.totalCompletedOrders = (supplier.totalCompletedOrders || 0) + 1;
      if (isOnTime) {
        supplier.onTimeDeliveries = (supplier.onTimeDeliveries || 0) + 1;
      }

      const onTime = supplier.onTimeDeliveries || 0;
      const total = supplier.totalCompletedOrders || 1;
      supplier.rating = Math.round((onTime / total) * 5 * 10) / 10;

      await supplier.save();

      console.log("✅ Supplier stats updated:", {
        supplier: supplier.name,
        onTimeDeliveries: supplier.onTimeDeliveries,
        totalCompletedOrders: supplier.totalCompletedOrders,
        rating: supplier.rating
      });
    }

    res.json({ message: `Order marked as ${order.status} and stock updated` });
  } catch (error) {
    console.error("❌ Error completing supplier order:", error);
    res.status(500).json({ message: "Failed to complete order" });
  }
});

// ✅ GET all supplier orders (for dashboard)
router.get('/', async (req, res) => {
  try {
    const orders = await SupplierOrder.find()
      .populate('supplier', 'name email')
      .populate('products.product', 'name supplier_price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching supplier orders:", error);
    res.status(500).json({ message: "Failed to load supplier orders" });
  }
});

// ✅ DELETE a supplier order by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await SupplierOrder.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting supplier order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

module.exports = router;