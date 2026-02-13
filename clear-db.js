const mongoose = require('../backend/node_modules/mongoose');
const bcrypt = require('../backend/node_modules/bcryptjs');

// Import models with correct paths
const User = require('../backend/src/models/User');
const Article = require('../backend/src/models/Article');
const Ticket = require('../backend/src/models/Ticket');
const Config = require('../backend/src/models/Config');

async function clearDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk');
    console.log('🔗 Connected to MongoDB');

    // Clear all collections
    console.log('🗑️  Clearing all data...');
    
    const results = await Promise.all([
      User.deleteMany({}),
      Article.deleteMany({}),
      Ticket.deleteMany({}),
      AgentSuggestion.deleteMany({}),
      AuditLog.deleteMany({}),
      Config.deleteMany({})
    ]);

    console.log('✅ Database cleared successfully!');
    console.log(`📊 Deleted:`);
    console.log(`   ${results[0].deletedCount} users`);
    console.log(`   ${results[10].deletedCount} articles`);
    console.log(`   ${results[11].deletedCount} tickets`);
    console.log(`   ${results[12].deletedCount} agent suggestions`);
    console.log(`   ${results[13].deletedCount} audit logs`);
    console.log(`   ${results[14].deletedCount} configs`);

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📁 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearDatabase();
