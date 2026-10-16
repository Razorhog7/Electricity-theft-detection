import { ChangeEvent, DragEvent, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Bell, Check, ChevronDown, ChevronRight,
  CircleHelp, Database, Download, FileJson, FileSpreadsheet, Gauge, GitBranch, Home,
  LayoutDashboard, ListFilter, Network, Plus, Search, Settings2, ShieldCheck, SlidersHorizontal,
  UploadCloud, X, Zap,
} from 'lucide-react'

type Row = { transformer: string; feeder: string; household: string; timestamp: string; voltage: string; load: string; status: 'Healthy' | 'Warning' | 'Critical' }
type NavItem = { label: string; icon: typeof Home }

const sampleRows: Row[] = [
  { transformer: 'TX-1042', feeder: 'FD-07A', household: 'HH-22091', timestamp: '2025-02-18 14:00', voltage: '231.4 V', load: '68%', status: 'Healthy' },
  { transformer: 'TX-1042', feeder: 'FD-07A', household: 'HH-22092', timestamp: '2025-02-18 14:00', voltage: '229.8 V', load: '74%', status: 'Healthy' },
  { transformer: 'TX-1042', feeder: 'FD-07B', household: 'HH-22107', timestamp: '2025-02-18 14:00', voltage: '218.2 V', load: '91%', status: 'Warning' },
  { transformer: 'TX-1042', feeder: 'FD-07B', household: 'HH-22108', timestamp: '2025-02-18 14:00', voltage: '216.9 V', load: '94%', status: 'Warning' },
  { transformer: 'TX-1043', feeder: 'FD-08A', household: 'HH-22165', timestamp: '2025-02-18 14:00', voltage: '232.1 V', load: '56%', status: 'Healthy' },
  { transformer: 'TX-1043', feeder: 'FD-08A', household: 'HH-22166', timestamp: '2025-02-18 14:00', voltage: '233.5 V', load: '51%', status: 'Healthy' },
  { transformer: 'TX-1043', feeder: 'FD-08B', household: 'HH-22179', timestamp: '2025-02-18 14:00', voltage: '205.7 V', load: '98%', status: 'Critical' },
]

const navItems: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Dataset', icon: Database },
  { label: 'Investigation', icon: Search }, { label: 'Graph', icon: Network },
  { label: 'Physics model', icon: Zap }, { label: 'Evaluation', icon: BarChart3 },
]

function App() {
  const [active, setActive] = useState('Dataset')
  const [rows, setRows] = useState<Row[]>(sampleRows)
  const [search, setSearch] = useState('')
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'TX-1042': true, 'TX-1043': true, 'FD-07A': true })
  const [toast, setToast] = useState('')

  const filteredRows = useMemo(() => rows.filter(row => Object.values(row).some(value => value.toLowerCase().includes(search.toLowerCase()))), [rows, search])
  const transformers = new Set(rows.map(row => row.transformer)).size
  const feeders = new Set(rows.map(row => row.feeder)).size
  const households = new Set(rows.map(row => row.household)).size

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const isJson = file.name.endsWith('.json')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        if (isJson) {
          const parsed = JSON.parse(String(reader.result))
          const data = Array.isArray(parsed) ? parsed : parsed.data
          if (Array.isArray(data)) setRows(data.map(normalizeRow))
        } else {
          const lines = String(reader.result).trim().split(/\r?\n/)
          const headers = lines.shift()?.split(',').map(s => s.trim().toLowerCase()) ?? []
          setRows(lines.filter(Boolean).map(line => normalizeRow(Object.fromEntries(line.split(',').map((v, i) => [headers[i], v.trim()])))))
        }
        flash(`${file.name} loaded successfully`)
      } catch { flash('Could not read this file. Check the required fields.') }
    }
    reader.readAsText(file)
  }
  function normalizeRow(raw: Record<string, unknown>): Row {
    const get = (...keys: string[]) => String(keys.map(k => raw[k] ?? raw[k.replace(/_/g, '')]).find(v => v !== undefined) ?? '—')
    return { transformer: get('transformer_id', 'transformer'), feeder: get('feeder_id', 'feeder'), household: get('household_id', 'household'), timestamp: get('timestamp', 'datetime', 'date'), voltage: `${get('voltage')} V`.replace('— V', '—'), load: `${get('load', 'load_pct')}%`.replace('—%', '—'), status: 'Healthy' }
  }
  function flash(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2800) }
  function toggle(key: string) { setExpanded(prev => ({ ...prev, [key]: !prev[key] })) }
  function onDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }
  function exportData() { const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'gridlens-dataset.json'; a.click(); URL.revokeObjectURL(url); flash('Dataset exported') }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={18} /></div><span>gridlens</span><span className="brand-beta">BETA</span></div>
      <div className="workspace-label">WORKSPACE <button aria-label="Add workspace"><Plus size={14} /></button></div>
      <div className="workspace-card"><div className="workspace-icon">N</div><div><strong>Northwind pilot</strong><small>Grid operations</small></div><ChevronDown size={15} /></div>
      <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => setActive(item.label)}><Icon size={17} /><span>{item.label}</span>{item.label === 'Dataset' && <span className="nav-count">1</span>}</button> })}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17} /><span>Settings</span></button><button className="nav-item"><CircleHelp size={17} /><span>Help center</span></button><div className="user-card"><div className="avatar">AS</div><div><strong>Alex Singh</strong><small>Admin</small></div><ChevronDown size={14} /></div></div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumbs"><span>Northwind pilot</span><ChevronRight size={14} /><strong>{active}</strong></div><div className="top-actions"><div className="sync-status"><span className="pulse" /> All systems operational</div><button className="icon-button"><Bell size={18} /><span className="notification-dot" /></button><button className="avatar avatar-small">AS</button></div></header>
      {active !== 'Dataset' ? <PlaceholderView title={active} /> : <>
      <section className="page-heading"><div><div className="eyebrow"><Database size={14} /> DATA MANAGEMENT</div><h1>Dataset workspace</h1><p>Validate your grid topology before running an investigation.</p></div><div className="heading-actions"><button className="button secondary" onClick={exportData}><Download size={16} /> Export dataset</button><button className="button primary" onClick={() => document.getElementById('file-input')?.click()}><UploadCloud size={16} /> Import data</button></div></section>

      <section className={`dropzone ${dragging ? 'dragging' : ''}`} onDragEnter={() => setDragging(true)} onDragOver={e => e.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        <div className="drop-icon"><UploadCloud size={22} /></div><div className="drop-copy"><strong>Drop your dataset here</strong><span>or <button onClick={() => document.getElementById('file-input')?.click()}>browse files</button> from your computer</span></div><div className="file-types"><span><FileSpreadsheet size={14} /> CSV</span><span><FileJson size={14} /> JSON</span><small>Max 50 MB</small></div><input id="file-input" type="file" accept=".csv,.json" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)} /></section>

      <section className="summary-grid"><SummaryCard icon={<Database />} label="Transformers" value={String(transformers)} detail="2 active assets" tone="purple" /><SummaryCard icon={<GitBranch />} label="Feeders" value={String(feeders)} detail="Across all transformers" tone="blue" /><SummaryCard icon={<Home />} label="Households" value={String(households)} detail="Unique endpoints" tone="green" /><SummaryCard icon={<ListFilter />} label="Rows processed" value={String(rows.length * 188)} detail="100% valid records" tone="orange" /></section>

      <section className="validation-banner"><div className="validation-icon"><ShieldCheck size={19} /></div><div><strong>Dataset is ready for analysis</strong><span>All required fields are present and relationships are consistent.</span></div><div className="validation-meta"><span className="check-pill"><Check size={14} /> 0 errors</span><span className="warning-pill"><AlertTriangle size={14} /> 3 warnings</span><button className="text-button">Review details <ArrowRight size={14} /></button></div></section>

      <div className="content-grid"><section className="panel preview-panel"><div className="panel-header"><div><h2>Dataset preview</h2><p>Showing the latest 7 of {rows.length * 188} records</p></div><div className="panel-tools"><div className="search-field"><Search size={15} /><input placeholder="Search records" value={search} onChange={e => setSearch(e.target.value)} /></div><button className="filter-button"><SlidersHorizontal size={15} /> Filter</button></div></div><div className="table-wrap"><table><thead><tr><th>Transformer <ChevronDown size={13} /></th><th>Feeder</th><th>Household</th><th>Timestamp</th><th>Voltage</th><th>Load</th><th>Status</th></tr></thead><tbody>{filteredRows.map((row, i) => <tr key={`${row.household}-${i}`}><td><span className="mono">{row.transformer}</span></td><td><span className="mono">{row.feeder}</span></td><td><span className="mono">{row.household}</span></td><td>{row.timestamp}</td><td>{row.voltage}</td><td><div className="load-cell"><div className="load-bar"><i style={{ width: row.load === '—' ? '0%' : row.load }} /></div>{row.load}</div></td><td><Status status={row.status} /></td></tr>)}</tbody></table></div><div className="table-footer"><span>Last updated 2 minutes ago</span><button className="pagination active-page">1</button><button className="pagination">2</button><button className="pagination">3</button><span>...</span><button className="pagination">24</button></div></section>

      <section className="panel quality-panel"><div className="panel-header"><div><h2>Data quality</h2><p>Automated checks on your upload</p></div><button className="icon-button subtle"><Settings2 size={16} /></button></div><div className="quality-score"><div className="score-ring"><strong>94</strong><span>/100</span></div><div><strong>Good quality</strong><p>Ready to use with minor warnings</p></div></div><div className="quality-list"><QualityRow label="Required fields" detail="All fields present" icon={<Check />} tone="good" /><QualityRow label="Relationships" detail="No orphan records" icon={<Check />} tone="good" /><QualityRow label="Duplicate records" detail="3 potential duplicates" icon={<AlertTriangle />} tone="warning" /><QualityRow label="Value ranges" detail="2 unusual readings" icon={<AlertTriangle />} tone="warning" /></div><button className="full-button" onClick={() => flash('Validation report opened')}>View full validation report <ArrowRight size={15} /></button></section></div>

      <section className="panel hierarchy-panel"><div className="panel-header"><div><h2>Topology hierarchy</h2><p>Transformer → feeder → household relationships</p></div><div className="hierarchy-tools"><span className="legend"><i className="legend-dot purple" /> Transformer</span><span className="legend"><i className="legend-dot blue" /> Feeder</span><span className="legend"><i className="legend-dot green" /> Household</span></div></div><div className="tree">{Array.from(new Set(rows.map(r => r.transformer))).map(tx => <div className="tree-group" key={tx}><TreeLine label={tx} sub={`${rows.filter(r => r.transformer === tx).length * 94} households`} color="purple" open={!!expanded[tx]} onClick={() => toggle(tx)} />{expanded[tx] && Array.from(new Set(rows.filter(r => r.transformer === tx).map(r => r.feeder))).map(fd => <div className="tree-child" key={fd}><TreeLine label={fd} sub={`${rows.filter(r => r.feeder === fd).length * 94} households`} color="blue" open={!!expanded[fd]} onClick={() => toggle(fd)} />{expanded[fd] && <div className="household-list">{rows.filter(r => r.feeder === fd).slice(0, 2).map(row => <TreeLine key={row.household} label={row.household} sub={row.status === 'Healthy' ? 'Connected · 2.4 kWh' : 'Needs review · 4.1 kWh'} color="green" />)}<button className="show-more">+ {Math.max(0, rows.filter(r => r.feeder === fd).length * 94 - 2)} more households</button></div>}</div>)}</div>)}</div></section>
      </>}
    </main>{toast && <div className="toast"><Check size={16} /> {toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}
  </div>
}

function SummaryCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) { return <div className="summary-card"><div className={`summary-icon ${tone}`}>{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><div className="trend">↗</div></div> }
function Status({ status }: { status: Row['status'] }) { return <span className={`status ${status.toLowerCase()}`}><i /> {status}</span> }
function QualityRow({ label, detail, icon, tone }: { label: string; detail: string; icon: React.ReactNode; tone: string }) { return <div className="quality-row"><div className={`quality-check ${tone}`}>{icon}</div><div><strong>{label}</strong><span>{detail}</span></div><ChevronRight size={15} /></div> }
function TreeLine({ label, sub, color, open, onClick }: { label: string; sub: string; color: string; open?: boolean; onClick?: () => void }) { return <button className="tree-line" onClick={onClick}><span className="tree-chevron">{onClick ? (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />) : <span />}</span><i className={`tree-dot ${color}`} /><span className="tree-label"><strong>{label}</strong><small>{sub}</small></span>{color === 'green' && <span className="connected"><Check size={12} /> Connected</span>}</button> }
function PlaceholderView({ title }: { title: string }) { return <section className="placeholder"><div className="placeholder-art"><Gauge size={36} /></div><div className="eyebrow">GRID ANALYTICS</div><h1>{title}</h1><p>This workspace is connected to the same Northwind pilot dataset.<br />Switch back to <strong>Dataset</strong> to inspect and validate records.</p><button className="button primary">Open dataset <ArrowRight size={16} /></button></section> }

export default App
