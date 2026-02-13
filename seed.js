const mongoose = require('../backend/node_modules/mongoose');
const bcrypt = require('../backend/node_modules/bcryptjs');

// Import models with correct paths
const User = require('../backend/src/models/User');
const Article = require('../backend/src/models/Article');
const Ticket = require('../backend/src/models/Ticket');
const Config = require('../backend/src/models/Config');

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk');
    console.log('📁 Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Article.deleteMany({}),
      Ticket.deleteMany({}),
      Config.deleteMany({})
    ]);

    // Create users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin'
      },
      {
        name: 'Support Agent',
        email: 'agent@example.com',
        password_hash: hashedPassword,
        role: 'agent'
      },
      {
        name: 'Janhvi Rajyaguru',
        email: 'user@example.com',
        password_hash: hashedPassword,
        role: 'user'
      },
      {
        name: 'Jane Verma',
        email: 'jane@example.com',
        password_hash: hashedPassword,
        role: 'user'
      }
    ]);

    const [admin, agent, user1, user2] = users;

    // Create knowledge base articles
    console.log('📚 Creating knowledge base articles...');
    const articles = await Article.create([
      {
        title: 'How to update your payment method',
        body: `To update your payment method in your account:

1. Log in to your account
2. Navigate to Account Settings
3. Click on "Billing & Payment Methods"
4. Click "Add Payment Method" or "Edit" next to existing method
5. Enter your new payment information
6. Click "Save Changes"

Your new payment method will be used for future transactions. You can also set it as your default payment method.

If you encounter any issues, please contact our support team.`,
        tags: ['billing', 'payments', 'account', 'credit card'],
        category: 'billing',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'Troubleshooting 500 Internal Server Errors',
        body: `If you're encountering a 500 Internal Server Error, try these steps:

**Immediate Steps:**
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Clear your browser cache and cookies
3. Try accessing the page in an incognito/private window
4. Disable browser extensions temporarily

**If the error persists:**
1. Try a different browser
2. Check if other pages work normally
3. Wait a few minutes and try again (temporary server issue)

**When to contact support:**
- Error persists after trying above steps
- You see specific error codes or messages
- The issue affects critical functionality

Please include the exact error message, browser type, and steps to reproduce when contacting support.`,
        tags: ['tech', 'errors', 'troubleshooting', '500', 'server'],
        category: 'tech',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'How to track your shipment',
        body: `Track your order easily with these steps:

**Finding your tracking number:**
1. Check your shipping confirmation email
2. Log in to your account and go to "Order History"
3. Your tracking number will be listed next to shipped items

**Tracking your package:**
1. Visit our tracking page
2. Enter your tracking number
3. Click "Track Package"

You'll see real-time updates including:
- Package picked up
- In transit
- Out for delivery
- Delivered

**Delivery timeframes:**
- Standard shipping: 3-5 business days
- Express shipping: 1-2 business days
- International: 7-14 business days

If your package appears stuck or delayed, please contact our support team with your tracking number.`,
        tags: ['shipping', 'delivery', 'tracking', 'orders'],
        category: 'shipping',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'Password reset instructions',
        body: `Reset your password securely:

**Step-by-step guide:**
1. Go to the login page
2. Click "Forgot Password?" below the login form
3. Enter your email address
4. Check your email for a reset link
5. Click the link in the email
6. Create a new strong password
7. Confirm your new password

**Password requirements:**
- At least 8 characters long
- Include uppercase and lowercase letters
- Include at least one number
- Include at least one special character

**Security tips:**
- Use a unique password for your account
- Consider using a password manager
- Don't share your password with others

The reset link expires in 24 hours for security. If you don't receive the email, check your spam folder or contact support.`,
        tags: ['tech', 'password', 'login', 'account', 'security'],
        category: 'tech',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'Refund policy and process',
        body: `Our refund policy ensures customer satisfaction:

**Refund eligibility:**
- Items purchased within the last 30 days
- Items in original condition
- Digital products within 7 days of purchase
- Services not yet delivered

**How to request a refund:**
1. Log in to your account
2. Go to "Order History"
3. Find the order and click "Request Refund"
4. Select the reason for the refund
5. Provide additional details if needed
6. Submit the request

**Refund processing:**
- Request reviewed within 1-2 business days
- Approved refunds processed within 3-5 business days
- Refund issued to original payment method
- Bank processing may take additional 2-3 days

**Non-refundable items:**
- Gift cards
- Personalized items
- Downloaded software after activation
- Services already delivered

Questions about your refund? Contact our support team with your order number.`,
        tags: ['billing', 'refund', 'policy', 'returns', 'money back'],
        category: 'billing',
        status: 'published',
        createdBy: admin._id
      },
      {
        title: 'Changing your shipping address',
        body: `Update your shipping address before your order ships:

**For unshipped orders:**
1. Log in to your account
2. Go to "Order History"
3. Find your order
4. Click "Edit Shipping Address"
5. Enter your new address
6. Click "Update Address"

**For shipped orders:**
Contact our support team immediately. We may be able to:
- Redirect the package (additional fees may apply)
- Contact the shipping carrier
- Arrange for package hold at local facility

**Address change restrictions:**
- Changes only possible before order ships
- Some express shipping orders cannot be changed
- International addresses have specific requirements

**Tips to avoid issues:**
- Double-check address during checkout
- Ensure apartment numbers are included
- Verify ZIP codes are correct
- Consider using a work address if you won't be home

Need help with address changes? Contact support with your order number and new address details.`,
        tags: ['shipping', 'address', 'orders', 'delivery', 'change'],
        category: 'shipping',
        status: 'published',
        createdBy: admin._id
      }
    ]);

    // Create sample tickets
    console.log('🎫 Creating sample tickets...');
    const tickets = await Ticket.create([
      {
        title: 'Refund for double charge on my card',
        description: 'I was charged twice for order #12345. I can see two identical charges on my credit card statement for $99.99 each. I only made one purchase and received one confirmation email. Please help me get a refund for the duplicate charge.',
        category: 'billing',
        createdBy: user1._id,
        status: 'open'
      },
      {
        title: 'Getting 500 error when trying to login',
        description: 'Every time I try to log into my account, I get a "500 Internal Server Error" message. I\'ve tried different browsers and cleared my cache, but the problem persists. The error started happening yesterday after I tried to update my profile. I need to access my account to check my recent orders.',
        category: 'tech',
        createdBy: user2._id,
        status: 'open'
      },
      {
        title: 'My package has been delayed for a week',
        description: 'I ordered a laptop on July 15th with express shipping, and it was supposed to arrive by July 18th. The tracking shows it\'s been sitting at the Memphis facility for over a week with no updates. Order number is #67890. I need this for work and it\'s causing significant delays. What can be done?',
        category: 'shipping',
        createdBy: user1._id,
        status: 'open'
      },
      {
        title: 'Cannot access premium features after subscription',
        description: 'I upgraded to the premium plan yesterday but I still can\'t access the premium features. My payment went through (I have the confirmation email) but my account still shows as "Basic Plan". I tried logging out and back in, but nothing changed.',
        category: 'tech',
        createdBy: user2._id,
        status: 'waiting_human',
        assignee: agent._id
      },
      {
        title: 'Wrong item shipped - received size Medium instead of Large',
        description: 'I ordered a Large blue t-shirt (Product ID: TS-001-L-BLU) but received a Medium instead. The order confirmation shows Large, but the shipped item is clearly marked Medium. I need to exchange this for the correct size. The order number is #11111.',
        category: 'shipping',
        createdBy: user1._id,
        status: 'resolved',
        assignee: agent._id,
        replies: [
          {
            author: agent._id,
            content: 'Hi there! I apologize for the shipping error. I\'ve arranged for a replacement Large t-shirt to be sent to you with express shipping at no charge. You should receive it within 2-3 business days. You can keep the Medium shirt as compensation for the inconvenience. Your replacement order number is #11111-R. Is there anything else I can help you with?',
            isAgent: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ]
      }
    ]);

    // Create system configuration
    console.log('⚙️ Creating system configuration...');
    await Config.create({
      autoCloseEnabled: true,
      confidenceThreshold: 0.78,
      slaHours: 24,
      categoryThresholds: {
        billing: 0.78,
        tech: 0.85,
        shipping: 0.75,
        other: 0.80
      }
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔐 Login credentials:');
    console.log('👤 Admin: admin@example.com / password123');
    console.log('🛠️  Agent: agent@example.com / password123');
    console.log('👥 User 1: user@example.com / password123');
    console.log('👥 User 2: jane@example.com / password123');
    
    console.log('\n📊 Created:');
    console.log(`   ${users.length} users`);
    console.log(`   ${articles.length} knowledge base articles`);
    console.log(`   ${tickets.length} sample tickets`);
    console.log('   1 system configuration');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📁 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
