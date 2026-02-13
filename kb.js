const express = require('express');
const Joi = require('joi');
const Article = require('../models/Article');

const router = express.Router();

// Validation schemas
const articleSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  body: Joi.string().min(10).required(),
  tags: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().valid('billing', 'tech', 'shipping', 'other').required(),
  status: Joi.string().valid('draft', 'published').optional()
});

// Search articles
router.get('/', async (req, res) => {
  try {
    const { query, category, status = 'published', page = 1, limit = 10 } = req.query;
    
    let filter = { status };
    
    if (category) {
      filter.category = category;
    }

    if (query) {
      filter.$text = { $search: query };
    }

    const articles = await Article.find(filter)
      .populate('createdBy', 'name')
      .sort(query ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Article.countDocuments(filter);

    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search articles error:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Create article (admin only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error, value } = articleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const article = new Article({
      ...value,
      createdBy: req.user.id
    });

    await article.save();

    const populatedArticle = await Article.findById(article._id)
      .populate('createdBy', 'name email');

    res.status(201).json({ article: populatedArticle });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

// Update article (admin only)
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error, value } = articleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.message });
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { ...value, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// Delete article (admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

module.exports = router;
