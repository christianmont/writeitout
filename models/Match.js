const mongoose = require('mongoose')
const MatchSchema = new mongoose.Schema({
    a: {
        type: String,
        required: true
    },
    b: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    aStory: {
        type: String
    },
    bStory: {
        type: String
    },
    status: {
        type: String,
        default: "Writing"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Match', MatchSchema)