// Type definitions for the application

export type EvidenceType = 'image' | 'pdf' | 'text';

export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
}

export interface Evidence {
  id: string;
  evidenceId: string;
  evidenceType: EvidenceType;
  fileName: string;
  fileHash: string;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  blockchainTxHash: string | null;
}

export interface AccessLog {
  id: string;
  evidenceId: string;
  accessedBy: string;
  accessedAt: string;
  action: 'uploaded' | 'viewed' | 'verified';
}
