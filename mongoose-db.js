// mongoose-db.js
const mongoose = require('mongoose');

// Define schemas
const TodoSchema = new mongoose.Schema({
  content: Buffer,
  updated_at: Date,
});

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

mongoose.model('Todo', TodoSchema);
mongoose.model('User', UserSchema);

// Determine Mongo URI
const mongoUri = process.env.MONGO_URL || 'mongodb://localhost/express-todo';
console.log('Using Mongo URI:', mongoUri);

// Connect
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

// Fired when successfully connected
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');

  const User = mongoose.model('User');
  User.findOne({ username: 'admin@snyk.io' }, (err, user) => {
    if (err) {
      console.error('Error finding admin user:', err);
      return;
    }
    if (!user) {
      console.log('No admin user found. Creating default admin...');
      new User({
        username: 'admin@snyk.io',
        password: 'SuperSecretPassword',
      }).save(err => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('✅ Admin user created');
        }
      });
    } else {
      console.log('Admin user already exists, skipping seeding.');
    }
  });
});

// Fired when connection fails
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

// Optional: when disconnected
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});
