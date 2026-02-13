const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/src/server');
const User = require('../../backend/src/models/User');
const Ticket = require('../../backend/src/models/Ticket');

describe('Tickets', () => {
  let userToken;
  let agentToken;
  let userId;
  let agentId;

  beforeAll(async () => {
    const testDB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/helpdesk-test';
    await mongoose.connect(testDB);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Ticket.deleteMany({});

    // Create test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123'
      });
    
    userToken = userResponse.body.token;
    userId = userResponse.body.user.id;

    // Create test agent
    const agentResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Agent',
        email: 'agent@example.com',
        password: 'password123',
        role: 'agent'
      });
    
    agentToken = agentResponse.body.token;
    agentId = agentResponse.body.user.id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/tickets', () => {
    it('should create a ticket', async () => {
      const ticketData = {
        title: 'Test ticket title',
        description: 'This is a test ticket description with enough characters',
        category: 'tech'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ticketData)
        .expect(201);

      expect(response.body.ticket).toMatchObject({
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        status: 'open'
      });
    });

    it('should not create ticket without authentication', async () => {
      const ticketData = {
        title: 'Test ticket',
        description: 'Test description',
        category: 'tech'
      };

      await request(app)
        .post('/api/tickets')
        .send(ticketData)
        .expect(401);
    });

    it('should not create ticket with invalid data', async () => {
      const ticketData = {
        title: 'Hi', // Too short
        description: 'Short', // Too short
        category: 'invalid'
      };

      await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(ticketData)
        .expect(400);
    });
  });

  describe('GET /api/tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      await Ticket.create([
        {
          title: 'User Ticket 1',
          description: 'Description for user ticket 1',
          createdBy: userId,
          category: 'tech'
        },
        {
          title: 'User Ticket 2',
          description: 'Description for user ticket 2',
          createdBy: userId,
          category: 'billing'
        }
      ]);
    });

    it('should get user tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.tickets).toHaveLength(2);
      expect(response.body.tickets[0].createdBy._id).toBe(userId);
    });

    it('should filter tickets by status', async () => {
      const response = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.tickets).toHaveLength(2);
      response.body.tickets.forEach(ticket => {
        expect(ticket.status).toBe('open');
      });
    });
  });

  describe('POST /api/tickets/:id/reply', () => {
    let ticketId;

    beforeEach(async () => {
      const ticket = await Ticket.create({
        title: 'Test Ticket',
        description: 'Test description',
        createdBy: userId,
        category: 'tech'
      });
      ticketId = ticket._id;
    });

    it('should allow agent to reply', async () => {
      const replyData = {
        content: 'This is an agent reply to help resolve the issue'
      };

      const response = await request(app)
        .post(`/api/tickets/${ticketId}/reply`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send(replyData)
        .expect(200);

      expect(response.body.ticket.replies).toHaveLength(1);
      expect(response.body.ticket.replies[0].content).toBe(replyData.content);
      expect(response.body.ticket.replies.isAgent).toBe(true);
    });

    it('should not allow user to reply', async () => {
      const replyData = {
        content: 'User trying to reply'
      };

      await request(app)
        .post(`/api/tickets/${ticketId}/reply`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(replyData)
        .expect(403);
    });
  });
});
