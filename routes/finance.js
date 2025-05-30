// routes/finance.js
const express = require('express');
const router = express.Router();
const SupplierOrder = require('../models/SupplierOrder');
const Product = require('../models/Product');

// ✅ GET: Total expenses by supplier
router.get('/expenses/suppliers', async (req, res) => {
  try {
    const orders = await SupplierOrder.find({ status: { $in: ['completed', 'delayed'] } })
      .populate('supplier', 'name')
      .populate('products.product', 'supplier_price');

    const supplierExpenses = {};

    for (const order of orders) {
      const supplierId = order.supplier._id;
      if (!supplierExpenses[supplierId]) {
        supplierExpenses[supplierId] = {
          supplier: order.supplier.name,
          totalExpense: 0
        };
      }

      for (const item of order.products) {
        const price = item.product?.supplier_price || 0;
        supplierExpenses[supplierId].totalExpense += price * item.quantity;
      }
    }

    res.json(Object.values(supplierExpenses));
  } catch (err) {
    console.error("❌ Supplier expense error:", err);
    res.status(500).json({ message: "Error fetching supplier expenses" });
  }
});

// ✅ GET: Total expenses by product
router.get('/expenses/products', async (req, res) => {
  try {
    const orders = await SupplierOrder.find({ status: { $in: ['completed', 'delayed'] } })
      .populate('products.product', 'name supplier_price');

    const productExpenses = {};

    for (const order of orders) {
      for (const item of order.products) {
        const product = item.product;
        if (!product) continue;

        if (!productExpenses[product._id]) {
          productExpenses[product._id] = {
            name: product.name,
            totalExpense: 0
          };
        }

        productExpenses[product._id].totalExpense += (product.supplier_price || 0) * item.quantity;
      }
    }

    res.json(Object.values(productExpenses));
  } catch (err) {
    console.error("❌ Product expense error:", err);
    res.status(500).json({ message: "Error fetching product expenses" });
  }
});

// ✅ GET: Daily total supplier expenses
router.get('/expenses/daily', async (req, res) => {
  try {
    const orders = await SupplierOrder.find({ status: { $in: ['completed', 'delayed'] } })
      .populate('products.product', 'supplier_price');

    const dailyTotals = {};

    for (const order of orders) {
      const dateKey = new Date(order.updatedAt).toISOString().slice(0, 10); // 'YYYY-MM-DD'
      if (!dailyTotals[dateKey]) dailyTotals[dateKey] = 0;

      for (const item of order.products) {
        const price = item.product?.supplier_price || 0;
        dailyTotals[dateKey] += price * item.quantity;
      }
    }

    const result = Object.entries(dailyTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (err) {
    console.error("❌ Daily expense error:", err);
    res.status(500).json({ message: "Error fetching daily expenses" });
  }
});

module.exports = router;