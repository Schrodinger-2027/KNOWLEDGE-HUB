const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// DB connection check
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define MongoDB Schema and Model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  number: String,
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve register page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Registration route
app.post('/register', async (req, res) => {
  const { name, email, password, number } = req.body;
  if (!name || !email || !password || !number) {
    return res.status(400).send('Missing field items');
  }
  if (password.length < 8) {
    return res.status(400).send('Password should be at least 8 characters');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).send('User already exists');
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashed, number });
  await newUser.save();

  return res.redirect('/login');
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login handler
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send('User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).send('Incorrect password');

    return res.redirect('/home');
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// Home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Tennis feedback
const desSchema = new mongoose.Schema({ description: String });
const des = mongoose.model('Des', desSchema);

app.post('/submit_tennis', async (req, res) => {
  try {
    const { description } = req.body;
    const desuserq = new des({ description });
    await desuserq.save();
    res.send('Feedback submitted!');
  } catch {
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
