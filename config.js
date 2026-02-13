const express = require('express');
const Joi = require('joi');
const Config = require('../models/Config');

const router = express.Router();

const configSchema = Joi.object({
  autoCloseEnabled: Joi.boolean().optional(),
  confidenceThreshold: Joi.number().min(0).max(1).optional(),
  slaHours: Joi.number().min(1).optional(),
  categoryThresholds: Joi.object({
    billing: Joi.number().min(0).max(1).optional(),
    tech: Joi.number().min(0).max(1).optional(),
    shipping: Joi.number().min(0).max(1).optional(),
    other: Joi.number().min(0).max(1).optional()
  }).optional()
});

// Get config
router.get('/', async (req, res) => {
  try {
    let config = await Config.findOne();
    
    if (!config) {
      config = new Config();
      await config.save();
    }

    res.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// Update config (admin only)
router.put('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error, value } = configSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.message });
    }

    let config = await Config.findOne();
    
    if (!config) {
      config = new Config(value);
    } else {
      Object.assign(config, value);
      config.updatedAt = new Date();
    }

    await config.save();

    res.json({ config });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

module.exports = router;
