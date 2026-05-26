// Dashboard screen — KPIs, budget per project, recent expenses, loan summary.

function Dashboard({ state, dispatch, fxCur }) {
  const { USERS, PROJECTS } = window.AppData;
  const me = lookup.user(state.currentUserId);
  const expenses = state.expenses;
  const loans = state.loans;

  // Totals
  const myExpensesTHB = expenses
    .filter(e => e.recorderId === me.id && e.status !== 'REJECTED')
    .reduce((a, b) => a + b.amountTHB, 0);

  const teamSpendTHB = expenses
    .filter(e => e.status !== 'REJECTED' && e.status !== 'DRAFT')
    .reduce((a, b) => a + b.amountTHB, 0);

  const teamBudgetTHB = PROJECTS.reduce((a, p) => a + p.budgetTHB, 0);

  const owedToMe = loans
    .filter(l => l.lenderId === me.id && l.status !== 'FULLY_SETTLED')
    .reduce((a, b) => a + ((b.declaredTHB ?? b.amountTHB) - b.actualTHB), 0);

  const iOwe = loans
    .filter(l => l.borrowerId === me.id && l.status !== 'FULLY_SETTLED')
    .reduce((a, b) => a + ((b.declaredTHB ?? b.amountTHB) - b.actualTHB), 0);

  const net = owedToMe - iOwe;

  const pending = expenses.filter(e => e.status === 'PENDING').length;

  // Per-project spend
  const projectStats = PROJECTS.map(p => {
    const spent = expenses
      .filter(e => e.projectId === p.id && e.status !== 'REJECTED' && e.status !== 'DRAFT')
      .reduce((a, b) => a + b.amountTHB, 0);
    return { ...p, spent, pct: (spent / p.budgetTHB) * 100 };
  });

  // Recent expenses (last 6)
  const recent = [...expenses].sort((a, b) =>
    b.expense_date.localeCompare(a.expense_date) || b.id - a.id
  ).slice(0, 6);

  // My unsettled — what I owe, by person
  const iOwePeople = USERS.filter(u => !u.system && u.id !== me.id).map(other => {
    const ls = loans.filter(l => l.borrowerId === me.id && l.lenderId === other.id && l.status !== 'FULLY_SETTLED');
    const total = ls.reduce((a, b) => a + ((b.declaredTHB ?? b.amountTHB) - b.actualTHB), 0);
    return { user: other, total, count: ls.length };
  }).filter(x => x.total > 0);

  return (
    <div className="page">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <KPI
          accent
          k="Trip spend (team)"
          v={<><span className="cur" style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 16, marginRight: 2 }}>฿</span>{fmt.thb(teamSpendTHB)}</>}
          fx={fxCur === 'IDR' ? `≈ Rp ${fmt.idr(teamSpendTHB)}` : `≈ $${fmt.usd(teamSpendTHB)}`}
          delta={<><Ico.Spark s={11}/> {Math.round((teamSpendTHB / teamBudgetTHB) * 100)}% of budget</>}
        />
        <KPI
          k="My logged expenses"
          v={<><span className="cur" style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 16, marginRight: 2 }}>฿</span>{fmt.thb(myExpensesTHB)}</>}
          fx={`${expenses.filter(e => e.recorderId === me.id).length} records · ${pending} pending`}
        />
        <KPI
          k="Owed TO me"
          v={<span style={{ color: 'var(--positive)' }}><span className="cur" style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 16, marginRight: 2 }}>฿</span>{fmt.thb(owedToMe)}</span>}
          fx={`${loans.filter(l => l.lenderId === me.id && l.status !== 'FULLY_SETTLED').length} open · across team`}
        />
        <KPI
          k="I owe"
          v={<span style={{ color: 'var(--danger)' }}><span className="cur" style={{ color: 'var(--ink-3)', fontWeight: 500, fontSize: 16, marginRight: 2 }}>฿</span>{fmt.thb(iOwe)}</span>}
          fx={`Net position: ${net >= 0 ? '+' : ''}฿${fmt.thb(net)}`}
        />
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.6fr 1fr', marginTop: 14 }}>
        {/* Budget utilisation */}
        <div className="card">
          <div className="card-hd">
            <h3>Project budget utilisation</h3>
            <span className="meta">Real-time — IDR-equivalent in tooltip</span>
          </div>
          <div className="card-bd flush">
            {projectStats.map(p => (
              <div key={p.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-soft)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {p.name} <span className="muted tx-xs" style={{ marginLeft: 6 }}>{p.code}</span>
                    </div>
                    <div className="muted tx-xs">{fmt.date(p.startDate)} → {fmt.date(p.endDate)} · {p.cc}</div>
                  </div>
                  <div className="right">
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                      ฿{fmt.thb(p.spent)} <span className="muted" style={{ fontWeight: 400 }}>/ ฿{fmt.thb(p.budgetTHB)}</span>
                    </div>
                    <div className="muted tx-xs">{p.pct.toFixed(1)}% used</div>
                  </div>
                </div>
                <ProgressBar value={p.spent} max={p.budgetTHB}/>
              </div>
            ))}
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-tint)' }}>
              <div className="tx-sm muted">All projects</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                ฿{fmt.thb(teamSpendTHB)} / ฿{fmt.thb(teamBudgetTHB)} · {((teamSpendTHB/teamBudgetTHB)*100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Loan summary mini */}
        <div className="card">
          <div className="card-hd">
            <h3>Outstanding with team</h3>
            <button className="btn sm ghost" onClick={() => dispatch({ type: 'NAV', route: 'loans' })}>
              Go to loans <Ico.Arrow s={11}/>
            </button>
          </div>
          <div className="card-bd flush">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="tx-xs muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                I owe ↑
              </div>
              {iOwePeople.length === 0 && <div className="muted tx-sm">You're square with everyone.</div>}
              {iOwePeople.map(({ user, total, count }) => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <Avatar user={user}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{user.short}</div>
                    <div className="muted tx-xs">{count} loan{count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="right">
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>฿{fmt.thb(total)}</div>
                    <div className="muted tx-xs">≈ Rp {fmt.idr(total)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 16px' }}>
              <div className="tx-xs muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
                Owed to me ↓
              </div>
              {USERS.filter(u => !u.system && u.id !== me.id).map(other => {
                const ls = loans.filter(l => l.lenderId === me.id && l.borrowerId === other.id && l.status !== 'FULLY_SETTLED');
                const total = ls.reduce((a, b) => a + ((b.declaredTHB ?? b.amountTHB) - b.actualTHB), 0);
                if (total === 0) return null;
                return (
                  <div key={other.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <Avatar user={other}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{other.short}</div>
                      <div className="muted tx-xs">{ls.length} loan{ls.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="right">
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--positive)' }}>฿{fmt.thb(total)}</div>
                      <div className="muted tx-xs">≈ Rp {fmt.idr(total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent expenses */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-hd">
          <h3>Recent expenses</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm ghost"><Ico.Filter s={12}/> Filter</button>
            <button className="btn sm ghost"><Ico.Download s={12}/> Export</button>
          </div>
        </div>
        <div className="card-bd flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Project</th>
                <th>Category</th>
                <th>Source</th>
                <th>Recorded by</th>
                <th className="num">Amount (THB)</th>
                <th className="num">≈ {fxCur}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(e => {
                const recorder = lookup.user(e.recorderId);
                const source = lookup.source(e.sourceId);
                const project = lookup.project(e.projectId);
                const cat = lookup.cat(e.categoryId);
                const isNew = state.newExpenseIds && state.newExpenseIds.has(e.id);
                return (
                  <tr key={e.id} className={isNew ? 'fade-in' : ''}>
                    <td className="nowrap">{fmt.date(e.expense_date)}</td>
                    <td>
                      <div style={{ fontWeight: 500, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    </td>
                    <td><span className="muted tx-sm">{project?.code}</span></td>
                    <td>{cat?.name}</td>
                    <td><SourcePill source={source} current={lookup.user(e.recorderId)}/></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Avatar user={recorder}/> <span>{recorder?.short}</span>
                      </span>
                    </td>
                    <td className="num"><b>฿{fmt.thb(e.amountTHB)}</b></td>
                    <td className="num muted">{fxCur === 'IDR' ? 'Rp ' + fmt.idr(e.amountTHB) : '$' + fmt.usd(e.amountTHB)}</td>
                    <td><StatusBadge status={e.status}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity feed */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
        <div className="card">
          <div className="card-hd"><h3>Recent activity</h3></div>
          <div className="card-bd">
            <div className="activity">
              {(state.activity || window.AppData.ACTIVITY).slice(0, 6).map((a, i) => {
                const user = lookup.user(a.who);
                return (
                  <div key={i} className="activity-item">
                    <span className="dot" style={{ background: a.what.includes('repayment') ? 'var(--settled)' : a.what.includes('approved') ? 'var(--info)' : 'var(--accent)' }}/>
                    <div className="text">
                      <b>{user?.short}</b> {a.what} <span className="muted">{a.target}</span>
                    </div>
                    <span className="when">{fmt.when(a.at)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><h3>Cash flow by source</h3></div>
          <div className="card-bd">
            <SourceFlowChart expenses={expenses} me={me}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ k, v, fx, delta, accent }) {
  return (
    <div className="kpi">
      {accent && <span className="kpi-accent"/>}
      <div className="kpi-k">{k}</div>
      <div className="kpi-v">{v}</div>
      {fx && <div className="kpi-conv">{fx}</div>}
      {delta && <div className="kpi-delta up">{delta}</div>}
    </div>
  );
}

function SourceFlowChart({ expenses, me }) {
  const { SOURCES } = window.AppData;
  const buckets = SOURCES.map(s => {
    const total = expenses
      .filter(e => e.sourceId === s.id && e.status !== 'REJECTED' && e.status !== 'DRAFT')
      .reduce((a, b) => a + b.amountTHB, 0);
    const owner = lookup.user(s.ownerId);
    return { ...s, total, owner, isOther: owner.id !== me.id && !owner.system };
  }).sort((a, b) => b.total - a.total);
  const max = Math.max(...buckets.map(b => b.total), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buckets.map(b => (
        <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar user={b.owner}/>
            <span className="tx-sm" style={{ fontWeight: 500 }}>{b.label}</span>
          </div>
          <div style={{ height: 14, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: ((b.total / max) * 100) + '%',
              background: b.isOther ? 'linear-gradient(90deg, #fb923c, #ea580c)' : 'var(--accent)',
              borderRadius: 3,
              transition: 'width .6s ease',
            }}/>
          </div>
          <div className="right tx-sm" style={{ fontWeight: 600 }}>฿{fmt.thb(b.total)}</div>
        </div>
      ))}
      <div className="tx-xs muted" style={{ marginTop: 6 }}>
        Orange = team-mate's funds (creates loan). Navy = your own funds.
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
