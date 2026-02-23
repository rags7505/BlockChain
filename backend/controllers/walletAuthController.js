import crypto from 'crypto';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate a nonce for signature verification
export const requestNonce = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    // Check if user exists (using admin client to bypass RLS)
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Wallet address not registered. Contact admin to assign role.',
      });
    }

    // Generate nonce
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store nonce in session (temporary, expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await supabaseAdmin.from('user_sessions').insert({
      wallet_address: walletAddress.toLowerCase(),
      nonce,
      session_token: 'pending', // Will be replaced after verification
      expires_at: expiresAt.toISOString(),
    });

    return res.status(200).json({
      success: true,
      nonce,
      message: `Sign this message to prove you own this wallet: ${nonce}`,
    });
  } catch (error) {
    console.error('REQUEST NONCE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
    });
  }
};

// Verify signature and create session
export const verifyWallet = async (req, res) => {
  try {
    const { walletAddress, signature, nonce } = req.body;

    if (!walletAddress || !signature || !nonce) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Verify signature
    const message = `Sign this message to prove you own this wallet: ${nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Signature verification failed',
      });
    }

    // Get user from database (using admin client to bypass RLS)
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not registered',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        walletAddress: user.wallet_address,
        role: user.role,
        displayName: user.display_name,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update session with token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabaseAdmin
      .from('user_sessions')
      .update({
        session_token: token,
        expires_at: expiresAt.toISOString(),
      })
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('nonce', nonce);

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('wallet_address', walletAddress.toLowerCase());

    return res.status(200).json({
      success: true,
      token,
      user: {
        walletAddress: user.wallet_address,
        role: user.role,
        displayName: user.display_name,
      },
    });
  } catch (error) {
    console.error('VERIFY WALLET ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Signature verification failed',
    });
  }
};

// Logout
export const logoutWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required',
      });
    }

    // Delete all sessions for this wallet
    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};

// Get all registered wallets (superadmin only)
export const getAllWallets = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('GET WALLETS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch wallets',
    });
  }
};

// Assign role to wallet (superadmin only)
export const assignRole = async (req, res) => {
  try {
    const { walletAddress, role, displayName } = req.body;

    if (!walletAddress || !role) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and role required',
      });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    const validRoles = ['superadmin', 'judge', 'investigator', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
      });
    }

    // Upsert user
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        wallet_address: walletAddress.toLowerCase(),
        role,
        display_name: displayName || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Role ${role} assigned to ${walletAddress}`,
      data,
    });
  } catch (error) {
    console.error('ASSIGN ROLE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign role',
    });
  }
};

export const deleteWallet = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    // Delete user from database
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase());

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Wallet ${walletAddress} deleted successfully`,
    });
  } catch (error) {
    console.error('DELETE WALLET ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete wallet',
    });
  }
};
