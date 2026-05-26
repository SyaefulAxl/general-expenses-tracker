export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type ExpenseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type LoanStatus = 'UNSETTLED' | 'PARTIAL' | 'FULLY_SETTLED' | 'OVERPAID';
export type LoanType = 'I_OWE' | 'OWED_TO_ME';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Expense {
  id?: number;
  description: string;
  amount: number;
  category: string;
  expenseDate: string;
  status: ExpenseStatus;
  notes?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  toko?: string;
  source?: string;
  shared?: boolean;
  attachmentPath?: string;
  recorderId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id?: number;
  // Backend DTO fields
  personName?: string;
  type?: LoanType;
  totalAmount?: number;
  remainingAmount?: number;
  paidAmount?: number;
  declaredRepayment?: number;
  loanDate?: string;
  settledDate?: string;
  status: LoanStatus;
  notes?: string;
  userId?: number;
  userName?: string;
  repayments?: Repayment[];
  createdAt?: string;
  updatedAt?: string;
  // Legacy mock-data fields (for UI compatibility)
  expenseId?: number;
  lenderId?: number;
  borrowerId?: number;
  amount?: number;
  actualRepaid?: number;
  remainingBalance?: number;
}

export interface Repayment {
  id?: number;
  loanId?: number;
  amount: number;
  repaymentDate: string;
  notes?: string;
  createdAt?: string;
}
