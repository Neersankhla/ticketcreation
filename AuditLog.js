const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  traceId: {
    type: String,
    required: true
  },
  actor: {
    type: String,
    enum: ['system', 'agent', 'user'],
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'TICKET_CREATED',
      'TRIAGE_STARTED',
      'CATEGORY_CLASSIFIED',
      'KB_RETRIEVED',
      'DRAFT_GENERATED',
      'AUTO_CLOSED',
      'ASSIGNED_TO_HUMAN',
      'REPLY_SENT',
      'STATUS_CHANGED',
      'TICKET_ASSIGNED',
      'TRIAGE_FAILED'
    ]
  },
  meta: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ ticketId: 1, timestamp: -1 });
auditLogSchema.index({ traceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
