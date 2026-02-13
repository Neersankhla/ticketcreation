const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  autoCloseEnabled: {
    type: Boolean,
    default: true
  },
  confidenceThreshold: {
    type: Number,
    default: 0.78,
    min: 0,
    max: 1
  },
  slaHours: {
    type: Number,
    default: 24
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  categoryThresholds: {
    billing: { type: Number, default: 0.78 },
    tech: { type: Number, default: 0.85 },
    shipping: { type: Number, default: 0.75 },
    other: { type: Number, default: 0.80 }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Config', configSchema);
