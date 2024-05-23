# Chat App Server

This repository contains the server-side code for a chat application developed using Node.js, Express, Socket.IO, and MongoDB. The application enables users to register, authenticate, update their status (available or busy), send messages to other users, and receive real-time messages via Socket.IO.

## Features

-User registration and authentication using JWT tokens
-User status management (available or busy)
-Real-time messaging functionality for seamless communication
-Integration with a sophisticated language model (LLM) for automated responses when users are unavailable
-Utilization of Socket.IO for efficient and responsive real-time messaging

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js
- MongoDB (or a MongoDB Atlas cluster)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-repo/chat-app-server.git
```

2. Navigate to the project directory:

```bash
cd chat-app-server
```

3. Install the dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory and add the following environment variables:

```
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
LLM_API_KEY=<your-llm-api-key>
```

Replace the placeholders with your actual MongoDB URI, JWT secret, and LLM API key.

## Usage

1. Start the server:

```bash
npm start
```

The server will start running on `http://localhost:5000`.

### Interact with the API endpoints using tools like Postman or cURL:

`POST /register`: Register a new user
`POST /login`: Log in and receive a JWT token
`PUT /status`: Update user status (authentication required)
`POST /messages`: Send a message to another user (authentication required)
`GET /messages/:recipientId`: Retrieve messages with a specific recipient (authentication required)

### For real-time messaging, connect to the Socket.IO server using the socket.io-client library in your client application. Use the following events:
`join`: Join a user's room
`message`: Receive new messages from other users

