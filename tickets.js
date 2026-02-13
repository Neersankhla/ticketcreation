const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const Ticket = require('../models/Ticket');
const AgentSuggestion = require('../models/AgentSuggestion');

const router = express.Router();

/* ================= VALIDATION SCHEMAS ================= */

const createTicketSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string()
    .valid('Billing', 'Tech', 'Shipping', 'Other', 'billing', 'tech', 'shipping', 'other')
    .optional(),
  attachmentUrls: Joi.array().items(Joi.string().uri()).optional()
});

const replySchema = Joi.object({
  content: Joi.string().min(5).max(2000).required(),
  changeStatus: Joi.string().valid('resolved', 'closed', 'waiting_human').optional()
});

/* ================= CREATE TICKET ================= */

router.post('/', async (req, res) => {
  try {
    const { error, value } = createTicketSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const ticket = new Ticket({
      title: value.title,
      description: value.description,
      category: value.category?.toLowerCase() || 'other',
      status: 'open',
      createdBy: null   // SAFE (avoid ObjectId crash)
    });

    await ticket.save();

    return res.status(201).json({ ticket });

  } catch (err) {
  console.error("🔥 REAL BACKEND ERROR:");
  console.error(err);
  return res.status(500).json({
    error: err.message
  });
}

});

/* ================= GET ALL TICKETS ================= */

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const tickets = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error("GET TICKETS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= GET SINGLE TICKET ================= */

router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket });

  } catch (err) {
    console.error("GET SINGLE TICKET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADD REPLY ================= */

router.post('/:id/reply', async (req, res) => {
  try {
    const { error, value } = replySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.replies.push({
      content: value.content,
      isAgent: true
    });

    if (value.changeStatus) {
      ticket.status = value.changeStatus;
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    res.json({ ticket });

  } catch (err) {
    console.error("ADD REPLY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ASSIGN TICKET ================= */

router.post('/:id/assign', async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.status = 'waiting_human';
    ticket.updatedAt = new Date();

    await ticket.save();

    res.json({ ticket });

  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
