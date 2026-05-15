import express from 'express';
import {
  signup,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  changePassword
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authenticate.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/change-password', authenticateToken, changePassword);

export default router;
