const mongoose = require('mongoose');

const MeowsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    comments: [{
        name: String,
        comment: String,
        created: Date,
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
});

const Meows = mongoose.model('Meows', MeowsSchema);

module.exports = Meows;