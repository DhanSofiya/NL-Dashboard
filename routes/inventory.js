// routes/inventory.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', new mongoose.Schema({
  name: String,
  email: String,
  address: String,
  imageUrl: String
}, { timestamps: true }), 'suppliers');

// ✅ GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category')
      .populate('supplier')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('❌ Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
});

// ✅ GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('supplier');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product by ID:', error);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// ✅ POST create product (stock set to 0 by default)
router.post('/', async (req, res) => {
  try {
    const { name, image, price, supplier_price, ar_uri, description, category, supplier } = req.body;

    if (!name || !image || !price || !supplier_price || !description || !category || !supplier) {
      return res.status(400).json({ message: 'All fields including supplier price are required' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return res.status(400).json({ message: 'Invalid category ID' });

    const supplierExists = await Supplier.findById(supplier);
    if (!supplierExists) return res.status(400).json({ message: 'Invalid supplier ID' });

    const stock = 0;
    const newProduct = new Product({
      name,
      image_uri: image,
      price,
      supplier_price,
      ar_uri,
      description,
      category,
      supplier,
      stock
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully' });
  } catch (error) {
    console.error('❌ Error adding product:', error);
    res.status(500).json({ message: 'Server error while adding product' });
  }
});

// ✅ PUT update product
router.put('/:id', async (req, res) => {
  try {
    const { name, image, price, supplier_price, ar_uri, description, category, supplier } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        image_uri: image,
        price,
        supplier_price,
        ar_uri,
        description,
        category,
        supplier
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ message: 'Update failed' });
  }
});

// ✅ DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;