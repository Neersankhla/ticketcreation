const Queue = require('bull');
const axios = require('axios');
const winston = require('winston');
const Ticket = require('../models/Ticket');
const AgentSuggestion = require('../models/AgentSuggestion');
const Config = require('../models/Config');
const auditService = require('./auditService');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const triageQueue = new Queue('triage', process.env.REDIS_URL);

// Process triage jobs
triageQueue.process(5, async (job) => {
  const { ticketId, traceId } = job.data;
  
  logger.info(`Processing triage for ticket ${ticketId}`, { traceId });

  try {
    const ticket = await Ticket.findById(ticketId).populate('createdBy');
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    await auditService.log({
      ticketId,
      traceId,
      actor: 'system',
      action: 'TRIAGE_STARTED',
      meta: { ticketTitle: ticket.title }
    });

    // Call agent service
    const response = await axios.post(
      `${process.env.AGENT_SERVICE_URL}/triage`,
      {
        ticket: {
          id: ticketId,
          title: ticket.title,
          description: ticket.description,
          category: ticket.category
        },
        traceId
      },
      {
        timeout: 30000,
        headers: { 'X-Trace-ID': traceId }
      }
    );

    const { suggestion, processingTimeMs } = response.data;

    // Save agent suggestion
    const agentSuggestion = new AgentSuggestion({
      ticketId,
      predictedCategory: suggestion.predictedCategory,
      articleIds: suggestion.articleIds || [],
      draftReply: suggestion.draftReply,
      confidence: suggestion.confidence,
      modelInfo: {
        ...suggestion.modelInfo,
        latencyMs: processingTimeMs
      }
    });

    await agentSuggestion.save();

    // Update ticket
    ticket.agentSuggestionId = agentSuggestion._id;
    ticket.status = 'triaged';
    ticket.updatedAt = new Date();

    // Check auto-close conditions
    const config = await Config.findOne() || new Config();
    const threshold = config.categoryThresholds?.[suggestion.predictedCategory] 
      || config.confidenceThreshold;

    const shouldAutoClose = config.autoCloseEnabled && 
                           suggestion.confidence >= threshold;

    if (shouldAutoClose) {
      // Auto-close the ticket
      ticket.status = 'resolved';
      ticket.replies.push({
        author: null,
        content: suggestion.draftReply,
        isAgent: true
      });
      
      agentSuggestion.autoClosed = true;
      await agentSuggestion.save();

      await auditService.log({
        ticketId,
        traceId,
        actor: 'system',
        action: 'AUTO_CLOSED',
        meta: {
          confidence: suggestion.confidence,
          threshold,
          suggestionId: agentSuggestion._id
        }
      });
    } else {
      // Assign to human
      ticket.status = 'waiting_human';
      
      await auditService.log({
        ticketId,
        traceId,
        actor: 'system',
        action: 'ASSIGNED_TO_HUMAN',
        meta: {
          confidence: suggestion.confidence,
          threshold,
          reason: 'confidence_below_threshold'
        }
      });
    }

    await ticket.save();

    logger.info(`Triage completed for ticket ${ticketId}`, {
      traceId,
      autoClosed: shouldAutoClose,
      confidence: suggestion.confidence
    });

  } catch (error) {
    logger.error(`Triage failed for ticket ${ticketId}:`, error);
    
    // Update ticket status to indicate triage failure
    await Ticket.findByIdAndUpdate(ticketId, {
      status: 'waiting_human',
      updatedAt: new Date()
    });

    await auditService.log({
      ticketId,
      traceId,
      actor: 'system',
      action: 'TRIAGE_FAILED',
      meta: {
        error: error.message,
        stack: error.stack
      }
    });

    throw error;
  }
});

// Queue a triage job
const queueTriage = async (ticketId, traceId) => {
  const job = await triageQueue.add(
    'triage',
    { ticketId, traceId },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    }
  );

  logger.info(`Queued triage job for ticket ${ticketId}`, { jobId: job.id, traceId });
  return job;
};

module.exports = {
  queueTriage,
  triageQueue
};
