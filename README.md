# Forensic Chain of Custody System

## Blockchain-Based Evidence Integrity and Custody Management Platform

A production-ready forensic evidence management system with MetaMask wallet authentication, role-based access control, and cryptographic integrity verification for legal and investigative proceedings.

---

## 📋 Table of Contents

1. [Abstract](#abstract)
2. [Problem Statement](#problem-statement)
3. [Project Objectives](#project-objectives)
4. [System Architecture](#system-architecture)
5. [Technology Stack](#technology-stack)
6. [Why We Used These Technologies](#why-we-used-these-technologies)
7. [Role-Based Access Control](#role-based-access-control)
8. [Complete System Workflow](#complete-system-workflow)
9. [Smart Contract Design](#smart-contract-design)
10. [Installation and Setup](#installation-and-setup)
11. [Software and Hardware Requirements](#software-and-hardware-requirements)
12. [Results and Findings](#results-and-findings)
13. [Future Enhancements](#future-enhancements)

---

## Abstract

Maintaining the integrity, authenticity, and traceability of evidence is a critical requirement in legal, forensic, and investigative processes. Traditional methods of managing the chain of custody rely heavily on manual documentation and human oversight, which are susceptible to errors, tampering, and unauthorized access, potentially compromising the reliability of evidence.

This project implements a **blockchain-based system for Chain of Custody and Evidence Integrity Verification**, utilizing the decentralized, immutable, and transparent nature of blockchain technology. Every evidence transaction—including collection, transfer, and storage—is recorded on a distributed ledger, providing a secure and verifiable history of custody.

### Key Features Implemented

- **MetaMask Wallet Authentication**: Cryptographic signature-based authentication eliminating password vulnerabilities
- **Three-Tier Role System**: Judge, Investigator, and Viewer roles with granular permissions
- **Blockchain Evidence Registration**: Immutable SHA-256 hash storage on Ethereum smart contract
- **Automatic Custody Tracking**: All transfers recorded with blockchain transaction hashes
- **File Integrity Verification**: Real-time tampering detection using cryptographic hashing
- **Investigator Persistence**: Investigators maintain view access to evidence they uploaded even after transfer
- **Smart Transfer Controls**: Transfer buttons intelligently hidden based on custody status
- **Complete Audit Trail**: Comprehensive access logging for all evidence interactions
- **Wallet Name Mapping**: Display names shown instead of wallet addresses throughout the system
- **Blockchain Explorer**: View all blockchain transactions and evidence records

### Security Features

- Nonce-based authentication preventing replay attacks
- JWT session tokens with 7-day expiration
- Elliptic Curve Digital Signature verification
- SHA-256 cryptographic hashing for file integrity
- Smart contract role-based access control
- Blockchain immutability guaranteeing tamper-proof records

**Keywords:** Blockchain, Chain of Custody, Evidence Integrity, Smart Contracts, Forensic Verification, MetaMask, Ethereum, SHA-256, Digital Forensics, Role-Based Access Control

---

## Problem Statement

### The Challenge of Traditional Evidence Management

Traditional chain of custody systems face critical challenges that undermine the integrity of legal proceedings:

#### 1. Vulnerability to Tampering
- Paper-based logs can be altered, forged, or destroyed without detection
- Digital databases controlled by single entities allow insider modification
- No cryptographic proof of data authenticity or non-tampering
- Centralized systems create single points of failure

#### 2. Human Error and Oversight  
- Manual documentation leads to incomplete or inaccurate records
- Time-stamping errors or omissions compromise chain integrity
- Inconsistent logging practices across departments
- Loss of physical records due to mishandling

#### 3. Lack of Transparency
- No verifiable mechanism for external parties to audit custody history
- Difficult to prove non-tampering in court proceedings
- Trust depends entirely on the integrity of individuals
- No independent verification of data accuracy

#### 4. Repudiation Issues
- Handlers can deny having accessed or modified evidence
- No cryptographic proof linking specific actions to individuals
- Difficult to establish accountability in multi-party investigations
- Signature forgery possible in paper-based systems

### Real-World Impact

When chain of custody is compromised:
- **Evidence becomes inadmissible** in court proceedings
- **Criminal cases may be dismissed** despite valid evidence
- **Civil litigants lose** legitimate claims due to procedural failures
- **Public trust erodes** in the justice system
- **Wrongful convictions** may occur due to tampered evidence
- **Guilty parties may go free** due to procedural violations

---

## Project Objectives

### Primary Goal

Design and implement a **tamper-proof, blockchain-based chain of custody system** that ensures evidence integrity from collection through court presentation, with intelligent access control based on user roles and custody status.

### Specific Objectives Achieved

| # | Objective | Implementation | Status |
|---|-----------|----------------|--------|
| 1 | Immutable Audit Trail | Ethereum smart contract with event logging | ✅ Complete |
| 2 | Cryptographic Integrity | SHA-256 hashing with blockchain verification | ✅ Complete |
| 3 | Secure Authentication | MetaMask wallet signatures with nonce protection | ✅ Complete |
| 4 | Role-Based Access Control | Three-tier system: Judge, Investigator, Viewer | ✅ Complete |
| 5 | Custody Transfer Tracking | Blockchain events + database synchronization | ✅ Complete |
| 6 | Investigator Persistence | View access maintained after custody transfer | ✅ Complete |
| 7 | Smart UI Controls | Transfer buttons hidden based on custody status | ✅ Complete |
| 8 | Real-Time Monitoring | Tampering detection with instant alerts | ✅ Complete |
| 9 | User-Friendly Interface | Material-UI dashboards tailored to each role | ✅ Complete |
| 10 | Scalability | Modular architecture supporting growth | ✅ Complete |

---

---

## System Architecture

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          USER LAYER                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────┐            │
│  │    JUDGE    │   │ INVESTIGATOR │   │   VIEWER    │            │
│  │  Dashboard  │   │  Dashboard   │   │  Dashboard  │            │
│  └──────┬──────┘   └───────┬──────┘   └──────┬──────┘            │
└─────────┼──────────────────┼─────────────────┼────────────────────┘
          │                  │                 │
          └──────────────────┴─────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────────┐
│                     FRONTEND LAYER                                  │
│                React + TypeScript + Vite                            │
│  • MetaMask Integration (Ethers.js v6)                             │
│  • Role-Based Dashboard Routing                                    │
│  • Evidence Upload/View/Transfer UI                                │
│  • Real-Time Tampering Alerts                                      │
│  • Client-Side SHA-256 Hashing                                     │
└───────────────────────────┬────────────────────────────────────────┘
                            │ REST API (HTTPS)
┌───────────────────────────▼────────────────────────────────────────┐
│                     BACKEND LAYER                                   │
│                Node.js + Express.js                                 │
│  Controllers:                                                       │
│    • walletAuthController  - Authentication & JWT                  │
│    • evidenceController    - Evidence CRUD operations              │
│    • adminController       - User/wallet management                │
│  Middleware:                                                        │
│    • authenticate.js       - JWT verification                      │
│    • role.js               - Authorization checks                  │
│  Services:                                                          │
│    • contractService.js    - Smart contract interaction            │
│    • hashUtil.js           - SHA-256 computation                   │
└───────────┬────────────────────────────────────┬───────────────────┘
            │                                    │
    ┌───────▼────────┐                  ┌────────▼────────┐
    │   DATABASE     │                  │   BLOCKCHAIN    │
    │  (Supabase)    │                  │   (Ethereum)    │
    │                │                  │                 │
    │ • users        │                  │ Smart Contract: │
    │ • evidences    │                  │ ChainOfCustody  │
    │ • sessions     │                  │                 │
    │ • access_logs  │                  │ • Evidence IDs  │
    └───────┬────────┘                  │ • SHA-256 Hash  │
            │                           │ • Custody Logs  │
    ┌───────▼────────┐                  │ • Timestamps    │
    │ FILE STORAGE   │                  │ • Role Grants   │
    │  /fingerprints │                  └─────────────────┘
    │  /pdfs         │
    │  /images       │
    │  /texts        │
    └────────────────┘
```

### Data Flow Architecture

**Evidence Upload Flow:**
```
User → Frontend (compute hash) → MetaMask (sign tx) → Smart Contract (store hash)
  ↓
Backend (verify hash) → File Storage (save file) → Database (metadata)
  ↓
Access Log Created → User receives confirmation
```

**Custody Transfer Flow:**
```
Current Holder → Smart Contract (verify authority) → Blockchain (record transfer)
  ↓
Backend (update holder) → Auto-register recipient (if new)
  ↓
Access Log Created → Original uploader retains view access
```

**Integrity Verification Flow:**
```
User → Backend (read file) → Compute current hash
  ↓
Smart Contract (fetch original hash) → Compare hashes
  ↓
Match? → ✓ Verified  /  Mismatch? → ✗ TAMPERING DETECTED
```

---

---

## Technology Stack

### Complete Technology Matrix

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | React | 18.x | Component-based UI framework |
| | TypeScript | 5.x | Type-safe JavaScript development |
| | Vite | 5.x | Fast build tool and dev server |
| | Material-UI | 5.x | Pre-built UI components |
| | Ethers.js | 6.x | Ethereum blockchain interaction |
| | Axios | 1.x | HTTP client for API requests |
| **Backend** | Node.js | 18.x | JavaScript runtime environment |
| | Express.js | 4.x | Web application framework |
| | Multer | 1.x | Multipart file upload handling |
| | JWT | 9.x | Token-based session management |
| | Crypto (native) | - | SHA-256 cryptographic hashing |
| **Database** | Supabase | Latest | PostgreSQL as a Service |
| | PostgreSQL | 15.x | Relational database |
| **Blockchain** | Solidity | 0.8.20 | Smart contract programming language |
| | Hardhat | 2.x | Ethereum development environment |
| | OpenZeppelin | 5.x | Secure contract libraries |
| **Authentication** | MetaMask | Latest | Cryptocurrency wallet for signing |
| | Ethers.js | 6.x | ECDSA signature verification |

---

## Why We Used These Technologies

### 1. Why Blockchain (Ethereum)?

**Problem with Traditional Databases:**
```
Traditional System:
┌─────────────────────┐
│   Database Server   │ ← Single point of control
│                     │
│ Evidence Record:    │
│ Holder: John        │
│ Time: 2:30 PM       │
└─────────────────────┘
         ↓
[Admin modifies database]
         ↓
┌─────────────────────┐
│ Evidence Record:    │
│ Holder: [DELETED]   │ ← No proof of tampering!
│ Time: [MODIFIED]    │
└─────────────────────┘
```

**Blockchain Solution:**
```
Blockchain System:
┌──────────────────────┐
│  Block #123          │
│  Hash: 0x7a3f...     │ ← Cryptographically linked to previous block
│  Previous: 0x2b1c... │
│  Evidence Data:      │
│    Holder: John      │
│    Time: 2:30 PM     │
│  Signature: 0x...    │ ← Cryptographic proof
└──────────────────────┘
         ↓
If anyone tries to modify:
• Hash changes
• Chain breaks  
• All nodes detect tampering
• Immutable proof of fraud created
```

**Key Benefits:**
- **Immutability**: Data cannot be altered once recorded
- **Transparency**: All participants can independently verify history
- **Decentralization**: No single entity controls the system
- **Non-repudiation**: Wallet signatures cryptographically prove identity

### 2. Why Smart Contracts?

Smart contracts are **self-executing programs on the blockchain** that enforce rules automatically without intermediaries.

**Example from Our System:**
```solidity
// Only current holder OR judge can transfer custody
function transferCustody(bytes32 evidenceId, address newHolder) external {
    bool isCurrentHolder = evidences[evidenceId].currentHolder == msg.sender;
    bool isJudge = hasRole(JUDGE_ROLE, msg.sender);
    
    require(isCurrentHolder || isJudge, "Not authorized");
    // Transfer executes automatically if conditions met
}
```

**Benefits:**
- Rules cannot be bypassed or ignored
- Execution is guaranteed and transparent
- No manual verification or approval needed
- All actions permanently logged

### 3. Why MetaMask Wallet Authentication?

**Traditional Password Problems:**
- Passwords can be stolen, shared, phished, or brute-forced
- Databases store password hashes (vulnerable to breaches)
- No cryptographic proof that user is who they claim
- Users often reuse weak passwords

**MetaMask Wallet Solution:**
```
Authentication Process:
1. User owns private key (never transmitted!)
2. Server sends random challenge (nonce)
3. User signs challenge with private key
4. Server verifies signature mathematically
5. No secrets stored or transmitted!
```

**Benefits:**
- **Cryptographic proof** of identity
- **No password database** to breach
- **Wallet address** = permanent verifiable identity
- **Replay attack protection** via nonces

### 4. Why SHA-256 Hashing?

SHA-256 is a **cryptographic hash function** that creates a unique 256-bit "fingerprint" of any file.

**Properties Demonstrated:**
```
Input: "Evidence Document.pdf" (2.5 MB)
Output: a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e

Change 1 bit in the file:
Output: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
        ↑ Completely different hash!
```

**Critical Properties:**
- **Deterministic**: Same file → Always same hash
- **One-way**: Cannot reverse hash to get original file
- **Collision-resistant**: Virtually impossible for two different files to have same hash
- **Avalanche effect**: Tiny change in input creates drastically different output

**In Our System:**
- Files hashed at upload time
- Hash stored immutably on blockchain
- Verification compares current file hash with blockchain hash
- Any modification instantly detected

### 5. Why Supabase (PostgreSQL)?

**Requirements Met:**
- Store user accounts, evidence metadata, access logs
- Fast queries for dashboard rendering
- Row-Level Security for data isolation between users
- Real-time subscriptions for live monitoring
- Cloud-hosted with automatic backups

**Supabase Benefits:**
- Managed PostgreSQL with enterprise features
- Built-in authentication helpers
- RESTful API auto-generation
- Real-time listeners via WebSockets
- Free tier suitable for development

### 6. Why React + TypeScript?

**React Benefits:**
- Component-based architecture (reusable UI elements)
- Virtual DOM for efficient updates
- Massive ecosystem and community support
- Perfect for single-page applications

**TypeScript Benefits:**
- Compile-time error detection
- IDE autocomplete and IntelliSense
- Self-documenting code via type definitions
- Easier refactoring and maintenance
- Prevents entire categories of runtime errors

---

## Role-Based Access Control

### Role Hierarchy

```
                    ┌──────────────┐
                    │    JUDGE     │
                    │  (Highest)   │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
    │INVESTIGATOR │ │INVESTIGATOR │ │   VIEWER   │
    └─────────────┘ └─────────────┘ └────────────┘
```

### Comprehensive Permission Matrix

| Action | Judge | Investigator | Viewer |
|--------|-------|--------------|--------|
| **View** All Evidence | ✅ Yes | ❌ No (own only) | ❌ No (own only) |
| **View** Own Uploaded Evidence | ✅ Yes | ✅ Yes (persists after transfer) | N/A |
| **View** Current Holdings | ✅ Yes | ✅ Yes | ✅ Yes |
| **Upload** New Evidence | ✅ Yes | ✅ Yes | ❌ No |
| **Transfer** Any Evidence | ✅ Yes | ❌ No | ❌ No |
| **Transfer** Own Holdings | ✅ Yes | ✅ Yes (loses transfer after) | ❌ No |
| **Transfer Button** Visible After Transfer | N/A | ❌ No (hidden after transfer) | N/A |
| **Delete** Evidence | ✅ Yes | ❌ No | ❌ No |
| **Verify** Integrity | ✅ Yes | ✅ Yes | ✅ Yes |
| **View** Blockchain Explorer | ✅ Yes | ✅ Yes | ✅ Yes |
| **View** All Access Logs | ✅ Yes | ❌ No | ❌ No |
| **View** Own Activity Logs | ✅ Yes | ✅ Yes | ✅ Yes |
| **Manage** User Wallets | ✅ Yes | ❌ No | ❌ No |
| **Access** Live Monitoring | ✅ Yes | ❌ No | ❌ No |

### Role Descriptions

#### Judge Role
- **Purpose**: Judicial oversight and final authority on evidence
- **Why "Judge"**: Represents the highest judicial authority who can oversee all evidence
- **Capabilities**:
  - Full system visibility (all evidence, all logs)
  - Can transfer custody of ANY evidence regardless of current holder
  - Can permanently delete evidence (with immutable audit trail)
  - Can assign roles to wallet addresses
  - Can change evidence state (Active, Sealed, Archived, UnderReview)
  - Represents the legal authority in the chain of custody

#### Investigator Role
- **Purpose**: Field investigators collecting and managing evidence
- **Capabilities**:
  - Upload new evidence to the system
  - View evidence they uploaded OR currently hold
  - Transfer custody of evidence they currently hold
  - **IMPORTANT**: After transferring custody, they:
    - ✅ **CAN** still view the file content (maintains investigative continuity)
    - ❌ **CANNOT** transfer again (loses transfer rights)
    - ❌ **CANNOT** see the transfer button (button intelligently hidden)
    - ✅ **CAN** verify integrity
  - Full access to own activity logs
  - Can access blockchain explorer
  - Cannot see other investigators' evidence unless transferred to them

#### Viewer Role
- **Purpose**: Read-only stakeholders (attorneys, auditors, administrators)
- **Capabilities**:
  - View evidence they currently hold
  - Verify evidence integrity
  - View own access history
  - **Cannot** upload, transfer, or modify evidence
  - Suitable for legal teams reviewing case evidence

### Evidence Visibility Logic

```
┌─────────────────────────────────────────────────────────────┐
│           WHO CAN SEE WHICH EVIDENCE?                        │
│                                                              │
│  IF user.role == "judge":                                   │
│      → Can see ALL evidence in the system                   │
│                                                              │
│  IF user.role == "investigator":                            │
│      → Can see evidence WHERE:                              │
│          • currentHolder == user.walletAddress (holdings)   │
│          • OR uploadedBy == user.walletAddress (uploads)    │
│      → Transfer button visible ONLY if currentHolder match  │
│      → After transfer: loses transfer rights, keeps view    │
│                                                              │
│  IF user.role == "viewer":                                  │
│      → Can see evidence WHERE:                              │
│          • currentHolder == user.walletAddress              │
│      → No upload or transfer capabilities                   │
└─────────────────────────────────────────────────────────────┘
```

### Transfer Rules

**When Investigator Transfers Evidence:**
1. Original investigator **loses transfer rights**
2. Original investigator **keeps view access** (can still see the evidence)
3. New holder gets **full custody** (view + transfer)
4. Recipient wallet must be **pre-registered by Judge** in Manage Wallets
5. Blockchain records the transaction hash for audit trail

**When Judge Transfers Evidence:**
1. Judge can transfer **any evidence** regardless of current holder
2. Original uploader **keeps view and transfer rights**
3. New holder receives custody based on their role
4. Judge maintains oversight of all evidence

---

```
forensic-chain-custody/
├── backend/           # Express.js API server
│   ├── config/       # Configuration files
│   ├── controllers/  # Route handlers
│   ├── data/         # JSON database
│   ├── middleware/   # Auth & role middleware
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   ├── services/     # Blockchain service
│   ├── storage/      # Evidence files
│   └── utils/        # Helper functions
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── abi/     # Smart contract ABI
│   │   ├── components/ # Reusable components
│   │   ├── context/ # Auth context
│   │   ├── pages/   # Dashboard pages
│   │   ├── services/ # API & blockchain clients
│   │   └── utils/   # Formatters & helpers
│   └── public/      # Static assets
├── blockchain/       # Hardhat project
│   ├── contracts/   # Solidity contracts
│   ├── scripts/     # Deployment scripts
│   └── artifacts/   # Compiled contracts
└── README.md        # This file
```

---

## Installation and Setup

### 🚀 Quick Start

**For complete step-by-step instructions with screenshots and troubleshooting, see [SETUP.md](SETUP.md)**

#### Prerequisites
- Node.js (v16+)
- MetaMask browser extension
- Supabase account (free tier works)

#### Quick Setup Steps
```bash
# 1. Clone repository
git clone <your-repo-url>
cd forensic-chain-custody

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../blockchain && npm install

# 3. Set up Supabase and create .env files
# See SETUP.md for detailed instructions

# 4. Deploy smart contract  
cd blockchain
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# 5. Start application
cd ../backend && npm start  # Terminal 3
cd ../frontend && npm run dev  # Terminal 4
```

#### Environment Variables Required

**Backend** (`backend/.env`):
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-key-at-least-32-chars
CONTRACT_ADDRESS=deployed-contract-address
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=hardhat-test-account-private-key
PORT=5000
```

**Frontend** (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=deployed-contract-address
```

**📖 For detailed setup with Supabase configuration, database migrations, MetaMask setup, and troubleshooting, see [SETUP.md](SETUP.md)**

---

## 🛠️ Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Material-UI (components)
- Ethers.js v6 (blockchain)
- Axios (HTTP client)
- React Router (routing)

### Backend
- Node.js + Express
- Supabase (PostgreSQL database)
- Ethers.js v6 (blockchain)
- JWT (authentication)
- Multer (file upload)
- Crypto (SHA-256 hashing)

### Blockchain
- Solidity 0.8.20
- Hardhat (development)
- OpenZeppelin (access control)
- Ethereum (local or testnet)

## 🔒 Security Considerations

- All file uploads validated and sanitized
- JWT tokens expire after 24 hours
- Nonces are single-use to prevent replay attacks
- Wallet signatures verified cryptographically
- File hashes stored immutably on blockchain
- Role-based authorization on all endpoints
- CORS configured for production deployment

## 📖 API Documentation

See `backend/README.md` for complete API endpoint documentation.

## 🧪 Testing

### Test Wallet Setup

1. Use local Hardhat network for testing (comes with pre-funded test accounts)
2. Register test wallets via the Judge "Manage Wallets" page
3. Assign appropriate roles (judge, investigator, viewer)
4. Test with your own MetaMask test accounts

### Test Scenarios
1. Login as judge → Upload evidence → Transfer to investigator
2. Login as investigator → Upload evidence → Verify integrity → Transfer (loses transfer rights after)
3. Login as new wallet → Should be denied until registered by judge
4. Transfer evidence requires recipient to be pre-registered in Manage Wallets
5. Check monitoring dashboard → See real-time stats (judge only)

## 🚨 Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Ensure backend is running on correct port
- Verify `.env` file has correct `VITE_BACKEND_URL`
- Clear localStorage and reconnect wallet

### "Wallet not registered" error
- Contact judge to register wallet via "Manage Wallets"
- Wallets must be pre-registered before they can receive evidence transfers

### "Request failed 404" on transfer
- Ensure backend server restarted after code changes
- Check API route matches: `/api/evidence/:evidenceId/transfer`

### MetaMask signature rejected
- Ensure you're signing the correct message
- Check MetaMask is connected to correct network
- Try disconnecting and reconnecting wallet

## 📝 Recent Updates

- ✅ Migrated from username/password to MetaMask wallet authentication
- ✅ Implemented role-based transfer permissions (investigator loses transfer after transferring)
- ✅ Added wallet name mapping (display names instead of addresses)
- ✅ Transfer recipients must be pre-registered by judge in Manage Wallets
- ✅ Added blockchain explorer accessible to all roles
- ✅ Fixed investigator transfer permissions (keeps view, loses transfer)
- ✅ Added live monitoring dashboard with real-time updates (judge only)
- ✅ Transaction hashes stored and displayed with copy functionality
- ✅ Cleaned up unused files and consolidated documentation
- ✅ Fixed TypeScript errors with proper Vite environment types

## 📚 Additional Documentation

- Backend API: `backend/README.md`
- Frontend Guide: `frontend/README.md`
- Technical Deep Dive: `TECHNICAL_DOCUMENTATION.md`

## 🤝 Contributing

This is a complete working system. For production deployment:
1. Deploy smart contract to testnet/mainnet
2. Update `CONTRACT_ADDRESS` in `.env` files
3. Configure production database (Supabase)
4. Set up proper CORS and security headers
5. Use environment-specific RPC URLs
6. Implement proper error boundaries
7. Add comprehensive logging

## 📄 License

MIT License - Feel free to use for forensic evidence management systems.

---

**Built with ❤️ for secure forensic evidence management**
