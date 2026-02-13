const express = require('express');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get audit logs for a ticket
router.get('/tickets/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check permissions - only ticket owner, assignee, or admin/agent can view
    if (req.user.role === 'user') {
      const Ticket = require('../models/Ticket');
      const ticket = await Ticket.findById(ticketId);
      
      if (!ticket || ticket.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const logs = await AuditLog.find({ ticketId })
      .sort({ timestamp: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments({ ticketId });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
