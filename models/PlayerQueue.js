const mongoose = require('mongoose');

const PlayerQueueSchema = new mongoose.Schema({
    id: String,
    firstPlayer: String,
    secondPlayer: String,
    winCount: Number,
    update_at: {type: Date, default: Date.now()}
})

module.exports = mongoose.model('PlayerQueues', PlayerQueueSchema);