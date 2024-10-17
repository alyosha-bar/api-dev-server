// models/User.js
const mongoose = require('mongoose');

const ApiSchema = new mongoose.Schema({
  names: [String],
  descriptions: [String],
  limits: [Number]
}, { timestamps: true });

module.exports = ApiSchema;
