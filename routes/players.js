const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlayerQueues = require('../models/PlayerQueue.js');

router.get('/', (req, res, next) => {
    PlayerQueues.find().then((queues) => res.json(queues)).catch((err) => next(Error))
})

module.exports = router;