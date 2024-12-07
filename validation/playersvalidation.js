const Joi = require('joi');

const playersvalidator = Joi.object({
    // id: Joi.string().required(),
    firstPlayer: Joi.string().required(),
    secondPlayer: Joi.string().required(),
    winCount: Joi.number(),
    update_at: Joi.date(),
    update_by: Joi.string().required(),
    courtId: Joi.number().required()
});

module.exports = playersvalidator