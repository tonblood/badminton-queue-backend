const mongoose = require('mongoose');
const randomId = require('../common-misc/randomId');

const PlayerQueueSchema = new mongoose.Schema({
    id: String,
    firstPlayer: String,
    secondPlayer: String,
    winCount: Number,
    update_at: {type: Date, default: Date.now()},
    update_by: String,
    courtId: Number
})

module.exports = mongoose.model('PlayerQueues', PlayerQueueSchema);