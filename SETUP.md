# 🚀 Complete Setup Guide - Forensic Chain of Custody System

This guide will help you clone and set up the entire project from scratch. Follow these steps carefully to get the system running on your machine.

---

## 📋 Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **pnpm** (comes with Node.js)
- **MetaMask** browser extension - [Install](https://metamask.io/)
- **Git** - [Download](https://git-scm.com/)
- A **Supabase** account - [Sign up free](https://supabase.com/)

---

## 📥 Step 1: Clone the Repository

```bash
git clone <repository-url>
cd forensic-chain-custody
```

---

## 🔧 Step 2: Install Dependencies

Install dependencies for all three parts of the project:

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install

# Blockchain dependencies
cd ../blockchain
npm install

# Return to root
cd ..
```

---

## 🗄️ Step 3: Set Up Supabase Database

### 3.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Fill in:
   - **Name**: forensic-chain-custody (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to you
4. Wait for project creation (takes ~2 minutes)

### 3.2 Get Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values (you'll need them for `.env` files):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (⚠️ Keep this secret!)

### 3.3 Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Run these SQL files in order:

#### File 1: `backend/supabase-auth-setup.sql`
- Creates `users` and `evidences` tables
- Sets up initial structure

#### File 2: `backend/migrations/wallet-auth-migration.sql`
- Adds wallet authentication support
- Adds user roles (judge, investigator, viewer)

#### File 3: `backend/migrations/add-current-holder.sql`
- Adds current custody holder tracking

#### File 4: `backend/migrations/enable-rls-security.sql`
- Enables Row Level Security (RLS)
- Sets up security policies

#### File 5: `backend/migrations/user-evidence-permissions.sql`
- Creates permission system for evidence access

**How to run:**
- Open each file
- Copy the entire SQL content
- Paste into Supabase SQL Editor
- Click **"Run"**

### 3.4 Create Initial Admin User

1. In Supabase SQL Editor, run this SQL to create your first admin (judge) user:

```sql
INSERT INTO users (wallet_address, role, name, username)
VALUES (
  'YOUR_METAMASK_WALLET_ADDRESS',  -- Replace with your actual MetaMask address
  'judge',
  'Admin User',
  'admin'
);
```

**To get your MetaMask address:**
- Open MetaMask extension
- Click on your account name at the top
- Your address will be copied (starts with 0x...)

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Backend Environment (`.env`)

Create `backend/.env` file:

```env
# Backend Server Port
PORT=5000

# Supabase Configuration
# Get these from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Authentication
# Generate a random string (at least 32 characters)
# You can use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-random-jwt-secret-at-least-32-chars-long

# Blockchain Configuration (for Hardhat local network)
RPC_URL=http://127.0.0.1:8545

# PRIVATE_KEY: Use Hardhat's first test account for local development
# Get this from the Hardhat node terminal output when you run: npx hardhat node
# It will show Account #0 with its private key
# For production: generate a new secure private key
PRIVATE_KEY=your-hardhat-test-account-private-key-here

# Smart Contract Address
# Leave empty initially - will be filled after deploying contract
CONTRACT_ADDRESS=
```

**⚠️ IMPORTANT NOTES:**

- **SUPABASE_SERVICE_ROLE_KEY**: This is highly sensitive! It bypasses all security rules. NEVER share it or commit it to git.
- **JWT_SECRET**: Generate a strong random string. Example command:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **PRIVATE_KEY**: Use the private key from Hardhat's test Account #0 (shown in terminal when you run `npx hardhat node`). This is only for local development. For production deployments, generate a new secure private key.
- **CONTRACT_ADDRESS**: Leave empty for now; you'll add this after deploying the smart contract.

### 4.2 Frontend Environment (`.env`)

Create `frontend/.env` file:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:5000

# Smart Contract Address
# Leave empty initially - will be filled after deploying contract
VITE_CONTRACT_ADDRESS=
```

### 4.3 Blockchain Environment (Optional)

For local development, no `.env` file is needed in the `blockchain/` folder. Hardhat will use default local settings.

If deploying to testnet/mainnet in the future, create `blockchain/.env`:

```env
# Only needed for mainnet/testnet deployment
# RPC_URL=https://mainnet.infura.io/v3/your-infura-key
# PRIVATE_KEY=your-deployment-wallet-private-key
```

---

## ⛓️ Step 5: Deploy Smart Contract

### 5.1 Start Hardhat Local Blockchain

Open a new terminal and run:

```bash
cd blockchain
npx hardhat node
```

**Keep this terminal running!** It's your local blockchain. You'll see 20 test accounts with private keys.

### 5.2 Deploy the Contract

Open another terminal:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

You'll see output like:
```
ChainOfCustody deployed to: 0x...
```

**Copy this contract address from your terminal output!**

### 5.3 Update Environment Variables with Contract Address

Update both `.env` files with the deployed contract address:

**`backend/.env`:**
```env
CONTRACT_ADDRESS=<paste-your-deployed-contract-address-here>
```

**`frontend/.env`:**
```env
VITE_CONTRACT_ADDRESS=<paste-your-deployed-contract-address-here>
```

---

## 🦊 Step 6: Configure MetaMask

### 6.1 Add Hardhat Local Network

1. Open MetaMask extension
2. Click network dropdown (top center)
3. Click **"Add Network"** → **"Add a network manually"**
4. Fill in:
   - **Network Name**: Hardhat Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
5. Click **"Save"**

### 6.2 Import Test Account

To use the test accounts from Hardhat:

1. In MetaMask, click account icon → **"Import Account"**
2. Select **"Private Key"**
3. Paste one of the private keys from Hardhat node output (Account #0 is recommended)
4. Click **"Import"**

**Getting Account #0 Private Key:**

When you run `npx hardhat node`, look for the first account in the terminal output:

```
Account #0: 0x...
Private Key: 0x...
```

Copy the Private Key shown in your terminal and use it to import the account into MetaMask.

### 6.3 Switch to Hardhat Network

Make sure MetaMask is connected to **"Hardhat Local"** network (select from network dropdown).

---

## 🚀 Step 7: Start the Application

Open three separate terminals:

### Terminal 1: Blockchain (should already be running)
```bash
cd blockchain
npx hardhat node
```

### Terminal 2: Backend Server
```bash
cd backend
npm start
```

### Terminal 3: Frontend Development Server
```bash
cd frontend
npm run dev
```

---

## 🌐 Step 8: Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. Click **"Connect Wallet"**
3. MetaMask will prompt you to connect
4. Approve the connection
5. Sign the authentication message
6. You should now be logged in!

---

## 👥 Step 9: Create Additional Users (Optional)

### Method 1: Via Database (SQL)

In Supabase SQL Editor:

```sql
-- Create an investigator
INSERT INTO users (wallet_address, role, name, username)
VALUES ('0x...investigator-wallet-address', 'investigator', 'John Investigator', 'john_inv');

-- Create a viewer
INSERT INTO users (wallet_address, role, name, username)
VALUES ('0x...viewer-wallet-address', 'viewer', 'Jane Viewer', 'jane_view');
```

### Method 2: Via Application (If you have judge role)

1. Log in as a judge
2. Go to **Admin Panel**
3. Click **"Register New User"**
4. Fill in wallet address, role, name, and username
5. Click **"Register"**

---

## ✅ Verification Checklist

Make sure everything is working:

- [ ] Hardhat node is running (Terminal 1)
- [ ] Backend server is running on port 5000 (Terminal 2)
- [ ] Frontend is running on port 5173 (Terminal 3)
- [ ] MetaMask is connected to Hardhat Local network (Chain ID: 31337)
- [ ] You can connect wallet and sign in
- [ ] You can view your dashboard based on your role
- [ ] Database connection is working (check Supabase dashboard)

---

## 🔐 Security Reminders

### ⚠️ NEVER COMMIT THESE FILES TO GIT:

- ❌ `backend/.env`
- ❌ `frontend/.env`
- ❌ `blockchain/.env`
- ❌ Any file containing:
  - Supabase service role key
  - JWT secret
  - Real private keys
  - Database passwords

### ✅ SAFE TO COMMIT:

- ✅ `.env.example` files (template files without real values)
- ✅ Source code
- ✅ Configuration files
- ✅ Documentation

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution:** 
- Check if SUPABASE_URL and keys are correct in `backend/.env`
- Verify database tables exist in Supabase dashboard

### Issue: "Contract not deployed" or "Invalid contract address"
**Solution:**
- Make sure Hardhat node is running
- Redeploy contract and update CONTRACT_ADDRESS in both .env files
- Restart backend and frontend servers

### Issue: MetaMask shows "Wrong Network"
**Solution:**
- Switch MetaMask to "Hardhat Local" network (Chain ID: 31337)
- If network doesn't exist, add it manually (see Step 6)

### Issue: "Authentication failed"
**Solution:**
- Make sure your wallet address is registered in Supabase users table
- Check that JWT_SECRET is set in `backend/.env`
- Try disconnecting and reconnecting wallet

### Issue: Backend won't start on port 5000
**Solution:**
- Check if another process is using port 5000
- Change PORT in `backend/.env` to another port (e.g., 5001)
- Also update VITE_BACKEND_URL in `frontend/.env`

---

## 📚 Additional Resources

- **Main README**: See [README.md](README.md) for project overview and features
- **Technical Docs**: Check `Other/` folder for detailed documentation
- **Smart Contract**: See `blockchain/contracts/ChainOfCustody.sol`
- **API Routes**: Check `backend/routes/` folder

---

## 🤝 Need Help?

If you encounter issues:

1. Check the terminal outputs for error messages
2. Verify all environment variables are set correctly
3. Make sure all dependencies are installed (`npm install`)
4. Check that all required services are running (Hardhat, Backend, Frontend)
5. Review the Common Issues section above

---

## 🎉 You're Ready!

If you've completed all steps successfully, your Forensic Chain of Custody System is now running! 

Try uploading evidence, transferring custody, and verifying integrity to explore the system's features.

**Default User Roles:**
- **Judge**: Full access - can approve evidence, transfer custody, manage users
- **Investigator**: Can upload and manage evidence they own
- **Viewer**: Read-only access to assigned evidence
