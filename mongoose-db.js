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

// Get Mongo URI
let mongoUri = process.env.MONGO_URI || 'mongodb://localhost/express-todo';

// Optional Cloud Foundry support
try {
  const cfenv = require("cfenv");
  const mongoCFUri = cfenv.getAppEnv().getServiceURL('goof-mongo');
  if (mongoCFUri) {
    mongoUri = mongoCFUri;
  }
} catch (err) {
  // cfenv not available, skip
}

// Log Mongo URI being used
console.log("Using Mongo URI:", mongoUri);

// Connect to MongoDB
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");

    const User = mongoose.model('User');
    User.findOne({ username: 'admin@snyk.io' }).then(user => {
      if (!user) {
        console.log('Admin user not found. Creating default admin...');
        new User({
          username: 'admin@snyk.io',
          password: 'SuperSecretPassword',
        }).save().then(() => {
          console.log('Admin user created');
        }).catch(err => {
          console.error('Error creating admin user:', err);
        });
      }
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
