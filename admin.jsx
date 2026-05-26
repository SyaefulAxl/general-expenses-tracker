// Admin screen — users, categories, cost centers, projects, sources.

function Admin({ state, dispatch }) {
  const [tab, setTab] = useState('users');
  return (
    <div className="page">
      <div className="tabs">
        <div className={`tab ${tab === 'users' ? 'active' : ''}`}      onClick={() => setTab('users')}>Users <span className="tab-count">{state.users.filter(u => !u.system).length}</span></div>
        <div className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Categories <span className="tab-count">{window.AppData.CATEGORIES.length}</span></div>
        <div className={`tab ${tab === 'cc' ? 'active' : ''}`}         onClick={() => setTab('cc')}>Cost centers <span className="tab-count">{window.AppData.COST_CENTERS.length}</span></div>
        <div className={`tab ${tab === 'projects' ? 'active' : ''}`}   onClick={() => setTab('projects')}>Projects <span className="tab-count">{window.AppData.PROJECTS.length}</span></div>
        <div className={`tab ${tab === 'sources' ? 'active' : ''}`}    onClick={() => setTab('sources')}>Sources of funds <span className="tab-count">{window.AppData.SOURCES.length}</span></div>
      </div>

      {tab === 'users' && <UsersPanel state={state}/>}
      {tab === 'categories' && <CategoriesPanel/>}
      {tab === 'cc' && <CostCentersPanel/>}
      {tab === 'projects' && <ProjectsPanel state={state}/>}
      {tab === 'sources' && <SourcesPanel/>}
    </div>
  );
}

const ROLE_INFO = {
  PM:    { label: 'Project Manager',  desc: 'Creates & manages expenses' },
  FIN:   { label: 'Finance Staff',    desc: 'Approves & reconciles' },
  FM:    { label: 'Finance Manager',  desc: 'Final approval authority' },
  ADMIN: { label: 'IT Administrator', desc: 'System config & user mgmt' },
  DIR:   { label: 'Director / C-Level', desc: 'Read-only exec dashboard' },
};

function UsersPanel({ state }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>System users</h3>
          <div className="muted tx-xs">Texcoms Thailand fieldtrip v1.0 — Google Workspace SSO enforced</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn sm ghost"><Ico.Filter s={12}/> Filter</button>
          <button className="btn sm primary"><Ico.Plus s={12}/> Invite user</button>
        </div>
      </div>
      <div className="card-bd flush">
        <table className="tbl">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="num">Expenses logged</th>
              <th className="num">Open loans</th>
              <th>Last activity</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.users.filter(u => !u.system).map(u => {
              const logged = state.expenses.filter(e => e.recorderId === u.id).length;
              const loansOpen = state.loans.filter(l => (l.lenderId === u.id || l.borrowerId === u.id) && l.status !== 'FULLY_SETTLED').length;
              return (
                <tr key={u.id}>
                  <td><Avatar user={u} size="lg"/></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div className="muted tx-xs">@{u.short.toLowerCase()}</div>
                  </td>
                  <td><span className="mono tx-sm">{u.email}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{ROLE_INFO[u.role].label}</div>
                    <div className="muted tx-xs">{ROLE_INFO[u.role].desc}</div>
                  </td>
                  <td><span className="badge dot final">Active</span></td>
                  <td className="num">{logged}</td>
                  <td className="num">{loansOpen}</td>
                  <td className="nowrap muted tx-sm">Today · 14:22</td>
                  <td className="actions">
                    <button className="btn sm ghost"><Ico.Edit s={12}/></button>
                    <button className="btn sm ghost"><Ico.More s={12}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesPanel() {
  const { CATEGORIES } = window.AppData;
  return (
    <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
      <div className="card">
        <div className="card-hd">
          <h3>Expense categories</h3>
          <button className="btn sm primary"><Ico.Plus s={12}/> Add category</button>
        </div>
        <div className="card-bd flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent</th>
                <th className="num">Used in trip</th>
                <th>Active</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td><span className="muted">—</span></td>
                  <td className="num"><span className="muted">0 records</span></td>
                  <td><span className="badge dot final">Yes</span></td>
                  <td className="actions">
                    <button className="btn sm ghost"><Ico.Edit s={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><h3>Subcategory rules</h3></div>
        <div className="card-bd">
          <div className="muted tx-sm" style={{ marginBottom: 10 }}>
            Subcategories are nested under a parent category for finer reporting (FR-14).
          </div>
          <div style={{ background: 'var(--surface-tint)', padding: 12, borderRadius: 5, fontSize: 12.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Transport</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-2)' }}>
              <li>BTS / MRT</li>
              <li>Grab / Bolt</li>
              <li>Tuk-tuk &amp; songthaew</li>
              <li>Airport rail link</li>
              <li>Inter-city train</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostCentersPanel() {
  const { COST_CENTERS } = window.AppData;
  return (
    <div className="card">
      <div className="card-hd">
        <h3>Cost centers</h3>
        <button className="btn sm primary"><Ico.Plus s={12}/> Add cost center</button>
      </div>
      <div className="card-bd flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Owner</th>
              <th>Active</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {COST_CENTERS.map(c => (
              <tr key={c.id}>
                <td><span className="mono tx-sm" style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 3 }}>{c.code}</span></td>
                <td><b>{c.name}</b></td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Avatar user={lookup.user(3)}/> Winda
                  </span>
                </td>
                <td><span className="badge dot final">Yes</span></td>
                <td className="actions">
                  <button className="btn sm ghost"><Ico.Edit s={12}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectsPanel({ state }) {
  const { PROJECTS } = window.AppData;
  return (
    <div className="card">
      <div className="card-hd">
        <h3>Projects</h3>
        <button className="btn sm primary"><Ico.Plus s={12}/> Add project</button>
      </div>
      <div className="card-bd flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Cost center</th>
              <th>Dates</th>
              <th className="num">Budget (THB)</th>
              <th className="num">Spent</th>
              <th>Utilisation</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map(p => {
              const spent = state.expenses
                .filter(e => e.projectId === p.id && e.status !== 'REJECTED' && e.status !== 'DRAFT')
                .reduce((a, b) => a + b.amountTHB, 0);
              const pct = (spent / p.budgetTHB) * 100;
              return (
                <tr key={p.id}>
                  <td><span className="mono tx-sm" style={{ background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 3 }}>{p.code}</span></td>
                  <td><b>{p.name}</b></td>
                  <td>{p.cc}</td>
                  <td className="nowrap tx-sm">{fmt.date(p.startDate)} → {fmt.date(p.endDate)}</td>
                  <td className="num">฿{fmt.thb(p.budgetTHB)}</td>
                  <td className="num">฿{fmt.thb(spent)}</td>
                  <td style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={spent} max={p.budgetTHB}/></div>
                      <span className="tx-xs nowrap">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="actions">
                    <button className="btn sm ghost"><Ico.Edit s={12}/></button>
                    <button className="btn sm ghost"><Ico.More s={12}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourcesPanel() {
  const { SOURCES } = window.AppData;
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <h3>Sources of funds</h3>
          <div className="muted tx-xs">Each source is owned by a user. Spending another user's source auto-creates a loan (FR-09).</div>
        </div>
        <button className="btn sm primary"><Ico.Plus s={12}/> Add source</button>
      </div>
      <div className="card-bd flush">
        <table className="tbl">
          <thead>
            <tr>
              <th>Label</th>
              <th>Owner</th>
              <th>Kind</th>
              <th>Currency</th>
              <th>Active</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {SOURCES.map(s => {
              const owner = lookup.user(s.ownerId);
              return (
                <tr key={s.id}>
                  <td><b>{s.label}</b></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <Avatar user={owner}/> <span>{owner.name}</span>
                    </span>
                  </td>
                  <td><span className="badge draft">{s.kind}</span></td>
                  <td>THB</td>
                  <td><span className="badge dot final">Yes</span></td>
                  <td className="actions">
                    <button className="btn sm ghost"><Ico.Edit s={12}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { Admin });
