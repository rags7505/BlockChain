# Frontend - Forensic Chain of Custody

React + Vite + TypeScript frontend for evidence management with MetaMask wallet authentication.

## Features

- **MetaMask Authentication**: Wallet-based login with signature verification
- **Role-Based Dashboards**: Different views for superadmin, admin, investigator, and viewer
- **Evidence Upload**: Multi-type evidence support (fingerprint, image, PDF, text)
- **Evidence Verification**: Client-side SHA-256 hashing and integrity checks
- **Custody Transfer**: Transfer evidence with role assignment for recipients
- **Live Monitoring**: Real-time system status and activity logs
- **Blockchain Explorer**: View evidence on blockchain
- **Wallet Management**: Superadmin can register new wallet addresses

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_BLOCKCHAIN_RPC=http://localhost:8545
```

3. Start development server:
```bash
npm run dev
```

Application runs on `http://localhost:8081`

## Pages

### Public
- `/` - Login page (MetaMask wallet connection)

### Protected (Requires Authentication)
- `/dashboard` - Role-specific dashboard router
- `/upload` - Upload evidence (admin/investigator)
- `/verify` - Verify evidence integrity
- `/explorer` - Blockchain explorer
- `/monitoring` - Live system monitoring
- `/manage-wallets` - Wallet management (superadmin only)

## Components

- `AuthContext` - Global authentication state management
- `ProtectedRoute` - Route guard for authenticated users
- `FileUpload` - Evidence file upload component
- `VerificationBadge` - Visual integrity status indicator

## Dashboards by Role

### Superadmin Dashboard
- View all evidence
- Transfer any evidence
- Delete evidence
- Manage wallet addresses
- Access live monitoring

### Admin Dashboard
- View all evidence
- Transfer own evidence
- Cannot delete evidence
- Limited wallet management

### Investigator Dashboard
- View all evidence (to avoid duplicate evidence IDs)
- Upload evidence
- Transfer own evidence
- Cannot delete or manage wallets

### Viewer Dashboard
- View evidence files only
- Cannot upload, transfer, or delete
- Read-only access

## Technology Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety
- **Material-UI**: Component library
- **Ethers.js v6**: Ethereum interaction
- **Axios**: HTTP client
- **React Router**: Client-side routing

## Key Features Implemented

### Wallet Authentication
1. User connects MetaMask wallet
2. Backend generates unique nonce
3. User signs nonce with private key
4. Backend verifies signature and issues JWT token
5. Token stored in localStorage for session persistence

### Custody Transfer with Auto-Registration
1. User selects evidence to transfer
2. Enters recipient wallet address and selects role
3. Signs blockchain transaction via MetaMask
4. Backend automatically registers new wallet if not exists
5. Recipient can immediately login and access evidence

### File Integrity Verification
1. Client computes SHA-256 hash of uploaded file
2. Hash stored in backend database and blockchain
3. Verification re-computes hash and compares
4. Visual badge shows "Verified" or "Tampered" status

## Project Structure

```
frontend/
├── public/          # Static assets
├── src/
│   ├── abi/        # Smart contract ABI
│   ├── api/        # API client (legacy)
│   ├── assets/     # Images, icons
│   ├── components/ # Reusable components
│   ├── context/    # React context providers
│   ├── hooks/      # Custom React hooks
│   ├── pages/      # Page components
│   ├── services/   # API & blockchain services
│   ├── utils/      # Helper functions
│   ├── App.jsx     # Main app component
│   ├── main.tsx    # Entry point
│   └── vite-env.d.ts # TypeScript environment types
└── vite.config.js  # Vite configuration
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_BACKEND_URL | Backend API URL | http://localhost:5000 |
| VITE_CONTRACT_ADDRESS | Smart contract address | 0x610178... |
| VITE_BLOCKCHAIN_RPC | Blockchain RPC URL | http://localhost:8545 |

## Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Development Notes

- Hot Module Replacement (HMR) enabled for fast development
- TypeScript strict mode disabled for flexibility
- All unused imports and components cleaned up
- Proper error boundaries for dashboard components
