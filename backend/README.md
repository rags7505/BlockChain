# Backend - Forensic Chain of Custody

Express.js backend server handling evidence management, wallet authentication, and blockchain integration.

## Features

- **Wallet Authentication**: MetaMask-based authentication with signature verification
- **Evidence Management**: Upload, view, verify, transfer, and delete evidence
- **File Storage**: Local file system storage with organized directories by evidence type
- **SHA-256 Hashing**: Cryptographic integrity verification
- **Access Logging**: Track all evidence access and modifications
- **Role-Based Access**: Support for superadmin, admin, investigator, and viewer roles
- **Blockchain Integration**: Ethers.js for smart contract interactions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret_key
RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=your_deployed_contract_address
```

3. Start server:
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Wallet Authentication
- `POST /api/wallet-auth/request-nonce` - Request authentication nonce
- `POST /api/wallet-auth/verify` - Verify wallet signature
- `POST /api/wallet-auth/logout` - Logout user

### Evidence Management
- `POST /api/evidence/upload` - Upload evidence file
- `GET /api/evidence` - Get all evidence
- `GET /api/evidence/:evidenceId` - Get specific evidence
- `GET /api/evidence/:evidenceId/view` - View evidence file
- `GET /api/evidence/:evidenceId/logs` - Get evidence access logs
- `GET /api/evidence/logs/all` - Get all access logs
- `POST /api/evidence/:evidenceId/transfer` - Transfer evidence custody
- `GET /api/evidence/:evidenceId/verify-integrity` - Verify file integrity
- `DELETE /api/evidence/:evidenceId` - Delete evidence (superadmin only)

### System
- `GET /api/health` - System health check

## Project Structure

```
backend/
├── config/          # Configuration files (blockchain, evidence types)
├── controllers/     # Request handlers
├── data/           # JSON database files
├── middleware/     # Authentication & authorization middleware
├── models/         # Data models
├── routes/         # API route definitions
├── services/       # Business logic (blockchain interactions)
├── storage/        # Uploaded evidence files
├── utils/          # Helper utilities (hashing)
└── server.js       # Main application entry point
```

## Security Features

- **Nonce-based Authentication**: Prevents replay attacks
- **JWT Tokens**: Secure session management (24-hour expiration)
- **Signature Verification**: Cryptographic wallet ownership proof
- **Role-Based Authorization**: Granular access control
- **File Hash Verification**: SHA-256 integrity checking

## Database

Uses Supabase PostgreSQL for:
- User accounts (wallet addresses, roles, display names)
- Session nonces
- Evidence metadata
- Access logs

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| SUPABASE_URL | Supabase project URL | your_project_url |
| SUPABASE_KEY | Supabase anon key | your_credentials |
| JWT_SECRET | Secret for JWT signing | random_secret_string |
| RPC_URL | Blockchain RPC endpoint | http://localhost:8545 |
| CONTRACT_ADDRESS | Deployed contract address | your_contract_address |
