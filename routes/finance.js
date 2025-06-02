// routes/finance.js
const express = require('express');
const router = express.Router();
const SupplierOrder = require('../models/SupplierOrder');
const Product = require('../models/Product');
const Order = require('../models/Order'); // Customer orders

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

// ✅ GET: Customer revenue and platform profit
router.get('/revenue/customers', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' });

    let totalRevenue = 0;
    let totalPlatformProfit = 0;
    let totalRiderCommission = 0;

    for (const order of orders) {
      totalRevenue += order.totalPrice;
      totalPlatformProfit += order.platformProfit;
      totalRiderCommission += order.riderCommission;
    }

    res.json({
      totalRevenue,
      totalPlatformProfit,
      totalRiderCommission
    });
  } catch (err) {
    console.error("❌ Revenue fetch error:", err);
    res.status(500).json({ message: "Error fetching customer revenue" });
  }
});

// ✅ GET: Top sold products by quantity
router.get('/revenue/products', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' }).populate('items.product', 'name');

    const productSales = {};

    for (const order of orders) {
      for (const item of order.items) {
        const product = item.product;
        if (!product) continue;

        if (!productSales[product._id]) {
          productSales[product._id] = {
            name: product.name,
            quantity: 0
          };
        }

        productSales[product._id].quantity += item.quantity;
      }
    }

    const result = Object.values(productSales).sort((a, b) => b.quantity - a.quantity);
    res.json(result);
  } catch (err) {
    console.error("❌ Product revenue error:", err);
    res.status(500).json({ message: "Error fetching product revenue" });
  }
});

// ✅ GET: Daily revenue and rider commission
router.get('/revenue/daily', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'completed' });

    const dailyStats = {};

    for (const order of orders) {
      const dateKey = new Date(order.updatedAt).toISOString().slice(0, 10);
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { revenue: 0, riderCommission: 0 };
      }
      dailyStats[dateKey].revenue += order.totalPrice;
      dailyStats[dateKey].riderCommission += order.riderCommission;
    }

    const result = Object.entries(dailyStats)
      .map(([date, { revenue, riderCommission }]) => ({ date, revenue, riderCommission }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(result);
  } catch (err) {
    console.error("❌ Daily revenue error:", err);
    res.status(500).json({ message: "Error fetching daily revenue" });
  }
});

module.exports = router;