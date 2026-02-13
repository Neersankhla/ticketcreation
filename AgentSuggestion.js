const mongoose = require('mongoose');

const agentSuggestionSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  predictedCategory: {
    type: String,
    enum: ['billing', 'tech', 'shipping', 'other'],
    required: true
  },
  articleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  draftReply: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  autoClosed: {
    type: Boolean,
    default: false
  },
  modelInfo: {
    provider: {
      type: String,
      default: 'gemini'
    },
    model: {
      type: String,
      default: 'gemini-pro'
    },
    promptVersion: {
      type: String,
      default: 'v1.0'
    },
    latencyMs: {
      type: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

agentSuggestionSchema.index({ ticketId: 1 });

module.exports = mongoose.model('AgentSuggestion', agentSuggestionSchema);
