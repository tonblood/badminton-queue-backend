const mongoose = require('mongoose');
const randomId = require('../common-misc/randomId');

const TeamTwoPlaySchema = new mongoose.Schema({
    id: { type: String, default: randomId(6) },
    firstPlayer: String,
    secondPlayer: String,
    winCount: Number,
    update_at: { type: Date, default: Date.now() },
    update_by: String
})

module.exports = mongoose.model('TeamTwoPlay', TeamTwoPlaySchema);