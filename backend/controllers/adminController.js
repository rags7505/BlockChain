import { supabaseAdmin } from '../config/supabase.js';
import { ethers } from 'ethers';

// Add new wallet address with viewer role and evidence access
export const addWalletAddress = async (req, res) => {
  try {
    const { walletAddress, displayName, allowedEvidenceIds } = req.body;

    // Validate input
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address',
      });
    }

    // Check if wallet already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address already registered',
      });
    }

    // Create new user with viewer role
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert([{
        wallet_address: walletAddress.toLowerCase(),
        display_name: displayName || `User ${walletAddress.slice(0, 6)}`,
        role: 'viewer',
      }])
      .select()
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create user',
      });
    }

    // Add evidence permissions if specified
    if (allowedEvidenceIds && allowedEvidenceIds.length > 0) {
      const permissions = allowedEvidenceIds.map(evidenceId => ({
        user_wallet: walletAddress.toLowerCase(),
        evidence_id: evidenceId,
        can_view: true,
      }));

      const { error: permError } = await supabaseAdmin
        .from('user_evidence_permissions')
        .insert(permissions);

      if (permError) {
        console.error('Error adding permissions:', permError);
        // Don't fail the whole operation, just log it
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: newUser.wallet_address,
        displayName: newUser.display_name,
        role: newUser.role,
        allowedEvidenceIds: allowedEvidenceIds || [],
      },
      message: 'Wallet address added successfully with viewer role',
    });
  } catch (error) {
    console.error('ADD WALLET ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Get user's evidence permissions
export const getUserPermissions = async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_evidence_permissions')
      .select('*')
      .eq('user_wallet', walletAddress.toLowerCase());

    if (error) {
      console.error('Error fetching permissions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch permissions',
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('GET PERMISSIONS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Update user role (for investigator to grant investigator role)
export const updateUserRole = async (req, res) => {
  try {
    const { walletAddress, newRole } = req.body;

    // Validate role
    if (!['viewer', 'investigator'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Only viewer or investigator allowed.',
      });
    }

    // Update user role
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: newRole })
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update role',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        walletAddress: data.wallet_address,
        role: data.role,
      },
      message: `Role updated to ${newRole}`,
    });
  } catch (error) {
    console.error('UPDATE ROLE ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Get all users (for admin to see)
export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
      });
    }

    return res.status(200).json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('GET USERS ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
