const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /.+\@.+\..+/ // Basic regex for email validation
    },
    age: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

// Indexes for performance
userSchema.index({ uid: 1 }); // Index for user UID
userSchema.index({ email: 1 }); // Optional: Index for email

const User = mongoose.model('User', userSchema);

module.exports = User;
