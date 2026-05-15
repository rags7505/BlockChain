import express from 'express';
import {
  addWalletAddress,
  getUserPermissions,
  updateUserRole,
  getAllUsers,
} from '../controllers/adminController.js';

const router = express.Router();

// Admin routes
router.post('/add-wallet', addWalletAddress);
router.get('/users', getAllUsers);
router.get('/permissions/:walletAddress', getUserPermissions);
router.post('/update-role', updateUserRole);

export default router;
