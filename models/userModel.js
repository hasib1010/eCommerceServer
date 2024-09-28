const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /.+\@.+\..+/ 
    },
    age: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    wishList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    profilePicture: { type: String, default: "" }  // New field for profile picture
});


// Indexes for performance
userSchema.index({ uid: 1 });  
userSchema.index({ email: 1 }); 

const User = mongoose.model('User', userSchema);

module.exports = User;
