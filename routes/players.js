const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PlayerQueues = require('../models/PlayerQueue.js');
const playersvalidator = require('../validation/playersvalidation.js');
const response = require('../models/response.js');
const TeamOnePlay = require('../models/TeamOnePlay.js');
const TeamTwoPlay = require('../models/TeamTwoPlay.js');
const { v4: uuidv4 } = require("uuid");

const sendBody = async () => {
    const body = await {
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
        req.body = await { ...req.body, id: uuidv4().slice(0, 6), winCount: 0 }
        const checkPlayerOne = await TeamOnePlay.findOne()
        const checkPlayerTwo = await TeamTwoPlay.findOne()
        if (!checkPlayerOne) {
            await TeamOnePlay.create(req.body)
        } else if (!checkPlayerTwo) {
            await TeamTwoPlay.create(req.body)
        } else {
            await PlayerQueues.create(req.body)
        }
        const data = await sendBody()
        return res.status(201).json(response(201, 'create data successfully', data))
    }
})

router.patch('/win/:id', async (req, res, next) => {
    const winnerId = await req.params.id
    if (winnerId) {
        // front send wincount + 1
        const { winCount, update_by } = req.body
        const isTeamOneWin = await TeamOnePlay.findOne({ id: winnerId })
        if (winCount) {
            if (winCount == 1) {
                if (isTeamOneWin) {
                    const newTeam = await PlayerQueues.findOneAndDelete()
                    const tempLoseTeam = await TeamTwoPlay.findOneAndUpdate({}, { $set: { winCount: 0 } }, { new: true })
                    await TeamTwoPlay.deleteOne()
                    await TeamTwoPlay.create({
                        id: newTeam.id,
                        firstPlayer: newTeam.firstPlayer,
                        secondPlayer: newTeam.secondPlayer,
                        winCount: newTeam.winCount,
                        update_by: update_by
                    })
                    await PlayerQueues.create({
                        id: tempLoseTeam.id,
                        firstPlayer: tempLoseTeam.firstPlayer,
                        secondPlayer: tempLoseTeam.secondPlayer,
                        winCount: tempLoseTeam.winCount,
                        update_by: update_by
                    })
                    const dataUpdate = await TeamOnePlay.findOneAndUpdate({ id: winnerId }, { $set: req.body }, { new: true })
                } else {
                    const newTeam = await PlayerQueues.findOneAndDelete()
                    const tempLoseTeam = await TeamOnePlay.findOneAndUpdate({}, { $set: { winCount: 0 } }, { new: true })
                    await TeamOnePlay.deleteOne()
                    await TeamOnePlay.create({
                        id: newTeam.id,
                        firstPlayer: newTeam.firstPlayer,
                        secondPlayer: newTeam.secondPlayer,
                        winCount: newTeam.winCount,
                        update_by: update_by
                    })
                    await PlayerQueues.create({
                        id: tempLoseTeam.id,
                        firstPlayer: tempLoseTeam.firstPlayer,
                        secondPlayer: tempLoseTeam.secondPlayer,
                        winCount: tempLoseTeam.winCount,
                        update_by: update_by
                    })
                    const dataUpdate = await TeamTwoPlay.findOneAndUpdate({ id: winnerId }, { $set: req.body }, { new: true })
                }
            } else if (winCount == 2) {
                const newTeam1 = await PlayerQueues.findOneAndDelete()
                const newTeam2 = await PlayerQueues.findOneAndDelete().skip(1)
                const tempTeamOne = await TeamOnePlay.findOneAndUpdate({}, { $set: { winCount: 0 } }, { new: true })
                const tempTeamTwo = await TeamTwoPlay.findOneAndUpdate({}, { $set: { winCount: 0 } }, { new: true })
                await TeamOnePlay.deleteOne()
                await TeamTwoPlay.deleteOne()
                await TeamOnePlay.create({
                    id: newTeam1.id,
                    firstPlayer: newTeam1.firstPlayer,
                    secondPlayer: newTeam1.secondPlayer,
                    winCount: newTeam1.winCount,
                    update_by: update_by
                })
                await TeamTwoPlay.create({
                    id: newTeam2.id,
                    firstPlayer: newTeam2.firstPlayer,
                    secondPlayer: newTeam2.secondPlayer,
                    winCount: newTeam2.winCount,
                    update_by: update_by
                })
                if (isTeamOneWin) {
                    await PlayerQueues.insertMany([{
                        id: tempTeamTwo.id,
                        firstPlayer: tempTeamTwo.firstPlayer,
                        secondPlayer: tempTeamTwo.secondPlayer,
                        winCount: tempTeamTwo.winCount,
                        update_by: update_by
                    }, {
                        id: tempTeamOne.id,
                        firstPlayer: tempTeamOne.firstPlayer,
                        secondPlayer: tempTeamOne.secondPlayer,
                        winCount: tempTeamOne.winCount,
                        update_by: update_by
                    }])
                } else {
                    await PlayerQueues.insertMany([{
                        id: tempTeamOne.id,
                        firstPlayer: tempTeamOne.firstPlayer,
                        secondPlayer: tempTeamOne.secondPlayer,
                        winCount: tempTeamOne.winCount,
                        update_by: update_by
                    }, {
                        id: tempTeamTwo.id,
                        firstPlayer: tempTeamTwo.firstPlayer,
                        secondPlayer: tempTeamTwo.secondPlayer,
                        winCount: tempTeamTwo.winCount,
                        update_by: update_by
                    }])
                }
            }
            const body = await sendBody()
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
        console.log(resourceId)
        const deletedResource = await PlayerQueues.deleteOne({ id: resourceId })
        if (!deletedResource) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        const body = await sendBody()
        res.status(200).json(response(200, 'update data successfully', body))
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
})

router.delete('/deleteAll', async (req, res, next) => {
    const resourceId = req.params.id;
    try {
        await TeamOnePlay.deleteMany({})
        await TeamTwoPlay.deleteMany({})
        await PlayerQueues.deleteMany({})
        const body = await sendBody()
        res.status(200).json(response(200, 'update data successfully', body))
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
})

router.patch('/update/:id', async (req, res, next) => {
    const resourceId = req.params.id;
    try {
        await PlayerQueues.findOneAndUpdate({ id: resourceId }, { $set : req.body}, {new: true})
        const body = await sendBody()
        res.status(200).json(response(200, 'update data successfully', body))
    } catch (error) {
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
})

module.exports = router;