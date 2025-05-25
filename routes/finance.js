// 📂 routes/finance.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Product'); // For product prices
const Product = require('../models/Product');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const OrderModel = require('../models/Order');  // Using OrderModel to avoid name clash

// GET /api/finance/sales → total sales + product revenue breakdown
router.get('/sales', async (req, res) => {
  try {
    const orders = await OrderModel.find();
    let totalSales = 0;
    const productSales = {};

    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.product;
        const quantity = item.quantity;

        if (!productSales[productId]) productSales[productId] = 0;
        productSales[productId] += quantity;

        totalSales += item.price * quantity;
      }
    }

    // Populate product names
    const productDetails = await Product.find({ _id: { $in: Object.keys(productSales) } });
    const productRevenue = productDetails.map(p => ({
      name: p.name,
      totalSold: productSales[p._id] || 0
    }));

    res.json({ totalSales, productRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/finance/wages → total employee wages
router.get('/wages', async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee' });
    let totalWages = 0;

    employees.forEach(emp => {
      if (emp.wage) totalWages += emp.wage;
    });

    res.json({ totalWages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/finance/supplierOrders → total supplier orders (marked by type field or special flag)
router.get('/supplierOrders', async (req, res) => {
  try {
    const supplierOrders = await OrderModel.find({ type: 'supplierOrder' });
    let totalSupplierOrders = 0;

    supplierOrders.forEach(order => {
      order.items.forEach(item => {
        totalSupplierOrders += item.price * item.quantity;
      });
    });

    res.json({ totalSupplierOrders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;