import express from 'express';
import {
  register,
  login,
  logout,
  refreshSession,
  getCurrentUser,
  updateCurrentUser,
  deleteCurrentUser,
  getAuthConfig,
} from '../controllers/auth.js';
import { createApiKey, listApiKeys, deleteApiKey } from '../controllers/apiKeys.js';
import { authenticate } from '../middlewares/auth.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const user_router = express.Router();

// Public auth routes
user_router.get('/auth-config', getAuthConfig); // { signupEnabled } — lets the client hide the signup form
user_router.post('/register', authRateLimiter(5, 60000), register);
user_router.post('/login', authRateLimiter(10, 60000), login);
user_router.post('/logout', logout); // clears both httpOnly cookies
user_router.post('/refresh', refreshSession); // issues new access token via refresh cookie
user_router.get('/me', authenticate, getCurrentUser);
user_router.put('/me', authenticate, updateCurrentUser);
user_router.delete('/me', authenticate, deleteCurrentUser);

// Protected API key management routes
user_router.post('/api-keys', authenticate, createApiKey);
user_router.get('/api-keys', authenticate, listApiKeys);
user_router.delete('/api-keys/:id', authenticate, deleteApiKey);

export default user_router;
