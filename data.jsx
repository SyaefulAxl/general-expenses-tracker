// data.jsx — mock state for Thailand Expenses Tracker
// Maps to BRD acceptance criteria; everything is wired so a UI mutation
// flows back through this store via React state.

const USERS = [
  { id: 1, name: 'Syaeful', role: 'ADMIN',   email: 'syaeful@texcoms.com', initials: 'S', active: true, joined: '2025-04-12', avatarClass: 'syaeful' },
  { id: 2, name: 'Winda',   role: 'MANAGER', email: 'winda@texcoms.com',   initials: 'W', active: true, joined: '2025-04-12', avatarClass: 'winda'   },
  { id: 3, name: 'Dina',    role: 'MANAGER', email: 'dina@texcoms.com',    initials: 'D', active: true, joined: '2025-04-12', avatarClass: 'dina'    },
];

// Source dropdown options per BRD §6 / DD §3.3
const SOURCES = [
  'Winda Cash', 'ATM Winda',
  'Syaeful Cash', 'ATM Syaeful',
  'Dina Cash', 'ATM Dina',
  'Corporate',
];

// source → owner user id (Corporate = null, no loan)
const SOURCE_OWNER = {
  'Winda Cash':   2, 'ATM Winda':   2,
  'Syaeful Cash': 1, 'ATM Syaeful': 1,
  'Dina Cash':    3, 'ATM Dina':    3,
  'Corporate':    null,
};

const CATEGORIES = ['Transport', 'Food', 'Accommodation', 'Other'];

// ── Seed expenses — Thailand fieldtrip, May 2025 ───────────────────────────
// IDs are stable so loans can reference them.
const SEED_EXPENSES = [
  // AC-01..04: Syaeful spends Winda Cash → Syaeful owes Winda 1500 THB
  { id: 1,  user_id: 1, expense_date: '2025-05-14', amount: 1500.00, description: 'Grab rides — Suvarnabhumi → Sukhumvit hotel',                source: 'Winda Cash',    category: 'Transport',     status: 'PENDING',  attachment: 'receipt-grab-0514.jpg' },
  { id: 2,  user_id: 3, expense_date: '2025-05-14', amount: 4200.00, description: 'The Sukhumvit Hotel — 1 night, twin room',                   source: 'ATM Syaeful',   category: 'Accommodation', status: 'APPROVED', attachment: 'hotel-folio.pdf' },
  { id: 3,  user_id: 2, expense_date: '2025-05-15', amount:  850.00, description: 'Lunch at Chatuchak — pad thai & mango sticky rice ×3',       source: 'Dina Cash',     category: 'Food',          status: 'APPROVED', attachment: null },
  { id: 4,  user_id: 1, expense_date: '2025-05-15', amount:  320.00, description: 'Coffee & water — Café Amazon Asok',                          source: 'Syaeful Cash',  category: 'Food',          status: 'APPROVED', attachment: null },
  { id: 5,  user_id: 3, expense_date: '2025-05-15', amount: 2400.00, description: 'Grand Palace + Wat Pho entry tickets ×3',                    source: 'Winda Cash',    category: 'Other',         status: 'PENDING',  attachment: 'tickets-grand-palace.pdf' },
  { id: 6,  user_id: 2, expense_date: '2025-05-15', amount: 6800.00, description: 'Team dinner — Cabbages & Condoms, Sukhumvit',                source: 'Corporate',     category: 'Food',          status: 'APPROVED', attachment: 'cabbages-receipt.jpg' },
  { id: 7,  user_id: 1, expense_date: '2025-05-16', amount: 1100.00, description: 'BTS Skytrain 3-day passes ×3',                               source: 'Dina Cash',     category: 'Transport',     status: 'APPROVED', attachment: null },
  { id: 8,  user_id: 2, expense_date: '2025-05-16', amount:  480.00, description: 'Souvenirs — Asiatique night market',                         source: 'Winda Cash',    category: 'Other',         status: 'DRAFT',    attachment: null },
  { id: 9,  user_id: 3, expense_date: '2025-05-16', amount: 3500.00, description: 'Ayutthaya day tour — boat + guide',                          source: 'ATM Winda',     category: 'Transport',     status: 'PENDING',  attachment: 'ayutthaya-voucher.pdf' },
  { id: 10, user_id: 1, expense_date: '2025-05-17', amount:  920.00, description: 'Massage — Wat Pho Traditional Medical School ×2',           source: 'Syaeful Cash',  category: 'Other',         status: 'APPROVED', attachment: null },
  { id: 11, user_id: 2, expense_date: '2025-05-17', amount: 1250.00, description: 'Songthaew + parking — Chiang Mai old city',                 source: 'ATM Dina',      category: 'Transport',     status: 'PENDING',  attachment: null },
  { id: 12, user_id: 3, expense_date: '2025-05-18', amount: 5400.00, description: 'Chiang Mai Riverside Boutique — 2 nights',                  source: 'Corporate',     category: 'Accommodation', status: 'APPROVED', attachment: 'cm-hotel.pdf' },
  { id: 13, user_id: 1, expense_date: '2025-05-18', amount:  680.00, description: 'Khao soi & sticky rice — Huen Phen lunch',                  source: 'Winda Cash',    category: 'Food',          status: 'DRAFT',    attachment: null },
  { id: 14, user_id: 2, expense_date: '2025-05-13', amount:  720.00, description: 'SIM card + data — AIS at airport',                          source: 'Winda Cash',    category: 'Other',         status: 'REJECTED', attachment: null, rejection_reason: 'Personal expense — reimburse from own funds' },
];

// ── Seed loans — derived from expenses but stored explicitly ──────────────
// Loan auto-creation rule (DD §4.3): if expense.source belongs to another
// user, create loan with lender=owner, borrower=recorder, amount=expense.amount
const SEED_LOANS = [
  // expense 1: Syaeful spent Winda Cash → Syaeful owes Winda 1500. Declared 1500, repaid 500 (AC-02 + AC-03).
  { id: 1,  expense_id: 1,  lender_id: 2, borrower_id: 1, amount: 1500.00, declared_repayment: 1500.00, actual_repaid:  500.00, status: 'PARTIAL',   created_at: '2025-05-14' },
  // expense 2: Dina spent ATM Syaeful → Dina owes Syaeful 4200.
  { id: 2,  expense_id: 2,  lender_id: 1, borrower_id: 3, amount: 4200.00, declared_repayment: 4200.00, actual_repaid: 4200.00, status: 'FULLY_SETTLED', created_at: '2025-05-14' },
  // expense 3: Winda spent Dina Cash → Winda owes Dina 850.
  { id: 3,  expense_id: 3,  lender_id: 3, borrower_id: 2, amount:  850.00, declared_repayment:  850.00, actual_repaid:    0.00, status: 'UNSETTLED', created_at: '2025-05-15' },
  // expense 5: Dina spent Winda Cash → Dina owes Winda 2400.
  { id: 4,  expense_id: 5,  lender_id: 2, borrower_id: 3, amount: 2400.00, declared_repayment: null,    actual_repaid:    0.00, status: 'UNSETTLED', created_at: '2025-05-15' },
  // expense 7: Syaeful spent Dina Cash → Syaeful owes Dina 1100.
  { id: 5,  expense_id: 7,  lender_id: 3, borrower_id: 1, amount: 1100.00, declared_repayment: 1100.00, actual_repaid:  600.00, status: 'PARTIAL',   created_at: '2025-05-16' },
  // expense 9: Dina spent ATM Winda → Dina owes Winda 3500.
  { id: 6,  expense_id: 9,  lender_id: 2, borrower_id: 3, amount: 3500.00, declared_repayment: 3500.00, actual_repaid:    0.00, status: 'UNSETTLED', created_at: '2025-05-16' },
  // expense 11: Winda spent ATM Dina → Winda owes Dina 1250.
  { id: 7,  expense_id: 11, lender_id: 3, borrower_id: 2, amount: 1250.00, declared_repayment: null,    actual_repaid:    0.00, status: 'UNSETTLED', created_at: '2025-05-17' },
  // expense 13: Syaeful spent Winda Cash → Syaeful owes Winda 680 (DRAFT — no loan yet, but we'll include as preview none)
  // (Skipped because expense is DRAFT — loan only on submit.)
];

const SEED_REPAYMENTS = [
  { id: 1, loan_id: 1, recorded_by_id: 2, amount: 500.00,  note: 'Cash over dinner at Cabbages',              repaid_at: '2025-05-16' },
  { id: 2, loan_id: 2, recorded_by_id: 1, amount: 4200.00, note: 'Full settle — bank transfer KBank',         repaid_at: '2025-05-15' },
  { id: 3, loan_id: 5, recorded_by_id: 3, amount: 600.00,  note: 'PromptPay',                                 repaid_at: '2025-05-17' },
];

// helper: derive loan remaining_balance
function loanRemaining(loan) {
  if (loan.declared_repayment == null) return loan.amount; // undeclared = original
  return Math.max(0, loan.declared_repayment - loan.actual_repaid);
}

function fmtTHB(n, { decimals = 2 } = {}) {
  if (n == null || isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

function fmtTHBShort(n) {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1000) return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(n / 1000) + 'k';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateShort(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function userById(state, id) { return state.users.find(u => u.id === id); }
function userByName(state, name) { return state.users.find(u => u.name === name); }
function sourceOwnerId(srcName) { return SOURCE_OWNER[srcName] ?? null; }

// ── Aggregations ──────────────────────────────────────────────────────────
function loanSummaryFor(state, userId) {
  let totalLent = 0, totalLentOutstanding = 0;
  let totalBorrowed = 0, totalBorrowedOutstanding = 0;
  for (const ln of state.loans) {
    if (ln.lender_id === userId) {
      totalLent += ln.amount;
      totalLentOutstanding += loanRemaining(ln);
    }
    if (ln.borrower_id === userId) {
      totalBorrowed += ln.amount;
      totalBorrowedOutstanding += loanRemaining(ln);
    }
  }
  return {
    totalLent, totalLentOutstanding,
    totalBorrowed, totalBorrowedOutstanding,
    net: totalLentOutstanding - totalBorrowedOutstanding,
  };
}

// who-owes-whom pairs (net), for a viewer-agnostic dashboard widget
function netPairs(state) {
  // bucket by ordered pair
  const buckets = new Map();
  for (const ln of state.loans) {
    const rem = loanRemaining(ln);
    if (rem <= 0) continue;
    const key = `${ln.borrower_id}->${ln.lender_id}`;
    buckets.set(key, (buckets.get(key) || 0) + rem);
  }
  // collapse mutual debts
  const out = [];
  const seen = new Set();
  for (const [k, v] of buckets) {
    if (seen.has(k)) continue;
    const [a, b] = k.split('->').map(Number);
    const reverse = `${b}->${a}`;
    const revVal = buckets.get(reverse) || 0;
    seen.add(k); seen.add(reverse);
    const net = v - revVal;
    if (net > 0) out.push({ borrower_id: a, lender_id: b, amount: net });
    else if (net < 0) out.push({ borrower_id: b, lender_id: a, amount: -net });
  }
  return out.sort((x, y) => y.amount - x.amount);
}

function totalSpendByUser(state) {
  const out = {};
  for (const e of state.expenses) {
    if (e.status === 'DRAFT' || e.status === 'REJECTED') continue;
    out[e.user_id] = (out[e.user_id] || 0) + e.amount;
  }
  return out;
}

function totalSpendByCategory(state) {
  const out = {};
  for (const e of state.expenses) {
    if (e.status === 'DRAFT' || e.status === 'REJECTED') continue;
    const k = e.category || 'Uncategorized';
    out[k] = (out[k] || 0) + e.amount;
  }
  return out;
}

// expose
Object.assign(window, {
  USERS, SOURCES, SOURCE_OWNER, CATEGORIES,
  SEED_EXPENSES, SEED_LOANS, SEED_REPAYMENTS,
  loanRemaining, loanSummaryFor, netPairs, totalSpendByUser, totalSpendByCategory,
  fmtTHB, fmtTHBShort, fmtDate, fmtDateShort,
  userById, userByName, sourceOwnerId,
});
