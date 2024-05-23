import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './App.css';

// Initialize socket.io client with WebSocket transport
const socket = io('http://localhost:5000', { transports: ['websocket'] });

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('AVAILABLE');
  const [userId,setUserId]=useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }

    socket.on('message', (message) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      const { token, temp: userId } = response.data;
  
      console.log('Login response:', response.data);
  
      setToken(token);
      setUserId(userId);
      localStorage.setItem('token', token);
  
      console.log('User ID after login:', userId);
  
      socket.emit('join', userId);
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  const handleRegister = async () => {
    try {
      const response = await axios.post('http://localhost:5000/register', { email, password });
      const { message } = response.data;
  
      console.log('Registration response:', message);
  
      // Optionally handle user ID or token if needed post registration
      // setUserId(userId);
      // socket.emit('join', userId);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };
  

  const handleSendMessage = async () => {
    try {
      const res_yogi = await axios.post(
        'http://localhost:5000/messages',
        { recipient, content: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const { message } = res_yogi.data;
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log('newStatus '+newStatus);
      const response=await axios.put(
        'http://localhost:5000/status',
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const ok_message=response.data;
      console.log(ok_message);
      console.log('status old '+status);
      setStatus(newStatus);
      console.log('status new '+ status);
    } catch (err) {
      console.log('test error');
      console.error(err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="container">
      {!token ? (
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      ) : (
        <div>
        </div>
      )}
    </div>
  );
}

export default App;


