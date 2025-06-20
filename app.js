const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define MongoDB Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  confirm_password: String,
  number: String,
  privacy_policy: Boolean,
});

// Define MongoDB Model
const User = mongoose.model('User', userSchema);

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to handle POST request from the form
app.post('/home', async (req, res) => {
  const { name, email, password, confirm_password, number, privacy_policy } = req.body;

  
  try {
    // Create a new user instance
    const newUser = new User({
      name,
      email,
      password,
      confirm_password,
      number,
      privacy_policy,
    });

    // Save the user to the database
    await newUser.save();

    res.send('Registration successful!');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login',function (req,res){
    res.sendFile(__dirname+'/login.html')
})

app.post('/login',async function(req,res){

    const { email, password } = req.body;

  try {
    // Check if user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the provided password matches the stored password
    if (user.password !== password) {
      return res.status(401).send('Incorrect password');
    }

    // Authentication successful
    res.send('Login successful!');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }

    

})
app.get('/tennis.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'tennis.html'));
});
const desSchema = new mongoose.Schema({
    description: String,
    
  });
  
  // Define MongoDB Model
  const des = mongoose.model('Des', desSchema);
app.post('/submit_tennis', async (req, res) => {
    
        // Extract data from the request body
        const { description } = req.body;
        
       
  try {
    // Create a new user instance
    const desuserq = new des({
      description,
    });

    // Save the user to the database
    await desuserq.save();

    res.send('Feedback submitted!');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }

});
// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
