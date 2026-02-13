const AuditLog = require('../models/AuditLog');

const log = async ({ ticketId, traceId, actor, action, meta = {} }) => {
  try {
    const auditLog = new AuditLog({
      ticketId,
      traceId,
      actor,
      action,
      meta,
      timestamp: new Date()
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    throw error;
  }
};

module.exports = {
  log
};
