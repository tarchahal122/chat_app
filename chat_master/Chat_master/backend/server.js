const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Successfully connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY'],
    default: 'AVAILABLE',
  },
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Define Mongoose models
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);


// Create Express application
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

// Middleware setup
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
}

// User login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status route
app.put('/status', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { status: req.body.status });
    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message route
app.post('/messages', authenticateToken, async (req, res) => {
  const { recipient, content } = req.body;

  try {
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) return res.status(400).json({ error: 'Recipient not found' });

    let finalContent = content;
    if (recipientUser.status === 'BUSY') {
      finalContent = await getLLMResponse(content) || 'I am currently unavailable. Please try again later.';
    }

    const message = new Message({
      sender: req.userId,
      recipient,
      content: finalContent,
    });
    await message.save();

    const recipientSocket = connectedUsers.get(recipient);
    if (recipientSocket) {
      recipientSocket.emit('message', message);
    }

    res.json({ message });
  } catch (err) {
    console.error('Message sending error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Retrieve messages route
app.get('/messages/:recipientId', authenticateToken, async (req, res) => {
  const { recipientId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: recipientId },
        { sender: recipientId, recipient: req.userId },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error('Message retrieval error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// LLM Response function
async function getLLMResponse(prompt) {
  try {
    const response = await axios.post(
      process.env.LLM_API_URL,
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        timeout: 10000,
      }
    );

    return response.data.result;
  } catch (err) {
    console.error('LLM API error:', err);
    return null;
  }
}

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (userId) => {
    console.log(`User ${userId} joined`);
    connectedUsers.set(userId, socket);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    connectedUsers.forEach((value, key) => {
      if (value === socket) {
        connectedUsers.delete(key);
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
