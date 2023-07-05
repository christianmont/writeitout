const mongoose = require('mongoose')
const ChallengeSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Challenge', ChallengeSchema)