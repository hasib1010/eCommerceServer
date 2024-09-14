const express = require("express");
const { ObjectId } = require("mongodb");
const sanitizeHtml = require("sanitize-html");
const router = express.Router();

router.use(express.json());

module.exports = function (database) {
    const productCollection = database.collection("ProductCollection");

    router.get('/', (req, res) => {
        res.send('Hello Products');
    });

    router.post('/clothings', async (req, res) => {
        try {
            const newProduct = req.body;

            if (newProduct.description) {
                newProduct.description = sanitizeHtml(newProduct.description);
            }

            const result = await productCollection.insertOne(newProduct);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error inserting document:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    router.get("/clothings", async (req, res) => {
        try {
            const cursor = productCollection.find();
            const products = await cursor.toArray();
            res.status(200).json({ products });
        } catch (error) {
            console.error('Error fetching documents:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    router.get('/clothings/:id', async (req, res) => {
        try {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await productCollection.findOne(query); 
            
            if (result) {
                res.status(200).json(result);
            } else {
                res.status(404).json({ error: 'Product not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    return router;
};
