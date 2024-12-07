const mongoose = require('mongoose');
const randomId = require('../common-misc/randomId');

const PlayersSchema = new mongoose.Schema({
    id: String,
    player_name: String,
    update_at: {type: Date, default: Date.now()},
    update_by: String,
    courtId: Number
})

module.exports = mongoose.model('Player', PlayersSchema);