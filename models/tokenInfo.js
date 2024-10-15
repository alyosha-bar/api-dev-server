const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    _id: String,
    userVersion: Number,
    userToken: String,
    revoked: Boolean
}, { timestamps: true });

module.exports = TokenSchema
