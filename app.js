const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/myapp');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  number: String,
  verified: { type: Boolean, default: false },
  verificationToken: String
});
const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
  secret: '4c7e629c09b94a3cbe5c7b9ddbd13462ff2df0a8b24dca12eb5a2214dafe5f79', // should be strong and stored in .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/myapp',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true
  }
}));

const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];

app.use((req, res, next) => {
  if (publicRoutes.includes(req.path) || req.path.startsWith('/verify-email')) {
    return next(); // allow public routes
  }
  if (req.session.userId) {
    return next(); // user is logged in, allow
  }
  // not logged in, redirect to login page
  res.redirect('/login');
});


function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  }
});

// Register Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Login Page
app.get('/login', loginLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Home Page
app.get('/home', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Register API
app.post('/register', async (req, res) => {
  const { name, email, password, number } = req.body;
  if (!name || !email || !password || !number) return res.status(400).send('Missing field items');
  if (password.length < 8) return res.status(400).send('Password too short');

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).send('User already exists');

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const newUser = new User({ name, email, password: hashed, number, verificationToken });
  await newUser.save();

  const link = `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'Schrodinger2027@gmail.com',
      pass: 'qxcr gwmf zpsn pene'
    }
  });

  await transporter.sendMail({
    from: 'your_email@gmail.com',
    to: email,
    subject: 'Verify Email',
    text: `Click to verify: ${link}`
  });

res.send('Registration successful. Please check your email to verify your account.');

});

// Verify Email
app.get('/verify-email', async (req, res) => {
  const { email, token } = req.query;
  const user = await User.findOne({ email, verificationToken: token });

  if (!user) return res.status(400).send('Invalid/expired link');
  user.verified = true;
  user.verificationToken = undefined;
  await user.save();

  res.redirect('/login');

});

// Login API
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');
  if (!user.verified) return res.status(403).send('Please verify your email');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).send('Wrong password');
  req.session.userId = user._id;
  res.redirect('/home');
});

// Schema for forget password
const tokenSchema = new mongoose.Schema({
  email: String,
  token: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 } // 1 hour expiry
});
const Token = mongoose.model('Token', tokenSchema);

const forgotPasswordHtml = path.join(__dirname, 'public', 'forgot-password.html');
app.get('/forgot-password', (req, res) => {
  res.sendFile(forgotPasswordHtml);
});

// for sending email to user
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send('User not found');

  const resetToken = crypto.randomBytes(32).toString('hex');
  await Token.findOneAndDelete({ email }); // Remove old token
  await new Token({ email, token: resetToken }).save();

  const resetLink = `http://localhost:3000/reset-password?token=${resetToken}&email=${email}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'Schrodinger2027@gmail.com',
      pass: 'qxcr gwmf zpsn pene'
    }
  });

  await transporter.sendMail({
    from: 'your_email@gmail.com',
    to: email,
    subject: 'Reset Password',
    text: `Click here to reset your password: ${resetLink}`
  });

  res.send('Reset link sent to your email.');
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  const validToken = await Token.findOne({ email, token });
  if (!validToken) return res.status(400).send('Invalid or expired token');

  const hashed = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate({ email }, { password: hashed });
  await Token.deleteOne({ email });

  res.send('/login');
});



// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
