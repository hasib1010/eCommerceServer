const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

const User = require('./models/userModel');
const Order = require('./models/orderModel'); // Import your Order model

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvnsa.mongodb.net/eCommerceDB?retryWrites=true&w=majority`;

// Connect to MongoDB using Mongoose
mongoose.connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process on connection error
  });

// Root route
app.get('/', (req, res) => {
  res.send('Hello World! nodemon');
});

// Products route
const productsRoute = require('./Routes/products');
app.use('/products', productsRoute);

// Create Payment Intent
app.post('/create-payment-intent', async (req, res) => {
  const { items, total } = req.body;

  if (!Array.isArray(items) || typeof total !== 'number' || total <= 0) {
    return res.status(400).send({ error: 'Invalid items or total amount' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { items: JSON.stringify(items) }
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).send({ error: 'Failed to create payment intent', details: error.message });
  }
});

// POST /users - Create a new user
app.post('/users', async (req, res) => {
  try {
    const userData = req.body;

    // Create a new user instance
    const newUser = new User(userData);

    // Save the user to the database
    await newUser.save();

    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error saving user to database:', error);
    res.status(500).send({ message: 'Failed to save user' });
  }
});

// GET /users - Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}); // Find all users
    res.send(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ error: 'Failed to fetch users' });
  }
});
app.get('/users/:uid', async (req, res) => {
  try {
    const userId = req.params.uid;
    const query = { uid: userId };
    const result = await User.findOne(query);
    if (result) {
      res.send(result);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user by UID:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/users/:uid', async (req, res) => {
  const userId = req.params.uid;  
  const { wishList } = req.body;  

  try {
    // Find the user by UID
    const user = await User.findOne({ uid: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the wishlist, ensuring no duplicates
    const updatedWishlist = Array.from(new Set([...user.wishList, ...wishList]));

    user.wishList = updatedWishlist; // Update the wishlist
    const updatedUser = await user.save(); // Save the user with the updated wishlist

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating wishlist:', error);
    res.status(500).json({ message: 'Failed to update wishlist', error: error.message });
  }
});






app.post('/orders', async (req, res) => {
  try {
    const { uid, items, transactionId, shippingAddress, phoneNumber } = req.body;
    console.log(req.body);

    const user = await User.findOne({ uid });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const price = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);

    const newOrder = new Order({
      price,
      quantity,
      items,
      transactionId,
      phoneNumber,
      shippingAddress,
      user: user._id,
      confirmedAt: new Date()
    });

    await newOrder.save();

    // Update user with new order reference
    user.orders.push(newOrder);
    await user.save();

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


// GET /orders - Get all orders for a specific user
app.get('/orders', async (req, res) => {
  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).send({ message: 'User ID is required' });
    }

    const user = await User.findOne({ uid }).populate('orders');

    if (!user) {
      ``
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(user.orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send({ error: 'Failed to fetch orders' });
  }
});

// GET /admin/orders - Get all orders from all users
app.get('/admin/orders', async (req, res) => {
  try {
    // Find all orders
    const orders = await Order.find().populate('user'); // Populate user reference

    res.send(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).send({ error: 'Failed to fetch all orders' });
  }
});

// POST /admin/orders/:id/status - Update the status of a specific order
app.post('/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).send({ message: 'Invalid status' });
    }

    const result = await Order.updateOne(
      { _id: id },
      { $set: { status } }
    );

    if (result.nModified === 0) {
      return res.status(404).send({ message: 'Order not found' });
    }

    res.status(200).send({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).send({ message: 'Failed to update order status' });
  }
});

// GET /users/:uid/orders - Get all orders for a specific user
app.get('/users/:uid/orders', async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid }).populate('orders'); // Populate orders

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(user.orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).send({ error: 'Failed to fetch orders' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
