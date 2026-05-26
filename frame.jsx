// frame.jsx — Static design frames for the variations canvas.
// Each frame mounts its own theme/state/screen with no role-switcher / tweaks panel.

const { useState: useFs, useReducer: useFr, useMemo: useFm } = React;

// shared frame chrome (mini topbar)
function FrameTopbar({ state, currentUser, activeTab, hideAdmin, showRoleSwitcher, compact, accent }) {
  const myOutstanding = state.loans
    .filter((l) => l.borrower_id === currentUser.id)
    .reduce((s, l) => s + loanRemaining(l), 0);
  return (
    <header className="topbar" style={compact ? { height: 52, padding: '0 18px' } : null}>
      <div className="brand">
        <div className="brand-mark">฿</div>
        <div>
          <div className="brand-name">Expenses Tracker</div>
          <div className="brand-sub">Thailand Edition</div>
        </div>
      </div>
      <nav className="nav">
        {[
          { k: 'dashboard', label: 'Dashboard',  icon: <IconHome size={14}/> },
          { k: 'list',      label: 'List of data', icon: <IconList size={14}/> },
          { k: 'loans',     label: 'Loan data',  icon: <IconCoins size={14}/> },
          { k: 'history',   label: 'History',    icon: <IconHistory size={14}/> },
          ...(currentUser.role === 'ADMIN' && !hideAdmin ? [{ k: 'admin', label: 'Admin', icon: <IconShield size={14}/> }] : []),
        ].map((t) => (
          <div key={t.k} className={`nav-item ${activeTab === t.k ? 'active' : ''}`}>
            {t.icon} {t.label}
          </div>
        ))}
      </nav>
      <div className="topbar-right">
        {myOutstanding > 0 && (
          <div className="loan-badge"><span className="dot"/> You owe <b>{fmtTHB(myOutstanding, { decimals: 0 })} ฿</b></div>
        )}
        {showRoleSwitcher && (
          <div className="role-switcher">
            {state.users.map((u) => (
              <button key={u.id} className={u.id === currentUser.id ? 'active' : ''}>
                <Avatar user={u} size="sm"/> {u.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// Desktop frame — renders full app-shell with chosen screen + frozen tweaks
function DesktopFrame({
  width = 1280, height = 800,
  accent = 'blue', dark = false, density = 'regular', font = 'jakarta',
  userId = 1, screen = 'dashboard',
  dashboardLayout = 'graph', loanView = 'split', expenseEntry = 'modal',
  openExpense = false, openLoan = null,
  hideRoleSwitcher = false,
  state: overrideState,
}) {
  const initialState = overrideState ? { ...overrideState, currentUserId: userId } : { ...INITIAL_STATE, currentUserId: userId };
  const [state, dispatch] = useFr(reducer, initialState);
  const currentUser = state.users.find((u) => u.id === state.currentUserId);

  const className = [`accent-${accent}`, dark ? 'dark' : '', `density-${density}`, `font-${font}`].filter(Boolean).join(' ');
  const tweaks = { dashboardLayout, loanView, expenseEntry, set: () => {} };

  return (
    <div className={`design-frame ${className} app-shell`} style={{ width, height, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <FrameTopbar state={state} currentUser={currentUser} activeTab={screen} showRoleSwitcher={!hideRoleSwitcher} hideAdmin={currentUser.role !== 'ADMIN'} />
      <div className="page" style={{ flex: 1, overflow: 'auto', maxWidth: 'none' }}>
        {screen === 'dashboard' && <Dashboard state={state} currentUser={currentUser} tweaks={tweaks} onJump={()=>{}} />}
        {screen === 'list'      && <ListOfData state={state} currentUser={currentUser} dispatch={dispatch} tweaks={tweaks} />}
        {screen === 'loans'     && <LoanData state={state} currentUser={currentUser} dispatch={dispatch} tweaks={tweaks} />}
        {screen === 'history'   && <History state={state} currentUser={currentUser}/>}
        {screen === 'admin'     && <Admin state={state} currentUser={currentUser} dispatch={dispatch}/>}
      </div>

      {/* Forced overlays for marketing-style screens (modal/drawer demos) */}
      {openExpense && expenseEntry === 'modal' && (
        <ForcedModal title="New expense">
          <FrozenExpenseForm currentUser={currentUser} />
        </ForcedModal>
      )}
      {openExpense && expenseEntry === 'drawer' && (
        <ForcedDrawer title="New expense">
          <FrozenExpenseForm currentUser={currentUser} />
        </ForcedDrawer>
      )}
      {openLoan && (
        <ForcedModal title="Manage loan settlement" width={580}>
          <FrozenLoanDialog state={state} loanId={openLoan} />
        </ForcedModal>
      )}
    </div>
  );
}

// non-dismissable modal / drawer for screenshot frames
function ForcedModal({ title, width, children }) {
  return (
    <>
      <div className="scrim" style={{ position: 'absolute' }}/>
      <div className="modal" style={{ position: 'absolute', width: width || 540, maxHeight: '85%' }}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon"><IconX size={16}/></button>
        </div>
        <div className="modal-bd">{children}</div>
      </div>
    </>
  );
}
function ForcedDrawer({ title, children }) {
  return (
    <>
      <div className="scrim" style={{ position: 'absolute' }}/>
      <div className="drawer" style={{ position: 'absolute' }}>
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon"><IconX size={16}/></button>
        </div>
        <div className="modal-bd">{children}</div>
      </div>
    </>
  );
}

// pre-filled expense form for screenshots
function FrozenExpenseForm({ currentUser }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-lg)' }}>
      <div className="form-grid">
        <div className="field">
          <label>Expense date<span className="req">*</span></label>
          <div className="input-wrap">
            <IconCalendar size={14} className="icon-leading"/>
            <input type="date" className="input with-icon" defaultValue="2025-05-18"/>
          </div>
          <div className="hint">Date the expense occurred — not submission date.</div>
        </div>
        <div className="field">
          <label>Amount (THB)<span className="req">*</span></label>
          <input className="input mono" defaultValue="1,250.00" />
        </div>
        <div className="field span-2">
          <label>Description<span className="req">*</span></label>
          <input className="input" defaultValue="Songthaew + parking — Chiang Mai old city"/>
        </div>
        <div className="field">
          <label>Source<span className="req">*</span></label>
          <select className="select" defaultValue="ATM Dina">
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="hint" style={{ color: 'var(--warn-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconInfo size={12}/> On submit: <b style={{ marginLeft: 2 }}>{currentUser.name} owes Dina 1,250.00 ฿</b>
          </div>
        </div>
        <div className="field">
          <label>Category</label>
          <select className="select" defaultValue="Transport">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="field span-2">
          <label>Attachment</label>
          <div className="file-zone">
            <IconUpload className="file-icon" size={22}/>
            <div>Drag receipt here or <b style={{ color: 'var(--primary)' }}>browse</b></div>
            <div style={{ fontSize: 11, marginTop: 4 }}>JPG, PNG or PDF · max 5 MB</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost">Cancel</button>
        <button className="btn btn-secondary">Save draft</button>
        <button className="btn"><IconSend size={13}/> Submit</button>
      </div>
    </div>
  );
}

function FrozenLoanDialog({ state, loanId }) {
  const loan = state.loans.find((l) => l.id === loanId) || state.loans[0];
  const lender = userById(state, loan.lender_id);
  const borrower = userById(state, loan.borrower_id);
  const remaining = loanRemaining(loan);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
      <div style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <Avatar user={borrower}/><span className="muted" style={{ fontSize: 12 }}>owes</span><Avatar user={lender}/>
          </div>
          <LoanStatusBadge status={loan.status}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 12 }}>
          <Stat label="Original" value={fmtTHB(loan.amount)} unit="฿"/>
          <Stat label="Declared" value={loan.declared_repayment == null ? '—' : fmtTHB(loan.declared_repayment)} unit="฿"/>
          <Stat label="Remaining" value={fmtTHB(remaining)} unit="฿" emphasis/>
        </div>
      </div>
      <div className="tabs">
        <button>Declare repayment</button>
        <button className="active">Record actual payment</button>
      </div>
      <div className="field">
        <label>Repayment amount received (THB)</label>
        <input className="input mono" defaultValue={remaining.toFixed(2)}/>
        <div className="hint">Remaining: {fmtTHB(remaining)} ฿ · Partial or full.</div>
      </div>
      <div className="field">
        <label>Note</label>
        <input className="input" defaultValue="PromptPay transfer"/>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', gap: 8 }}>
        <button className="btn btn-ghost">Cancel</button>
        <button className="btn btn-success"><IconCheck size={13}/> Record repayment</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MOBILE FRAME — purpose-built mobile layouts
// ─────────────────────────────────────────────────────────────────────────
function MobileFrame({
  accent = 'blue', dark = false, density = 'regular', font = 'jakarta',
  userId = 2, screen = 'dashboard', state: stateOverride, openSheet,
}) {
  const state = stateOverride || { ...INITIAL_STATE, currentUserId: userId };
  const currentUser = state.users.find((u) => u.id === userId);
  const className = [`accent-${accent}`, dark ? 'dark' : '', `density-${density}`, `font-${font}`].filter(Boolean).join(' ');

  return (
    <div className={`mobile-shell design-frame ${className}`}>
      <div className="mobile-status">
        <span style={{ fontSize: 13 }}>9:41</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
          <span>5G</span>
          <svg width="20" height="11" viewBox="0 0 22 12" fill="currentColor"><rect x="0" y="2" width="18" height="8" rx="2" fill="none" stroke="currentColor"/><rect x="2" y="4" width="14" height="4" fill="currentColor"/><rect x="19" y="5" width="2" height="2" rx="1"/></svg>
        </span>
      </div>
      <div className="mobile-topbar">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hi, {currentUser.name}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>
            {screen === 'dashboard' ? 'Dashboard' : screen === 'list' ? 'Expenses' : screen === 'loans' ? 'Loans' : 'History'}
          </div>
        </div>
        <Avatar user={currentUser}/>
      </div>

      <div className="mobile-page">
        {screen === 'dashboard' && <MobileDashboard state={state} currentUser={currentUser}/>}
        {screen === 'list'      && <MobileList state={state} currentUser={currentUser}/>}
        {screen === 'loans'     && <MobileLoans state={state} currentUser={currentUser}/>}
        {screen === 'history'   && <MobileHistory state={state} currentUser={currentUser}/>}
      </div>

      {openSheet === 'newExpense' && (
        <MobileNewExpenseSheet currentUser={currentUser}/>
      )}

      <div className="mobile-tabbar">
        <div className={`tab ${screen === 'dashboard' ? 'active' : ''}`}><IconHome/> Home</div>
        <div className={`tab ${screen === 'list' ? 'active' : ''}`}><IconList/> Expenses</div>
        <div className="tab" style={{ marginTop: -14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(59,130,246,0.4)' }}>
            <IconPlus size={20}/>
          </div>
        </div>
        <div className={`tab ${screen === 'loans' ? 'active' : ''}`}><IconCoins/> Loans</div>
        <div className={`tab ${screen === 'history' ? 'active' : ''}`}><IconHistory/> History</div>
      </div>
    </div>
  );
}

function MobileDashboard({ state, currentUser }) {
  const summary = loanSummaryFor(state, currentUser.id);
  const pairs = netPairs(state).slice(0, 3);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        padding: 16, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-active) 100%)',
        color: 'white',
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: .82, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Net position</div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 4 }}>
          {summary.net >= 0 ? '+' : '−'}{fmtTHB(Math.abs(summary.net), { decimals: 0 })} <span style={{ fontSize: 14, fontWeight: 600, opacity: .9 }}>฿</span>
        </div>
        <div style={{ fontSize: 12, opacity: .85, marginTop: 6 }}>
          {summary.net >= 0 ? 'Team owes you' : 'You owe the team'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', padding: 10, borderRadius: 10 }}>
            <div style={{ fontSize: 10, opacity: .9, fontWeight: 600 }}>Owed to you</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmtTHB(summary.totalLentOutstanding, { decimals: 0 })} ฿</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', padding: 10, borderRadius: 10 }}>
            <div style={{ fontSize: 10, opacity: .9, fontWeight: 600 }}>You owe</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmtTHB(summary.totalBorrowedOutstanding, { decimals: 0 })} ฿</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd" style={{ padding: '12px 14px' }}>
          <h3 style={{ fontSize: 13 }}>Who owes whom</h3>
          <a className="muted" style={{ fontSize: 11 }}>See all →</a>
        </div>
        <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.map((p, i) => {
            const a = userById(state, p.borrower_id);
            const b = userById(state, p.lender_id);
            return (
              <div key={i} className="owes-row">
                <span className="pair">
                  <Avatar user={a} size="sm"/>
                  <IconArrowRt size={12} className="muted"/>
                  <Avatar user={b} size="sm"/>
                  <span style={{ marginLeft: 4, fontSize: 12 }}><b>{a.name}</b> → {b.name}</span>
                </span>
                <span className="amount mono">{fmtTHB(p.amount, { decimals: 0 })} ฿</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-hd" style={{ padding: '12px 14px' }}>
          <h3 style={{ fontSize: 13 }}>Recent expenses</h3>
        </div>
        <div style={{ padding: '0 14px 8px' }}>
          {state.expenses.slice(0, 4).map((e, i, xs) => {
            const u = userById(state, e.user_id);
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < xs.length - 1 ? '1px solid var(--border-2)' : 'none' }}>
                <Avatar user={u} size="sm"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.name} · {fmtDateShort(e.expense_date)}</div>
                </div>
                <div className="strong mono" style={{ fontSize: 12 }}>{fmtTHB(e.amount, { decimals: 0 })} ฿</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileList({ state, currentUser }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <Chip active>All</Chip>
        <Chip>Draft</Chip>
        <Chip>Pending</Chip>
        <Chip>Approved</Chip>
      </div>
      {state.expenses.slice(0, 7).map((e) => {
        const u = userById(state, e.user_id);
        return (
          <div key={e.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Avatar user={u} size="sm"/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{e.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{u.name} · {fmtDateShort(e.expense_date)} · {e.source}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <ExpenseStatusBadge status={e.status}/>
                  {e.category && <CategoryBadge value={e.category}/>}
                </div>
              </div>
              <div className="strong mono" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{fmtTHB(e.amount, { decimals: 0 })} ฿</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileLoans({ state, currentUser }) {
  const summary = loanSummaryFor(state, currentUser.id);
  const lent = state.loans.filter((l) => l.lender_id === currentUser.id);
  const borrowed = state.loans.filter((l) => l.borrower_id === currentUser.id);
  const [tab, setTab] = useFs('borrowed');
  const xs = tab === 'lent' ? lent : borrowed;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owed to you</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success-700)', marginTop: 2 }}>{fmtTHB(summary.totalLentOutstanding, { decimals: 0 })} ฿</div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>You owe</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--danger-700)', marginTop: 2 }}>{fmtTHB(summary.totalBorrowedOutstanding, { decimals: 0 })} ฿</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Chip active={tab === 'lent'}     onClick={() => setTab('lent')}>I lent ({lent.length})</Chip>
        <Chip active={tab === 'borrowed'} onClick={() => setTab('borrowed')}>I borrowed ({borrowed.length})</Chip>
      </div>
      {xs.map((l) => {
        const other = userById(state, tab === 'lent' ? l.borrower_id : l.lender_id);
        const rem = loanRemaining(l);
        const total = l.declared_repayment ?? l.amount;
        const pct = total > 0 ? (l.actual_repaid / total) * 100 : 0;
        return (
          <div key={l.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar user={other} size="sm"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tab === 'lent' ? `${other.name} owes you` : `You owe ${other.name}`}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDateShort(l.created_at)}</div>
              </div>
              <LoanStatusBadge status={l.status}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-2)' }}>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>ORIGINAL</div><div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{fmtTHB(l.amount, { decimals: 0 })}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>REPAID</div><div className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{fmtTHB(l.actual_repaid, { decimals: 0 })}</div></div>
              <div><div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>LEFT</div><div className="mono" style={{ fontSize: 12, fontWeight: 700, color: rem > 0 ? 'var(--danger-700)' : 'var(--success-700)' }}>{fmtTHB(rem, { decimals: 0 })}</div></div>
            </div>
            <div className={`progress ${pct >= 100 ? 'ok' : pct > 0 ? 'warn' : ''}`} style={{ marginTop: 10 }}>
              <span style={{ width: `${Math.min(100, pct)}%` }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileHistory({ state, currentUser }) {
  const mine = state.expenses.filter((e) => e.user_id === currentUser.id && e.status !== 'DRAFT');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {mine.map((e) => (
        <div key={e.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center', width: 36 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{new Date(e.expense_date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, color: 'var(--text-strong)' }}>{new Date(e.expense_date + 'T00:00:00').getDate()}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-strong)' }}>{e.description}</div>
            <div style={{ marginTop: 4 }}><ExpenseStatusBadge status={e.status}/></div>
          </div>
          <div className="strong mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{fmtTHB(e.amount, { decimals: 0 })} ฿</div>
        </div>
      ))}
    </div>
  );
}

function MobileNewExpenseSheet({ currentUser }) {
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)' }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--panel)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: 18, paddingBottom: 28,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
        maxHeight: '80%', overflow: 'auto',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-strong)' }}>New expense</h3>
          <button className="btn btn-ghost btn-icon"><IconX size={16}/></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field"><label>Amount (THB)<span className="req">*</span></label>
            <input className="input mono" defaultValue="1,500.00" style={{ fontSize: 22, fontWeight: 700 }}/></div>
          <div className="field"><label>Description<span className="req">*</span></label>
            <input className="input" defaultValue="Grab rides — Suvarnabhumi to Sukhumvit"/></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field"><label>Date</label><input className="input" type="date" defaultValue="2025-05-14"/></div>
            <div className="field"><label>Category</label><select className="select"><option>Transport</option></select></div>
          </div>
          <div className="field"><label>Source<span className="req">*</span></label>
            <select className="select" defaultValue="Winda Cash">{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            <div className="hint" style={{ color: 'var(--warn-700)' }}>→ Creates loan: you owe Winda 1,500 ฿</div>
          </div>
          <div className="field"><label>Receipt</label>
            <div className="file-zone" style={{ padding: 14 }}><IconUpload size={20} style={{ margin: '0 auto 4px', display: 'block' }}/>Tap to upload</div>
          </div>
          <button className="btn btn-lg" style={{ justifyContent: 'center', marginTop: 6 }}><IconSend size={14}/> Submit expense</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  DesktopFrame, MobileFrame, FrameTopbar,
});
