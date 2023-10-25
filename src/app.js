const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const Eureka = require('eureka-js-client').Eureka;
const eurekaHelper = require('./eureka-helper'); // Import the Eureka helper

const PORT = process.env.PORT || 3000;

// Create an Express app
const app = express();

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// Connect to the MongoDB database
mongoose.connect('mongodb://127.0.0.1:27017/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to the MongoDB database');
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Define a MongoDB schema and model for users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String } // Not defined as "required"
});

const User = mongoose.model('User', userSchema);

// Route for user login (signIn)
app.post('/signIn', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user in the database by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Incorrect username.' });
    }

    // Compare the stored password with the provided password
    if (password !== user.password) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }

    // Generate and send an authentication token
    const token = generateAuthToken(user);
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

// Route for user registration (signUp)
app.post('/users', async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ message: 'This user already exists.' });
    }

    // Create a new user
    const newUser = new User({ username, password, email });

    // Save the new user to the database
    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
});

app.listen(PORT, () => {
  console.log("user-service on 3000");
})

app.get('/', (req, res) => {
 res.json("I am authentification")
})
eurekaHelper.registerWithEureka('authentification', PORT);

// Function to generate an authentication token
function generateAuthToken(user) {
  const token = jwt.sign({ _id: user._id, username: user.username }, 'your_secret_key');
  return token;
}
