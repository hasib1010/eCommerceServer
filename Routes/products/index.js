const express = require('express');
const sanitizeHtml = require('sanitize-html');
const Product = require("../../Product");
const router = express.Router();

router.use(express.json());

// Test route
router.get('/', (req, res) => {
  res.send('Hello Products');
});

// Add a new product
router.post('/clothings', async (req, res) => {
  try {
    const newProduct = req.body;
    newProduct.description = sanitizeHtml(newProduct.description || '');
    newProduct.isFeatured = newProduct.isFeatured ?? false;
    newProduct.stock = newProduct.stock ?? 0; // Initialize stock

    const product = new Product(newProduct);
    const result = await product.save();
    res.status(201).json(result);
  } catch (error) {
    console.error('Error inserting document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all products
router.get('/clothings', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let filter = {};
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);
    const totalProducts = await Product.countDocuments(filter);
    res.status(200).json({ products, total: totalProducts });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Unique categories
router.get('/clothings/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get products by category
router.get("/clothings/categories/:categoryName", async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const products = await Product.find({ category: categoryName });
    if (products.length > 0) {
      res.status(200).json({ products });
    } else {
      res.status(404).json({ error: "No Products Found" });
    }
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get product by ID
router.get('/clothings/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update featured status
router.put('/clothings/:id/featured', async (req, res) => {
  try {
    const id = req.params.id;
    const { isFeatured } = req.body;
    if (typeof isFeatured !== 'boolean') return res.status(400).json({ error: 'isFeatured must be a boolean' });

    const product = await Product.findById(id);
    if (product) {
      product.isFeatured = isFeatured;
      await product.save();
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update trending status
router.put('/clothings/:id/trending', async (req, res) => {
  try {
    const id = req.params.id;
    const { isTrending } = req.body;
    if (typeof isTrending !== 'boolean') return res.status(400).json({ error: 'isTrending must be a boolean' });

    const product = await Product.findById(id);
    if (product) {
      product.isTrending = isTrending;
      await product.save();
      res.status(200).json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update stock for multiple products
router.patch('/clothings/update-stock', async (req, res) => {
  const { products } = req.body; // Expecting an array of { id, quantity }
  
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Invalid input. Expected an array of products.' });
  }

  const session = await Product.startSession();
  session.startTransaction();
  
  try {
    const updatePromises = products.map(async (product) => {
      const { id, quantity } = product;
      
      const foundProduct = await Product.findById(id).session(session);
      if (!foundProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }

      if (foundProduct.stock < quantity) {
        throw new Error(`Not enough stock for product ${foundProduct.name}`);
      }

      foundProduct.stock -= quantity; // Deduct the purchased quantity
      return await foundProduct.save({ session });
    });

    await Promise.all(updatePromises);
    await session.commitTransaction();
    res.status(200).json({ message: 'Stock updated successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
