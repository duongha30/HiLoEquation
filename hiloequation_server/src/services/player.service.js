const playerModel = require('../models/Player.model');

const findByEmail = async ({ email, select = {
    email: 1, password: 1, name: 1, status: 1
} }) => {
    return await playerModel.findOne({ email }).select(select).lean();
}

module.exports = {
    findByEmail
}