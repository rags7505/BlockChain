import express from 'express';
import {
  requestNonce,
  verifyWallet,
  logoutWallet,
  getAllWallets,
  assignRole,
  deleteWallet,
} from '../controllers/walletAuthController.js';

const router = express.Router();

// Public routes
router.post('/request-nonce', requestNonce);
router.post('/verify', verifyWallet);
router.post('/logout', logoutWallet);

// Protected routes (add auth middleware later)
router.get('/wallets', getAllWallets); // List all registered wallets
router.post('/assign-role', assignRole); // Assign role to wallet
router.delete('/wallets/:walletAddress', deleteWallet); // Delete wallet

export default router;
