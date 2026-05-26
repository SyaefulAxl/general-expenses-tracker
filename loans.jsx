// Loan dashboard — 2 variations: "narrative cards" (A) and "ledger table" (B)
// Shows Money I Lent + Money I Borrowed, with declare-repayment + record-repayment flows.

function Loans({ state, dispatch, fxCur, variant, lastTouchedLoanId }) {
  const me = lookup.user(state.currentUserId);
  const [tab, setTab] = useState('lent');
  const [personFilter, setPersonFilter] = useState(null);

  const lent = state.loans.filter(l => l.lenderId === me.id);
  const borrowed = state.loans.filter(l => l.borrowerId === me.id);

  // Summary numbers
  const sum = (arr, fn) => arr.reduce((a, b) => a + fn(b), 0);
  const remainOf = (l) => (l.declaredTHB ?? l.amountTHB) - l.actualTHB;

  const totalLent = sum(lent.filter(l => l.status !== 'FULLY_SETTLED'), remainOf);
  const totalBorrowed = sum(borrowed.filter(l => l.status !== 'FULLY_SETTLED'), remainOf);
  const net = totalLent - totalBorrowed;

  const visible = tab === 'lent' ? lent : borrowed;
  const filtered = personFilter
    ? visible.filter(l => (tab === 'lent' ? l.borrowerId : l.lenderId) === personFilter)
    : visible;

  // People filter chips: counterparty totals
  const counterparties = window.AppData.USERS.filter(u => !u.system && u.id !== me.id).map(u => {
    const ls = visible.filter(l => (tab === 'lent' ? l.borrowerId : l.lenderId) === u.id);
    const open = ls.filter(l => l.status !== 'FULLY_SETTLED');
    return { user: u, total: sum(open, remainOf), count: open.length, all: ls.length };
  });

  return (
    <div className="page">
      <div className="seg-summary">
        <div>
          <span className="k">Money I Lent (outstanding)</span>
          <span className="v pos">฿{fmt.thb(totalLent)}</span>
          <span className="conv">≈ {fxCur === 'IDR' ? 'Rp ' + fmt.idr(totalLent) : '$' + fmt.usd(totalLent)} · {lent.filter(l => l.status !== 'FULLY_SETTLED').length} open</span>
        </div>
        <div>
          <span className="k">Money I Borrowed (outstanding)</span>
          <span className="v neg">฿{fmt.thb(totalBorrowed)}</span>
          <span className="conv">≈ {fxCur === 'IDR' ? 'Rp ' + fmt.idr(totalBorrowed) : '$' + fmt.usd(totalBorrowed)} · {borrowed.filter(l => l.status !== 'FULLY_SETTLED').length} open</span>
        </div>
        <div>
          <span className="k">Net position</span>
          <span className={`v ${net >= 0 ? 'pos' : 'neg'}`}>{net >= 0 ? '+' : '−'}฿{fmt.thb(Math.abs(net))}</span>
          <span className="conv">{net >= 0 ? 'Team owes you, net' : 'You owe team, net'} · {fxCur === 'IDR' ? 'Rp ' + fmt.idr(Math.abs(net)) : '$' + fmt.usd(Math.abs(net))}</span>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: 18 }}>
        <div className={`tab ${tab === 'lent' ? 'active' : ''}`} onClick={() => { setTab('lent'); setPersonFilter(null); }}>
          Money I Lent <span className="tab-count">{lent.length}</span>
        </div>
        <div className={`tab ${tab === 'borrowed' ? 'active' : ''}`} onClick={() => { setTab('borrowed'); setPersonFilter(null); }}>
          Money I Borrowed <span className="tab-count">{borrowed.length}</span>
        </div>
        <div className="spacer"/>
        <div style={{ alignSelf: 'center', display: 'flex', gap: 6, paddingBottom: 6 }}>
          <button className="btn sm ghost"><Ico.Download s={12}/> Export</button>
        </div>
      </div>

      {/* Counterparty filter pills */}
      <div className="pers-row" style={{ marginBottom: 14 }}>
        <button className={`pers-chip ${personFilter === null ? 'on' : ''}`} onClick={() => setPersonFilter(null)}>
          <span style={{ paddingLeft: 6 }}>Everyone</span>
          <span className="count">{visible.length}</span>
        </button>
        {counterparties.map(({ user, total, count, all }) => (
          <button key={user.id}
            className={`pers-chip ${personFilter === user.id ? 'on' : ''}`}
            onClick={() => setPersonFilter(personFilter === user.id ? null : user.id)}
          >
            <Avatar user={user}/>
            <span>{user.short}</span>
            <span className="count">{count > 0 ? `฿${fmt.thb(total)}` : 'square'}</span>
          </button>
        ))}
      </div>

      {variant === 'cards'
        ? <LoanCards loans={filtered} tab={tab} me={me} state={state} dispatch={dispatch} fxCur={fxCur} flash={lastTouchedLoanId}/>
        : <LoanTable loans={filtered} tab={tab} me={me} state={state} dispatch={dispatch} fxCur={fxCur} flash={lastTouchedLoanId}/>
      }

      {/* Variation switch reminder */}
      <div className="card" style={{ marginTop: 18, background: 'var(--surface-tint)' }}>
        <div className="card-bd" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ico.AlertC s={16}/>
          <div className="tx-sm">
            <b>Comparing layouts?</b> <span className="muted">Open Tweaks (top-right) and switch the <b>Loan layout</b> control to see both card-narrative and ledger-table variations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variation A: narrative cards ──────────────────────────────────────────
function LoanCards({ loans, tab, me, state, dispatch, fxCur, flash }) {
  if (loans.length === 0) {
    return <EmptyState tab={tab}/>;
  }
  return (
    <div className="col">
      {loans.map(l => (
        <LoanCard key={l.id} loan={l} tab={tab} me={me} state={state} dispatch={dispatch} fxCur={fxCur} flash={flash === l.id}/>
      ))}
    </div>
  );
}

function LoanCard({ loan, tab, me, state, dispatch, fxCur, flash }) {
  const expense = lookup.expense(loan.expenseId, state.expenses);
  const lender = lookup.user(loan.lenderId);
  const borrower = lookup.user(loan.borrowerId);
  const other = tab === 'lent' ? borrower : lender;

  const remain = (loan.declaredTHB ?? loan.amountTHB) - loan.actualTHB;
  const repayments = state.repayments.filter(r => r.loanId === loan.id);

  const [mode, setMode] = useState(null); // null | 'declare' | 'repay'
  const [declareVal, setDeclareVal] = useState(loan.declaredTHB?.toString() || loan.amountTHB.toString());
  const [repayVal, setRepayVal] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [showLog, setShowLog] = useState(false);

  // The lender controls everything per spec (FR-10 + FR-11).
  // If I'm lender → I can declare + record repayment.
  // If I'm borrower → read-only, only lender records.
  const canAct = me.id === lender.id;

  const submitDeclare = () => {
    const v = parseFloat(declareVal);
    if (!v) return;
    dispatch({ type: 'DECLARE_REPAYMENT', loanId: loan.id, amount: v });
    setMode(null);
  };
  const submitRepay = () => {
    const v = parseFloat(repayVal);
    if (!v) return;
    dispatch({ type: 'RECORD_REPAYMENT', loanId: loan.id, amount: v, note: repayNote });
    setMode(null); setRepayVal(''); setRepayNote('');
  };

  return (
    <div className={`loan-card ${flash ? 'flash' : ''}`}>
      <Avatar user={other} size="lg"/>
      <div>
        {/* Narrative line */}
        <div className="lc-line">
          {tab === 'lent' ? (
            <>You lent <b>{other.short}</b> <span className="amt">฿{fmt.thb(loan.amountTHB)}</span> <span className="for">on {fmt.date(loan.created)} for "{expense?.description}"</span></>
          ) : (
            <><b>{other.short}</b> lent you <span className="amt">฿{fmt.thb(loan.amountTHB)}</span> <span className="for">on {fmt.date(loan.created)} for "{expense?.description}"</span></>
          )}
        </div>
        <div className="tx-xs muted" style={{ marginTop: 2 }}>
          ≈ {fxCur === 'IDR' ? 'Rp ' + fmt.idr(loan.amountTHB) : '$' + fmt.usd(loan.amountTHB)} · Loan {loan.id} · from expense #{loan.expenseId} · {expense ? lookup.project(expense.projectId)?.code : ''}
        </div>

        {/* Mini stats */}
        <div className="lc-mini">
          <div>
            <span className="k">Original</span>
            <span className="v">฿{fmt.thb(loan.amountTHB)}</span>
          </div>
          <div>
            <span className="k">Declared repayment</span>
            <span className={`v ${loan.declaredTHB == null ? 'dim' : ''}`}>
              {loan.declaredTHB == null ? 'Not declared' : `฿${fmt.thb(loan.declaredTHB)}`}
            </span>
          </div>
          <div>
            <span className="k">Repaid so far</span>
            <span className={`v ${loan.actualTHB > 0 ? 'pos' : 'dim'}`}>
              ฿{fmt.thb(loan.actualTHB)}
            </span>
          </div>
        </div>

        {/* Inline declare form */}
        {mode === 'declare' && (
          <div className="repay-row">
            <Field label={`How much will ${tab === 'lent' ? other.short : 'you'} repay?`}>
              <MoneyInput value={declareVal} onChange={setDeclareVal} autoFocus/>
            </Field>
            <div className="muted tx-xs" style={{ alignSelf: 'center' }}>
              Sets the target. Repayments count toward this target.
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm ghost" onClick={() => setMode(null)}>Cancel</button>
              <button className="btn sm primary" onClick={submitDeclare}>Save</button>
            </div>
          </div>
        )}

        {mode === 'repay' && (
          <div className="repay-row">
            <Field label="Amount received now">
              <MoneyInput value={repayVal} onChange={setRepayVal} autoFocus/>
            </Field>
            <Field label="Note (optional)">
              <input className="input" placeholder="e.g. PromptPay transfer" value={repayNote} onChange={e => setRepayNote(e.target.value)}/>
            </Field>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn sm ghost" onClick={() => setMode(null)}>Cancel</button>
              <button className="btn sm primary" onClick={submitRepay}>Record</button>
            </div>
          </div>
        )}

        {/* Repayment log */}
        {showLog && repayments.length > 0 && (
          <div style={{ marginTop: 10, background: 'var(--surface-tint)', borderRadius: 5, padding: '8px 12px' }}>
            <div className="tx-xs muted" style={{ fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Repayment history
            </div>
            {repayments.map(r => {
              const who = lookup.user(r.byId);
              return (
                <div key={r.id} className="activity-item" style={{ padding: '6px 0' }}>
                  <span className="dot repay"/>
                  <div className="text">
                    <b>{who?.short}</b> recorded ฿{fmt.thb(r.amountTHB)} {r.note && <span className="muted">— "{r.note}"</span>}
                  </div>
                  <span className="when">{fmt.when(r.at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lc-actions">
        <StatusBadge status={loan.status}/>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-3)', textAlign: 'right' }}>
          Remaining
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: remain > 0 ? 'var(--unsettled)' : 'var(--settled)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          ฿{fmt.thb(Math.max(remain, 0))}
        </div>
        {canAct && loan.status !== 'FULLY_SETTLED' && (
          <Fragment>
            <button className="btn sm" onClick={() => setMode(mode === 'declare' ? null : 'declare')}>
              {loan.declaredTHB == null ? 'Declare repayment' : 'Adjust declared'}
            </button>
            <button className="btn sm primary" onClick={() => setMode(mode === 'repay' ? null : 'repay')}>
              Record repayment
            </button>
          </Fragment>
        )}
        {repayments.length > 0 && (
          <button className="btn sm ghost" onClick={() => setShowLog(s => !s)} style={{ fontSize: 11 }}>
            {showLog ? 'Hide' : 'Show'} log ({repayments.length})
          </button>
        )}
        {!canAct && (
          <div className="muted tx-xs" style={{ textAlign: 'right', marginTop: 4 }}>
            Only {lender.short} can record repayments.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Variation B: ledger table ─────────────────────────────────────────────
function LoanTable({ loans, tab, me, state, dispatch, fxCur, flash }) {
  const [openId, setOpenId] = useState(null);
  if (loans.length === 0) {
    return <EmptyState tab={tab}/>;
  }
  return (
    <div className="card">
      <div className="card-bd flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>{tab === 'lent' ? 'Borrower' : 'Lender'}</th>
              <th>Date</th>
              <th>Expense</th>
              <th className="num">Original</th>
              <th className="num">Declared</th>
              <th className="num">Repaid</th>
              <th className="num">Remaining</th>
              <th>Status</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(l => {
              const expense = lookup.expense(l.expenseId, state.expenses);
              const other = lookup.user(tab === 'lent' ? l.borrowerId : l.lenderId);
              const remain = (l.declaredTHB ?? l.amountTHB) - l.actualTHB;
              const canAct = me.id === l.lenderId;
              const isOpen = openId === l.id;
              const reps = state.repayments.filter(r => r.loanId === l.id);

              return (
                <Fragment key={l.id}>
                  <tr className={flash === l.id ? 'fade-in' : ''}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                        <Avatar user={other}/> <b>{other.short}</b>
                      </span>
                    </td>
                    <td className="nowrap">{fmt.date(l.created)}</td>
                    <td>
                      <div style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5 }}>
                        {expense?.description}
                      </div>
                      <div className="muted tx-xs">#{l.expenseId} · {expense ? lookup.project(expense.projectId)?.code : ''}</div>
                    </td>
                    <td className="num">฿{fmt.thb(l.amountTHB)}</td>
                    <td className="num">{l.declaredTHB == null ? <span className="dim">—</span> : `฿${fmt.thb(l.declaredTHB)}`}</td>
                    <td className="num">{l.actualTHB > 0 ? <span style={{ color: 'var(--positive)' }}>฿{fmt.thb(l.actualTHB)}</span> : <span className="dim">—</span>}</td>
                    <td className="num"><b style={{ color: remain > 0 ? 'var(--unsettled)' : 'var(--settled)' }}>฿{fmt.thb(Math.max(remain, 0))}</b></td>
                    <td><StatusBadge status={l.status}/></td>
                    <td className="actions">
                      {canAct && l.status !== 'FULLY_SETTLED' ? (
                        <button className="btn sm primary" onClick={() => setOpenId(isOpen ? null : l.id)}>
                          {isOpen ? 'Close' : 'Settle'}
                        </button>
                      ) : (
                        <button className="btn sm ghost" onClick={() => setOpenId(isOpen ? null : l.id)}>
                          {isOpen ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={9} style={{ background: 'var(--surface-tint)', padding: 0 }}>
                        <LoanDetailRow loan={l} expense={expense} reps={reps} canAct={canAct} dispatch={dispatch} fxCur={fxCur} other={other} tab={tab}/>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoanDetailRow({ loan, expense, reps, canAct, dispatch, fxCur, other, tab }) {
  const [declareVal, setDeclareVal] = useState(loan.declaredTHB?.toString() || loan.amountTHB.toString());
  const [repayVal, setRepayVal] = useState('');
  const [repayNote, setRepayNote] = useState('');

  return (
    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <div className="tx-xs muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Settlement controls
        </div>
        {canAct ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'end' }}>
              <Field label={`Declared repayment from ${other.short} (THB)`}>
                <MoneyInput value={declareVal} onChange={setDeclareVal}/>
              </Field>
              <button className="btn primary" onClick={() => {
                const v = parseFloat(declareVal);
                if (v > 0) dispatch({ type: 'DECLARE_REPAYMENT', loanId: loan.id, amount: v });
              }}>Save declared</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: 8, alignItems: 'end' }}>
              <Field label="Record repayment (THB)">
                <MoneyInput value={repayVal} onChange={setRepayVal}/>
              </Field>
              <Field label="Note">
                <input className="input" placeholder="e.g. cash returned at hotel" value={repayNote} onChange={e => setRepayNote(e.target.value)}/>
              </Field>
              <button className="btn primary" onClick={() => {
                const v = parseFloat(repayVal);
                if (v > 0) {
                  dispatch({ type: 'RECORD_REPAYMENT', loanId: loan.id, amount: v, note: repayNote });
                  setRepayVal(''); setRepayNote('');
                }
              }}>Record</button>
            </div>
          </div>
        ) : (
          <div className="muted tx-sm">
            You are the borrower on this loan — only the lender records repayments.
          </div>
        )}
      </div>
      <div>
        <div className="tx-xs muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
          Repayment history · {reps.length}
        </div>
        {reps.length === 0
          ? <div className="muted tx-sm">No repayments recorded yet.</div>
          : reps.map(r => {
              const who = lookup.user(r.byId);
              return (
                <div key={r.id} className="activity-item" style={{ padding: '6px 0' }}>
                  <span className="dot repay"/>
                  <div className="text">
                    <b>{who?.short}</b> recorded <b>฿{fmt.thb(r.amountTHB)}</b>
                    {r.note && <span className="muted"> — "{r.note}"</span>}
                  </div>
                  <span className="when">{fmt.when(r.at)}</span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="card">
      <div className="empty">
        <h4>No {tab === 'lent' ? 'loans out' : 'loans owed'}</h4>
        <p>{tab === 'lent'
          ? 'When a teammate logs an expense from your funds, the loan will appear here automatically.'
          : 'When you log an expense from a teammate\'s funds, you\'ll owe them — and it will appear here.'}</p>
      </div>
    </div>
  );
}

Object.assign(window, { Loans });
