const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('❌ Failed to fetch categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

module.exports = router;