# Crypto App Backend

Node.js + Express + MongoDB backend for the Crypto App.

## Features

- User authentication (JWT-based)
- Portfolio management
- Transaction tracking (buy/sell)
- RESTful API structure
- MongoDB integration
- Error handling middleware
- CORS enabled

## Project Structure

```
backend/
├── bin/
│   └── www                 # Server entry point
├── config/
│   └── database.js         # MongoDB connection
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── portfolioController.js  # Portfolio management
│   └── transactionController.js # Transaction handling
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── errorHandler.js    # Error handling middleware
├── models/
│   ├── User.js            # User model
│   ├── Portfolio.js       # Portfolio model
│   └── Transaction.js     # Transaction model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── portfolio.js       # Portfolio routes
│   └── transactions.js    # Transaction routes
├── app.js                 # Express app configuration
├── package.json
└── .env.example           # Environment variables template
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crypto-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

3. Make sure MongoDB is running on your system or update `MONGODB_URI` with your MongoDB connection string.

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Portfolio
- `GET /api/portfolio` - Get user's portfolio (protected)
- `GET /api/portfolio/summary` - Get portfolio summary (protected)

### Transactions
- `GET /api/transactions` - Get all transactions (protected)
- `POST /api/transactions` - Create a new transaction (protected)
- `GET /api/transactions/:id` - Get transaction by ID (protected)

### Health Check
- `GET /api/health` - Server health check

## Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Example Requests

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Transaction
```bash
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "buy",
  "cryptoId": "bitcoin",
  "cryptoSymbol": "BTC",
  "cryptoName": "Bitcoin",
  "amount": 0.5,
  "price": 50000
}
```

## Technologies Used

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- dotenv (environment variables)
- CORS

