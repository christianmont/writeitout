const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    site: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    userName: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    desc: {
        type: String,
        default: ""
    },
    image: {
        type: String
    },
    defImage: {
        type: Boolean,
        required: true
    },
    elo: {
        type: Number,
        default: 1500
    },
    credits: {
        type: Number,
        default: 3
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('User', UserSchema)