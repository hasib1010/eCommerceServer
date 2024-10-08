const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();
const axios = require('axios');

const User = require('./models/userModel');
const Order = require('./models/orderModel'); // Import your Order model

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// MongoDB connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvnsa.mongodb.net/eCommerceDB?retryWrites=true&w=majority`;

// Connect to MongoDB using Mongoose
mongoose.connect(uri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
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
  const { total } = req.body;  
  if (typeof total !== 'number' || total <= 0) {
    return res.status(400).send({ error: 'Invalid items or total amount' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      payment_method_types: ['card'], 
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

    // Check if the user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    // Create a new user instance
    const newUser = new User(userData);
    await newUser.save();

    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error saving user to database:', error);
    res.status(500).send({ message: 'Failed to save user', error: error.message });
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

// GET /users/check-email - Check if email exists
app.get('/users/check-email', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /users/:uid - Get user by UID
app.get('/users/:uid', async (req, res) => {
  try {
    const userId = req.params.uid;
    const result = await User.findOne({ uid: userId });
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
  const { wishList, ...updateData } = req.body;

  console.log('Update Data:', updateData); // Log the incoming update data

  try {
    const user = await User.findOne({ uid: userId });
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Update the user with the provided fields
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    // Update the wishlist if provided
    if (wishList && Array.isArray(wishList)) {
      user.wishList = Array.from(new Set(wishList));
    }

    const updatedUser = await user.save();
    console.log('Updated User:', updatedUser); // Log the updated user data
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send({ message: 'Failed to update user', error: error.message });
  }
});
 

// POST /orders - Create a new order
app.post('/orders', async (req, res) => {
  try {
    const { uid, items, transactionId, shippingAddress, phoneNumber } = req.body;

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
    const orders = await Order.find().populate('user');
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

    const result = await Order.updateOne({ _id: id }, { $set: { status } });

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
    const user = await User.findOne({ uid }).populate('orders');

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    res.send(user.orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).send({ error: 'Failed to fetch orders' });
  }
});

// GET /orders/:transactionId - Get a specific order by transaction ID
app.get('/orders/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find the order by transactionId
    const order = await Order.findOne({ transactionId }).populate('user');

    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }

    res.send(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).send({ error: 'Failed to fetch order' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
