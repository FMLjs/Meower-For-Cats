const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String
    },
    subscribers: [{
        name: String,
    }],
    subscriptions: [{
        name: String,
    }],
    meows: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meows',
    }]
});

const User = mongoose.model('User', UserSchema);

module.exports = User;