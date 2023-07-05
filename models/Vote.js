const mongoose = require('mongoose')
const VoteSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    match: {
        type: String,
        required: true
    },
    RFD: {
        type: String,
        required: true
    },
    winner: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
module.exports = mongoose.model('Vote', VoteSchema)