const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlayerQueues = require('../models/PlayerQueue.js');
const playersvalidator = require('../validation/playersvalidation.js');
const response = require('../models/response.js');
const TeamOnePlay = require('../models/TeamOnePlay.js');
const TeamTwoPlay = require('../models/TeamTwoPlay.js');
const admin = process.env.ADMIN

const sendBody = async () => {
    const body = {
        teamOnePlay: await TeamOnePlay.findOne().select('-_id -__v -update_by -update_at'),
        teamTwoPlay: await TeamTwoPlay.findOne().select('-_id -__v -update_by -update_at'),
        teamQueueList: await PlayerQueues.find().select('-_id -__v -update_by -update_at')
    }
    return body
}

router.get('/', async (req, res, next) => {
    const data = await sendBody()
    return res.status(200).json(response(200, 'get data successfully', data))
})

router.post('/', async (req, res, next) => {
    const { error, value } = playersvalidator.validate(req.body)
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    } else {
        const { update_by } = await req.body
        if (admin === update_by) {
            const data = await sendBody()
            const checkPlayerOne = await TeamOnePlay.findOne()
            const checkPlayerTwo = await TeamTwoPlay.findOne()
            if (!checkPlayerOne) {
                TeamOnePlay.create(req.body)
            } else if (!checkPlayerTwo) {
                TeamTwoPlay.create(req.body)
            } else {
                PlayerQueues.create(req.body)
            }
            return res.status(201).json(response(201, 'create data successfully', data))
        }
        return res.status(400).json({ error: `you don't have permission to adjust data` });
    }
})

router.patch('/win/:id', async (req, res, next) => {
    const winnerId = await req.params.id
    if (winnerId) {
        // front send wincount + 1
        const { winCount } = req.body
        const body = await sendBody()
        const isTeamOneWin = await TeamOnePlay.find({ id: winnerId })
        if (winCount) {
            if (winCount == 1) {
                if (isTeamOneWin) {
                    console.log('T1 Win');
                    const newTeam = await PlayerQueues.findOneAndDelete()
                    const tempLoseTeam = await TeamTwoPlay.findOneAndUpdate({}, { winCount: 0 }, { new: true }).select('-_id ')
                    await TeamTwoPlay.updateOne(newTeam)
                    await PlayerQueues.create(tempLoseTeam)
                    const dataUpdate = await TeamOnePlay.findOneAndUpdate({ id: winnerId }, req.body, { new: true })
                    console.log('data T1:', dataUpdate)
                } else {
                    console.log('T2 Win');
                    const newTeam = await PlayerQueues.findOneAndDelete()
                    const tempLoseTeam = await TeamOnePlay.findOneAndUpdate({}, { winCount: 0 }, { new: true })
                    await TeamOnePlay.updateOne(newTeam)
                    await PlayerQueues.create(tempLoseTeam)
                    const dataUpdate = await TeamTwoPlay.findOneAndUpdate({ id: winnerId }, req.body, { new: true })
                    console.log('data T2:', dataUpdate)
                }
            } else if (winCount == 2) {
                console.log('work2');

                const newTeam1 = await PlayerQueues.findOneAndDelete()
                const newTeam2 = await PlayerQueues.findOneAndDelete().skip(1)
                const tempTeamOne = await TeamOnePlay.findOneAndUpdate({}, { winCount: 0 }, { new: true })
                const tempTeamTwo = await TeamTwoPlay.findOneAndUpdate({}, { winCount: 0 }, { new: true })
                await TeamOnePlay.updateOne(newTeam1)
                await TeamTwoPlay.updateOne(newTeam2)
                if (isTeamOneWin) {
                    await PlayerQueues.insertMany([tempTeamTwo, tempTeamOne])
                } else {
                    await PlayerQueues.insertMany([tempTeamOne, tempTeamTwo])
                }
            }
            return res.status(200).json(response(200, 'update data successfully', body))
        } else {
            return res.status(400).json({ error: 'winCount is required' });
        }
    } else {
        return res.status(400).json({ error: 'winner ID is required' });
    }

})

router.delete('/delete/:id', async (req, res, next) => {
    const resourceId = req.params.id;
    try {
        const deletedResource = await PlayerQueues.findOne({ id: resourceId })
        if (!deletedResource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        res.status(200).json({ message: 'Resource deleted', resource: deletedResource });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
})

module.exports = router;