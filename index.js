const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51PypvVKj6EpE0ZfrTaXmUzuh5CohkQdoOA3MXj7qSerMYIYnk7cb2oE61DgbAMGeQbggqsS72JNss1Yb4QlR5ptG00XMtSHW3v');
const port = process.env.PORT || 3000;
require('dotenv').config();

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Update to your frontend URL
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvnsa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const productsRoute = require('./Routes/products');

async function run() {
  try {
    await client.connect();

    const database = client.db("eCommerceDB");
    app.get('/', (req, res) => { res.send('Hello World! nodemon'); });
    app.use('/products', productsRoute(database));

    app.post('/create-checkout-session', async (req, res) => {
      try {
        const { items } = req.body;

        if (!items || items.length === 0) {
          return res.status(400).json({ error: 'No items provided' });
        }

        const lineItems = items.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.name,
              images: [item.thumbnailImage],
            },
            unit_amount: item.price * 100, // Amount in cents
          },
          quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: 'http://localhost:5173/success', // Redirect after successful payment
          cancel_url: 'http://localhost:5173/cancel',   // Redirect if payment is canceled
        });

        res.json({ url: session.url });
      } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run();
