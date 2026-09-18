import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Database,
  Gauge,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './index.css';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type PageKey = 'Overview' | 'Data Entry' | 'Financial Health' | 'Risk Analysis' | 'Cash Flow' | 'Anomalies' | 'AI Recommendations' | 'What-If Simulator' | 'Reports';

type FinancialRecord = {
  id: string;
  date: string;
  revenue: number;
  operatingExpenses: number;
  cashBalance: number;
  receivables: number;
  payables: number;
  loanOutstanding: number;
  emi: number;
  inventoryValue: number;
  employeeCount: number;
  overdueReceivables: number;
  transactionCount: number;
  notes: string;
};

type BusinessProfile = {
  name: string;
  industry: string;
  ownerEmail: string;
};

const STORAGE_KEY = 'vyaparai-data-v1';

const defaultBusiness: BusinessProfile = {
  name: 'My Business',
  industry: 'Retail',
  ownerEmail: '',
};

const demoRecords: FinancialRecord[] = [
  { id: 'demo-1', date: '2026-04-30', revenue: 760000, operatingExpenses: 560000, cashBalance: 520000, receivables: 380000, payables: 210000, loanOutstanding: 260000, emi: 26000, inventoryValue: 340000, employeeCount: 12, overdueReceivables: 70000, transactionCount: 410, notes: 'Demo baseline' },
  { id: 'demo-2', date: '2026-05-31', revenue: 810000, operatingExpenses: 575000, cashBalance: 560000, receivables: 410000, payables: 220000, loanOutstanding: 250000, emi: 26000, inventoryValue: 350000, employeeCount: 12, overdueReceivables: 80000, transactionCount: 430, notes: 'Demo month' },
  { id: 'demo-3', date: '2026-06-30', revenue: 850000, operatingExpenses: 590000, cashBalance: 610000, receivables: 435000, payables: 230000, loanOutstanding: 240000, emi: 26000, inventoryValue: 360000, employeeCount: 12, overdueReceivables: 90000, transactionCount: 452, notes: 'Demo month' },
  { id: 'demo-4', date: '2026-07-31', revenue: 940000, operatingExpenses: 620000, cashBalance: 690000, receivables: 470000, payables: 240000, loanOutstanding: 230000, emi: 26000, inventoryValue: 390000, employeeCount: 13, overdueReceivables: 96000, transactionCount: 490, notes: 'Demo month' },
  { id: 'demo-5', date: '2026-08-31', revenue: 1030000, operatingExpenses: 670000, cashBalance: 740000, receivables: 520000, payables: 270000, loanOutstanding: 220000, emi: 26000, inventoryValue: 410000, employeeCount: 13, overdueReceivables: 110000, transactionCount: 520, notes: 'Demo month' },
  { id: 'demo-6', date: '2026-09-15', revenue: 1180000, operatingExpenses: 820000, cashBalance: 780000, receivables: 560000, payables: 320000, loanOutstanding: 210000, emi: 26000, inventoryValue: 440000, employeeCount: 14, overdueReceivables: 135000, transactionCount: 590, notes: 'Demo current month' },
];

const emptyForm: Omit<FinancialRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10),
  revenue: 0,
  operatingExpenses: 0,
  cashBalance: 0,
  receivables: 0,
  payables: 0,
  loanOutstanding: 0,
  emi: 0,
  inventoryValue: 0,
  employeeCount: 0,
  overdueReceivables: 0,
  transactionCount: 0,
  notes: '',
};

const navItems: { label: PageKey; icon: any }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Data Entry', icon: Database },
  { label: 'Financial Health', icon: Gauge },
  { label: 'Risk Analysis', icon: ShieldAlert },
  { label: 'Cash Flow', icon: LineChartIcon },
  { label: 'Anomalies', icon: AlertTriangle },
  { label: 'AI Recommendations', icon: Sparkles },
  { label: 'What-If Simulator', icon: Zap },
  { label: 'Reports', icon: BarChart3 },
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const compactCurrency = (amount: number) => {
  const a = Math.abs(amount);
  if (a >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (a >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${Math.round(amount)}`;
};

function loadStore(): { business: BusinessProfile; records: FinancialRecord[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall back to demo data
  }
  return { business: defaultBusiness, records: demoRecords };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeHealth(records: FinancialRecord[]) {
  if (!records.length) return 0;
  const current = records[records.length - 1];
  const previous = records.length > 1 ? records[records.length - 2] : undefined;
  const profit = current.revenue - current.operatingExpenses;
  const margin = current.revenue > 0 ? profit / current.revenue : 0;
  const revenueGrowth = previous?.revenue ? (current.revenue - previous.revenue) / previous.revenue : 0;
  const expenseGrowth = previous?.operatingExpenses ? (current.operatingExpenses - previous.operatingExpenses) / previous.operatingExpenses : 0;
  const overdueRatio = current.receivables > 0 ? current.overdueReceivables / current.receivables : 0;
  const debtRatio = current.revenue > 0 ? current.loanOutstanding / current.revenue : 0;
  const liquidity = current.payables > 0 ? current.cashBalance / current.payables : 2;

  const revenueScore = clamp(70 + revenueGrowth * 180, 0, 100);
  const marginScore = clamp(50 + margin * 220, 0, 100);
  const liquidityScore = clamp(liquidity * 35, 0, 100);
  const receivableScore = clamp(100 - overdueRatio * 120, 0, 100);
  const debtScore = clamp(100 - debtRatio * 120, 0, 100);
  const expenseScore = clamp(80 - Math.max(0, expenseGrowth) * 160, 0, 100);

  const score = Math.round(
    revenueScore * 0.18 +
    marginScore * 0.18 +
    liquidityScore * 0.22 +
    receivableScore * 0.14 +
    debtScore * 0.12 +
    expenseScore * 0.16
  );

  return clamp(score, 0, 100);
}

function riskFromHealth(health: number): RiskLevel {
  if (health >= 80) return 'LOW';
  if (health >= 60) return 'MEDIUM';
  if (health >= 40) return 'HIGH';
  return 'CRITICAL';
}

function App() {
  const initial = useMemo(loadStore, []);
  const [business, setBusiness] = useState<BusinessProfile>(initial.business);
  const [records, setRecords] = useState<FinancialRecord[]>(initial.records);
  const [activeNav, setActiveNav] = useState<PageKey>('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FinancialRecord, 'id'>>(emptyForm);
  const [savedMessage, setSavedMessage] = useState('');
  const [search, setSearch] = useState('');
  const [simRevenue, setSimRevenue] = useState(-10);
  const [simExpense, setSimExpense] = useState(-5);
  const [simCollections, setSimCollections] = useState(10);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ business, records }));
  }, [business, records]);

  const sortedRecords = useMemo(() => [...records].sort((a, b) => a.date.localeCompare(b.date)), [records]);
  const current = sortedRecords[sortedRecords.length - 1];
  const previous = sortedRecords[sortedRecords.length - 2];
  const health = useMemo(() => computeHealth(sortedRecords), [sortedRecords]);
  const risk = riskFromHealth(health);
  const profit = current ? current.revenue - current.operatingExpenses : 0;
  const margin = current?.revenue ? (profit / current.revenue) * 100 : 0;
  const cashRunwayMonths = current?.operatingExpenses ? current.cashBalance / current.operatingExpenses : 0;
  const revenueGrowth = previous?.revenue ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
  const expenseGrowth = previous?.operatingExpenses ? ((current.operatingExpenses - previous.operatingExpenses) / previous.operatingExpenses) * 100 : 0;
  const receivableGrowth = previous?.receivables ? ((current.receivables - previous.receivables) / previous.receivables) * 100 : 0;
  const overdueRatio = current?.receivables ? (current.overdueReceivables / current.receivables) * 100 : 0;

  const cashFlowData = sortedRecords.map((r) => ({
    month: new Date(r.date).toLocaleDateString('en-IN', { month: 'short' }),
    inflow: Math.round(r.revenue / 1000),
    outflow: Math.round(r.operatingExpenses / 1000),
    net: Math.round((r.revenue - r.operatingExpenses) / 1000),
  }));

  const revenueTrend = sortedRecords.map((r) => ({
    month: new Date(r.date).toLocaleDateString('en-IN', { month: 'short' }),
    value: Math.round(r.revenue / 1000),
  }));

  const expenseBreakdown = current ? [
    { name: 'Operating', value: current.operatingExpenses },
    { name: 'Receivables', value: current.receivables },
    { name: 'Inventory', value: current.inventoryValue },
    { name: 'Payables', value: current.payables },
  ] : [];

  const recommendations = useMemo(() => {
    const list: { title: string; body: string; tone: 'green' | 'orange' | 'red' }[] = [];
    if (receivableGrowth > 10 || overdueRatio > 20) list.push({ title: 'Accelerate collections', body: `Receivables are ${receivableGrowth.toFixed(1)}% higher than the previous record and ${overdueRatio.toFixed(1)}% are overdue.`, tone: 'orange' });
    if (expenseGrowth > 10) list.push({ title: 'Review expense growth', body: `Operating expenses increased ${expenseGrowth.toFixed(1)}% versus the previous record.`, tone: 'red' });
    if (cashRunwayMonths < 1.5) list.push({ title: 'Protect liquidity', body: `Current cash covers about ${cashRunwayMonths.toFixed(1)} months of the latest operating expense level.`, tone: 'red' });
    if (margin < 10) list.push({ title: 'Protect margin', body: `Current estimated operating margin is ${margin.toFixed(1)}%. Review pricing and variable costs.`, tone: 'orange' });
    if (!list.length) list.push({ title: 'Maintain the current position', body: 'Current indicators are relatively stable. Keep monitoring cash flow, receivables and expenses.', tone: 'green' });
    list.push({ title: 'Run a scenario check', body: 'Use the What-If Simulator before adding major spending or debt.', tone: 'green' });
    return list.slice(0, 4);
  }, [receivableGrowth, overdueRatio, expenseGrowth, cashRunwayMonths, margin]);

  const anomalies = useMemo(() => {
    const result: { title: string; body: string; severity: 'Watch' | 'High' }[] = [];
    if (Math.abs(revenueGrowth) > 15) result.push({ title: 'Revenue change detected', body: `Revenue changed ${revenueGrowth.toFixed(1)}% from the previous record.`, severity: revenueGrowth < 0 ? 'High' : 'Watch' });
    if (expenseGrowth > 15) result.push({ title: 'Expense spike', body: `Operating expenses increased ${expenseGrowth.toFixed(1)}%.`, severity: 'High' });
    if (receivableGrowth > 15) result.push({ title: 'Receivables spike', body: `Receivables increased ${receivableGrowth.toFixed(1)}%.`, severity: 'High' });
    if (!result.length) result.push({ title: 'No major anomaly detected', body: 'Current records do not trigger the prototype anomaly thresholds.', severity: 'Watch' });
    return result;
  }, [revenueGrowth, expenseGrowth, receivableGrowth]);

  const forecast = useMemo(() => {
    const avgNet = sortedRecords.length ? sortedRecords.reduce((sum, r) => sum + (r.revenue - r.operatingExpenses), 0) / sortedRecords.length : 0;
    let cash = current?.cashBalance || 0;
    return [30, 60, 90].map((days) => {
      cash += avgNet * (days === 30 ? 1 : 1);
      return { day: `${days}d`, projected: Math.round(cash / 1000) };
    });
  }, [sortedRecords, current]);

  const simulator = useMemo(() => {
    if (!current) return { health: 0, risk: 'CRITICAL' as RiskLevel, cash: 0, profit: 0 };
    const revenue = current.revenue * (1 + simRevenue / 100);
    const expenses = current.operatingExpenses * (1 + simExpense / 100);
    const collections = current.receivables * (simCollections / 100);
    const simulatedCash = current.cashBalance + Math.max(-current.cashBalance, collections - current.receivables) + (revenue - current.revenue) - (expenses - current.operatingExpenses);
    const simulatedProfit = revenue - expenses;
    let simulatedHealth = health + (simulatedProfit >= profit ? 5 : -5) + (simCollections >= 0 ? Math.min(5, simCollections / 4) : 0);
    if (simulatedCash < current.cashBalance * 0.75) simulatedHealth -= 8;
    return { health: Math.round(clamp(simulatedHealth, 0, 100)), risk: riskFromHealth(clamp(simulatedHealth, 0, 100)), cash: Math.round(simulatedCash), profit: Math.round(simulatedProfit) };
  }, [current, simRevenue, simExpense, simCollections, health, profit]);

  const resetDemo = () => {
    setBusiness(defaultBusiness);
    setRecords(demoRecords);
    setActiveNav('Overview');
    setSavedMessage('Demo data restored');
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const updateField = (key: keyof Omit<FinancialRecord, 'id'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === 'date' || key === 'notes' ? value : Number(value),
    } as Omit<FinancialRecord, 'id'>));
  };

  const submitRecord = (e: FormEvent) => {
    e.preventDefault();
    const clean = { ...form };
    if (!clean.date) return;
    if (editingId) {
      setRecords((prev) => prev.map((r) => r.id === editingId ? { ...r, ...clean } : r));
      setSavedMessage('Financial record updated');
    } else {
      setRecords((prev) => [...prev, { id: crypto.randomUUID(), ...clean }]);
      setSavedMessage('Financial record saved');
    }
    setForm(emptyForm);
    setEditingId(null);
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const editRecord = (record: FinancialRecord) => {
    setForm({ ...record, id: undefined as never });
    setEditingId(record.id);
    setActiveNav('Data Entry');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSavedMessage('Record deleted');
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const visibleRecords = sortedRecords.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.date.includes(q) || r.notes.toLowerCase().includes(q);
  }).slice().reverse();

  const go = (page: PageKey) => {
    setActiveNav(page);
    setMobileOpen(false);
  };

  const renderOverview = () => (
    <>
      <section className="hero-row">
        <div>
          <div className="eyebrow green">BUSINESS OVERVIEW</div>
          <h2>Here’s your financial pulse.</h2>
          <p>Enter your monthly business numbers and VyaparAI will recalculate health, risk, forecasts, anomalies and recommendations.</p>
        </div>
        <div className="hero-actions">
          <button className="secondary-btn" onClick={() => go('Data Entry')}><Plus size={16}/> Add financial data</button>
          <button className="ghost-btn" onClick={resetDemo}>Reset demo</button>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric-card featured">
          <div className="metric-top"><span>FINANCIAL HEALTH</span><div className="tiny-badge positive"><TrendingUp size={12}/> {health >= 80 ? 'Stable' : 'Needs attention'}</div></div>
          <div className="metric-value-row"><strong>{health}</strong><span>/ 100</span></div>
          <div className="health-ring-row"><div className="mini-ring" style={{ ['--progress' as any]: `${health * 3.6}deg` }}><div>{health}%</div></div><div><strong>{risk === 'LOW' ? 'Healthy position' : `${risk} risk`}</strong><small>Calculated from your latest financial record</small></div></div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span>CASH BALANCE</span><CircleDollarSign size={16} className="metric-icon green-icon"/></div>
          <div className="metric-value">{currency(current?.cashBalance || 0)}</div>
          <div className="metric-foot"><span className={revenueGrowth >= 0 ? 'positive-text' : 'negative-text'}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</span> revenue change vs previous</div>
          <div className="sparkline green-line"><span style={{height:'36%'}}/><span style={{height:'45%'}}/><span style={{height:'49%'}}/><span style={{height:'60%'}}/><span style={{height:'58%'}}/><span style={{height:'74%'}}/><span style={{height:'89%'}}/></div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span>RISK STATUS</span><ShieldAlert size={16} className="metric-icon"/></div>
          <div className="risk-row"><div className={`risk-pill ${risk.toLowerCase()}`}><span/>{risk}</div></div>
          <div className="metric-foot">Health score based prototype risk bands</div>
          <div className="risk-meter"><span className="low"/><span className="medium"/><span className="high"/><span className="critical"/><i style={{left:`${clamp(100-health, 5, 95)}%`}}/></div>
        </div>

        <div className="metric-card">
          <div className="metric-top"><span>NET PROFIT</span><WalletCards size={16} className="metric-icon green-icon"/></div>
          <div className="metric-value">{currency(profit)}</div>
          <div className="metric-foot"><span className={margin >= 10 ? 'positive-text' : 'negative-text'}>{margin.toFixed(1)}%</span> estimated operating margin</div>
          <div className="sparkline blue-line"><span style={{height:'48%'}}/><span style={{height:'54%'}}/><span style={{height:'67%'}}/><span style={{height:'61%'}}/><span style={{height:'73%'}}/><span style={{height:'78%'}}/><span style={{height:'86%'}}/></div>
        </div>
      </section>

      <section className="chart-grid two-thirds">
        <div className="panel large-panel">
          <div className="panel-header"><div><h3>Revenue trend</h3><p>Saved records over time</p></div><button className="ghost-btn">Live data <Activity size={13}/></button></div>
          <div className="chart-stat"><strong>{currency(current?.revenue || 0)}</strong><span className={revenueGrowth >= 0 ? 'positive-text' : 'negative-text'}><TrendingUp size={14}/> {revenueGrowth.toFixed(1)}% vs previous</span></div>
          <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueTrend} margin={{top:10,right:10,left:-18,bottom:0}}><CartesianGrid stroke="#edf3ef" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:11}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:11}} tickFormatter={(v)=>`₹${v}k`}/><Tooltip formatter={(value:number)=>[currency(value*1000),'Revenue']}/><Bar dataKey="value" radius={[7,7,2,2]} fill="#0d8b62"/></BarChart></ResponsiveContainer></div>
        </div>
        <div className="panel">
          <div className="panel-header"><div><h3>Cash flow</h3><p>Revenue minus operating expenses</p></div></div>
          <div className="chart-area compact"><ResponsiveContainer width="100%" height="100%"><AreaChart data={cashFlowData} margin={{top:15,right:5,left:-18,bottom:0}}><defs><linearGradient id="cashGradient2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d8b62" stopOpacity={0.22}/><stop offset="100%" stopColor="#0d8b62" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#edf3ef" vertical={false}/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:10}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:9}} tickFormatter={(v)=>`${v}k`}/><Tooltip formatter={(value:number)=>[`₹${value}k`,'Net cash']}/><Area type="monotone" dataKey="net" stroke="#0d8b62" strokeWidth={2.4} fill="url(#cashGradient2)"/></AreaChart></ResponsiveContainer></div>
          <div className="chart-legend"><span><i className="dot green"/> Net cash</span><span>{cashFlowData.length} records saved</span></div>
        </div>
      </section>

      <section className="chart-grid three-col">
        <div className="panel"><div className="panel-header"><div><h3>Potential risks</h3><p>Signals needing attention</p></div></div>
          <div className="risk-list">
            <div className="risk-item"><div className="risk-icon warning"><TrendingDown size={15}/></div><div><strong>Receivables</strong><small>{receivableGrowth.toFixed(1)}% vs previous</small></div><span className={`risk-score ${receivableGrowth>10?'orange':''}`}>{Math.round(clamp(100-overdueRatio, 10, 98))}</span></div>
            <div className="risk-item"><div className="risk-icon green"><Activity size={15}/></div><div><strong>Cash runway</strong><small>{cashRunwayMonths.toFixed(1)} months</small></div><span className="risk-score">{Math.round(clamp(cashRunwayMonths*35,10,99))}</span></div>
            <div className="risk-item"><div className="risk-icon blue"><ShieldAlert size={15}/></div><div><strong>Debt burden</strong><small>{current?.revenue ? ((current.loanOutstanding/current.revenue)*100).toFixed(1) : '0'}% of revenue</small></div><span className="risk-score blue-score">{Math.round(clamp(100-(current?.revenue ? current.loanOutstanding/current.revenue*100 : 0)*2,15,95))}</span></div>
          </div>
        </div>

        <div className="panel"><div className="panel-header"><div><h3>Financial mix</h3><p>Latest record snapshot</p></div></div>
          <div className="donut-wrap"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseBreakdown} dataKey="value" innerRadius={48} outerRadius={68} paddingAngle={2}>{expenseBreakdown.map((_,i)=><Cell key={i} fill={['#0d8b62','#43aa7f','#f4ad28','#4f8df7'][i]}/>)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>{compactCurrency(current?.operatingExpenses || 0)}</strong><small>Operating</small></div></div><div className="legend-list">{expenseBreakdown.map((item,i)=><div key={item.name}><span><i style={{background:['#0d8b62','#43aa7f','#f4ad28','#4f8df7'][i]}}/>{item.name}</span><strong>{compactCurrency(item.value)}</strong></div>)}</div></div>
        </div>

        <div className="panel"><div className="panel-header"><div><h3>AI recommendations</h3><p>Based on saved records</p></div><div className="ai-chip"><Bot size={14}/> AI</div></div>
          <div className="recommendations">{recommendations.slice(0,3).map((r,i)=><div className="recommendation" key={i}><div className={`rec-icon ${r.tone==='green'?'green-bg':r.tone==='red'?'red-bg':''}`}><Sparkles size={15}/></div><div><strong>{r.title}</strong><small>{r.body}</small></div></div>)}</div>
        </div>
      </section>

      <section className="simulator-banner"><div className="simulator-copy"><div className="sim-icon"><Zap size={18}/></div><div><span className="eyebrow green">WHAT-IF SIMULATOR</span><h3>Test decisions before acting on them.</h3><p>Adjust revenue, expenses and collections and instantly see the estimated effect on health, risk and cash.</p></div></div><div className="simulator-results"><div><small>Health</small><strong>{simulator.health}</strong><span className="positive-text">/100</span></div><div><small>Risk</small><strong className="risk-text">{simulator.risk}</strong></div><div><small>Simulated cash</small><strong>{currency(simulator.cash)}</strong></div><button className="primary-btn" onClick={()=>go('What-If Simulator')}>Open simulator <Zap size={15}/></button></div></section>

      <div className="bottom-note"><Database size={13}/> Data is stored locally in this browser. Demo records are synthetic and can be replaced with your own entries.</div>
    </>
  );

  const renderDataEntry = () => (
    <>
      <section className="hero-row"><div><div className="eyebrow green">DATA INPUT</div><h2>Feed VyaparAI your real business numbers.</h2><p>Save one record per date or month. Every saved record updates the dashboard automatically.</p></div><div className="hero-actions"><button className="secondary-btn" onClick={()=>{setEditingId(null);setForm(emptyForm);setShowForm(true)}}><Plus size={16}/> New record</button><button className="ghost-btn" onClick={resetDemo}>Restore demo</button></div></section>

      <section className="entry-layout">
        <div className="panel form-panel">
          <div className="panel-header"><div><h3>{editingId ? 'Edit financial record' : 'Add financial record'}</h3><p>Use the latest monthly figures available to you.</p></div><div className="ai-chip"><Database size={14}/> Live calculation</div></div>
          <form onSubmit={submitRecord}>
            <div className="form-grid">
              <label>Date<input type="date" value={form.date} onChange={e=>updateField('date',e.target.value)} required/></label>
              <label>Business revenue (₹)<input type="number" min="0" step="1" value={form.revenue || ''} onChange={e=>updateField('revenue',e.target.value)} placeholder="e.g. 850000" required/></label>
              <label>Operating expenses (₹)<input type="number" min="0" step="1" value={form.operatingExpenses || ''} onChange={e=>updateField('operatingExpenses',e.target.value)} placeholder="e.g. 590000" required/></label>
              <label>Cash balance (₹)<input type="number" min="0" step="1" value={form.cashBalance || ''} onChange={e=>updateField('cashBalance',e.target.value)} placeholder="e.g. 600000" required/></label>
              <label>Accounts receivable (₹)<input type="number" min="0" step="1" value={form.receivables || ''} onChange={e=>updateField('receivables',e.target.value)} /></label>
              <label>Accounts payable (₹)<input type="number" min="0" step="1" value={form.payables || ''} onChange={e=>updateField('payables',e.target.value)} /></label>
              <label>Loan outstanding (₹)<input type="number" min="0" step="1" value={form.loanOutstanding || ''} onChange={e=>updateField('loanOutstanding',e.target.value)} /></label>
              <label>Monthly EMI (₹)<input type="number" min="0" step="1" value={form.emi || ''} onChange={e=>updateField('emi',e.target.value)} /></label>
              <label>Inventory value (₹)<input type="number" min="0" step="1" value={form.inventoryValue || ''} onChange={e=>updateField('inventoryValue',e.target.value)} /></label>
              <label>Employees<input type="number" min="0" step="1" value={form.employeeCount || ''} onChange={e=>updateField('employeeCount',e.target.value)} /></label>
              <label>Overdue receivables (₹)<input type="number" min="0" step="1" value={form.overdueReceivables || ''} onChange={e=>updateField('overdueReceivables',e.target.value)} /></label>
              <label>Transactions<input type="number" min="0" step="1" value={form.transactionCount || ''} onChange={e=>updateField('transactionCount',e.target.value)} /></label>
              <label className="full">Notes<textarea value={form.notes} onChange={e=>updateField('notes',e.target.value)} placeholder="Optional context: seasonality, one-time expense, delayed customer payment, etc."/></label>
            </div>
            <div className="form-actions"><button type="submit" className="primary-btn"><Save size={16}/>{editingId?'Update record':'Save record'}</button><button type="button" className="ghost-btn" onClick={()=>{setForm(emptyForm);setEditingId(null)}}>Clear</button></div>
          </form>
        </div>

        <div className="panel profile-panel">
          <div className="panel-header"><div><h3>Business profile</h3><p>Saved locally with your records</p></div></div>
          <div className="form-grid single"><label>Business name<input value={business.name} onChange={e=>setBusiness(v=>({...v,name:e.target.value}))}/></label><label>Industry<select value={business.industry} onChange={e=>setBusiness(v=>({...v,industry:e.target.value}))}><option>Retail</option><option>Wholesale</option><option>Manufacturing</option><option>Services</option><option>Food & Beverage</option><option>Other MSME</option></select></label><label>Owner email (optional)<input type="email" value={business.ownerEmail} onChange={e=>setBusiness(v=>({...v,ownerEmail:e.target.value}))}/></label></div>
          <div className="info-box"><ShieldAlert size={16}/><div><strong>Prototype note</strong><p>These values stay in your browser using localStorage. They are not sent to a server in this version.</p></div></div>
          <div className="quick-metrics"><div><span>Records</span><strong>{records.length}</strong></div><div><span>Latest revenue</span><strong>{compactCurrency(current?.revenue || 0)}</strong></div><div><span>Latest health</span><strong>{health}/100</strong></div></div>
        </div>
      </section>

      <section className="panel records-panel"><div className="panel-header"><div><h3>Saved financial records</h3><p>Click edit to change a row or delete incorrect data.</p></div><div className="search-box small"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes/date"/></div></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Revenue</th><th>Expenses</th><th>Cash</th><th>AR</th><th>Debt</th><th>Actions</th></tr></thead><tbody>{visibleRecords.map(r=><tr key={r.id}><td>{r.date}</td><td>{currency(r.revenue)}</td><td>{currency(r.operatingExpenses)}</td><td>{currency(r.cashBalance)}</td><td>{currency(r.receivables)}</td><td>{currency(r.loanOutstanding)}</td><td><button className="table-btn" onClick={()=>editRecord(r)}>Edit</button><button className="table-btn danger" onClick={()=>deleteRecord(r.id)}>Delete</button></td></tr>)}{!visibleRecords.length && <tr><td colSpan={7} className="empty-row">No records found.</td></tr>}</tbody></table></div></section>
    </>
  );

  const renderHealth = () => (
    <section className="page-grid-single">
      <div className="panel health-summary"><div><div className="health-large">{health}</div><span>/ 100</span></div><div><h3>Financial Health</h3><p>The score is calculated from revenue trend, profitability, liquidity, receivables, debt and expense growth.</p><div className="health-pill">{risk}</div></div></div>
      <div className="driver-grid">
        {[
          ['Revenue trend', clamp(70 + revenueGrowth*1.8,0,100)],
          ['Profitability', clamp(50 + margin*2.2,0,100)],
          ['Liquidity', clamp((current?.cashBalance || 0) / Math.max(1,current?.payables || 1)*35,0,100)],
          ['Receivables', clamp(100-overdueRatio*1.2,0,100)],
          ['Debt', clamp(100-((current?.loanOutstanding||0)/Math.max(1,current?.revenue||1))*120,0,100)],
          ['Expense control', clamp(80-Math.max(0,expenseGrowth)*1.6,0,100)],
        ].map(([label,value])=><div className="driver-card" key={label as string}><div className="driver-label"><span>{label as string}</span><strong>{Math.round(value as number)}</strong></div><div className="driver-track"><span style={{width:`${value}%`}}/></div></div>)}
      </div>
      <div className="panel"><div className="panel-header"><div><h3>How to improve the score</h3><p>Focus on the strongest negative drivers first.</p></div></div>{recommendations.map((r,i)=><div className="recommendation wide" key={i}><div className="rec-icon"><Sparkles size={15}/></div><div><strong>{r.title}</strong><small>{r.body}</small></div></div>)}</div>
    </section>
  );

  const renderRisk = () => (
    <section className="page-grid-two">
      <div className="panel"><div className="panel-header"><div><h3>Current risk</h3><p>Prototype risk bands derived from current health and financial signals.</p></div></div><div className={`big-risk ${risk.toLowerCase()}`}>{risk}</div><div className="risk-reason-list"><div><strong>Revenue trend</strong><span>{revenueGrowth.toFixed(1)}%</span></div><div><strong>Expense growth</strong><span>{expenseGrowth.toFixed(1)}%</span></div><div><strong>Overdue receivables</strong><span>{overdueRatio.toFixed(1)}%</span></div><div><strong>Debt / revenue</strong><span>{((current?.loanOutstanding || 0)/(current?.revenue || 1)*100).toFixed(1)}%</span></div></div></div>
      <div className="panel"><div className="panel-header"><div><h3>Risk signals</h3><p>Concrete reasons driving the current status.</p></div></div>{anomalies.map((a,i)=><div className="alert-card" key={i}><AlertTriangle size={17}/><div><strong>{a.title}</strong><small>{a.body}</small></div><span>{a.severity}</span></div>)}</div>
    </section>
  );

  const renderCashFlow = () => (
    <section className="page-grid-single"><div className="panel"><div className="panel-header"><div><h3>Cash-flow history</h3><p>Revenue minus operating expenses</p></div></div><div className="chart-area tall"><ResponsiveContainer width="100%" height="100%"><LineChart data={cashFlowData}><CartesianGrid stroke="#edf3ef" vertical={false}/><XAxis dataKey="month"/><YAxis/><Tooltip/><Line type="monotone" dataKey="inflow" stroke="#0d8b62" strokeWidth={3}/><Line type="monotone" dataKey="outflow" stroke="#ef7a60" strokeWidth={2.5}/><Line type="monotone" dataKey="net" stroke="#4f8df7" strokeWidth={2.5}/></LineChart></ResponsiveContainer></div></div><div className="panel"><div className="panel-header"><div><h3>30 / 60 / 90-day forecast</h3><p>Illustrative forecast using average saved net cash flow.</p></div><div className="forecast-tag"><Activity size={14}/> Forecast</div></div><div className="forecast-cards">{forecast.map(f=><div key={f.day}><span>{f.day}</span><strong>{compactCurrency(f.projected*1000)}</strong><small>Projected cash</small></div>)}</div></div></section>
  );

  const renderAnomalies = () => (
    <section className="page-grid-single"><div className="panel"><div className="panel-header"><div><h3>Detected anomalies</h3><p>Prototype thresholds based on changes between saved records.</p></div></div>{anomalies.map((a,i)=><div className="alert-card" key={i}><div className={`severity-dot ${a.severity==='High'?'red':'orange'}`}/><div><strong>{a.title}</strong><small>{a.body}</small></div><span>{a.severity}</span></div>)}</div><div className="panel info-panel"><Upload size={18}/><div><h3>More powerful anomaly detection</h3><p>Once your backend is connected, this section can use Isolation Forest on transaction-level data to identify unusual payments, expense spikes and cash withdrawals.</p></div></div></section>
  );

  const renderRecommendations = () => (
    <section className="page-grid-single"><div className="panel"><div className="panel-header"><div><h3>AI recommendations</h3><p>Rules-based prototype recommendations calculated from your current records.</p></div><div className="ai-chip"><Bot size={14}/> AI</div></div>{recommendations.map((r,i)=><div className="recommendation wide" key={i}><div className={`rec-icon ${r.tone==='green'?'green-bg':r.tone==='red'?'red-bg':''}`}><Sparkles size={15}/></div><div><strong>{r.title}</strong><small>{r.body}</small></div><span className={`recommendation-tag ${r.tone}`}>{r.tone}</span></div>)}</div><div className="bottom-note"><ShieldAlert size={13}/> Recommendations are decision-support suggestions, not professional financial advice.</div></section>
  );

  const renderSimulator = () => (
    <section className="page-grid-two"><div className="panel"><div className="panel-header"><div><h3>Scenario controls</h3><p>Move the sliders and see estimated changes instantly.</p></div></div>
      <div className="slider-row"><label>Revenue change <strong>{simRevenue}%</strong></label><input type="range" min="-50" max="50" step="1" value={simRevenue} onChange={e=>setSimRevenue(Number(e.target.value))}/></div>
      <div className="slider-row"><label>Expense change <strong>{simExpense}%</strong></label><input type="range" min="-50" max="50" step="1" value={simExpense} onChange={e=>setSimExpense(Number(e.target.value))}/></div>
      <div className="slider-row"><label>Collection improvement <strong>{simCollections}%</strong></label><input type="range" min="0" max="40" step="1" value={simCollections} onChange={e=>setSimCollections(Number(e.target.value))}/></div>
      <div className="scenario-box"><strong>Scenario</strong><span>Revenue {simRevenue >= 0 ? '+' : ''}{simRevenue}% · Expenses {simExpense >= 0 ? '+' : ''}{simExpense}% · Collections +{simCollections}%</span></div>
    </div><div className="panel"><div className="panel-header"><div><h3>Simulated outcome</h3><p>Illustrative estimate from the current saved record.</p></div></div><div className="sim-result-grid"><div><span>Health</span><strong>{simulator.health}/100</strong></div><div><span>Risk</span><strong className="risk-text">{simulator.risk}</strong></div><div><span>Cash</span><strong>{currency(simulator.cash)}</strong></div><div><span>Profit</span><strong>{currency(simulator.profit)}</strong></div></div><div className="compare-row"><div><span>Current health</span><strong>{health}</strong></div><div className="arrow">→</div><div><span>Simulated health</span><strong>{simulator.health}</strong></div></div></div></section>
  );

  const renderReports = () => (
    <section className="page-grid-single"><div className="panel"><div className="panel-header"><div><h3>Reports</h3><p>Quick snapshot based on your saved data.</p></div><button className="primary-btn" onClick={()=>window.print()}><Upload size={15}/> Print / Save PDF</button></div><div className="report-grid"><div><span>Business</span><strong>{business.name}</strong></div><div><span>Health</span><strong>{health}/100</strong></div><div><span>Risk</span><strong>{risk}</strong></div><div><span>Revenue</span><strong>{currency(current?.revenue || 0)}</strong></div><div><span>Profit</span><strong>{currency(profit)}</strong></div><div><span>Cash</span><strong>{currency(current?.cashBalance || 0)}</strong></div><div><span>Receivables</span><strong>{currency(current?.receivables || 0)}</strong></div><div><span>Debt</span><strong>{currency(current?.loanOutstanding || 0)}</strong></div></div></div><div className="panel"><div className="panel-header"><div><h3>Notes</h3><p>Prototype report limitations</p></div></div><p className="report-note">This prototype stores data locally and uses illustrative calculation rules. For production use, connect a secure backend/database and validate the models on appropriate real-world data.</p></div></section>
  );

  const page = activeNav === 'Overview' ? renderOverview()
    : activeNav === 'Data Entry' ? renderDataEntry()
    : activeNav === 'Financial Health' ? renderHealth()
    : activeNav === 'Risk Analysis' ? renderRisk()
    : activeNav === 'Cash Flow' ? renderCashFlow()
    : activeNav === 'Anomalies' ? renderAnomalies()
    : activeNav === 'AI Recommendations' ? renderRecommendations()
    : activeNav === 'What-If Simulator' ? renderSimulator()
    : renderReports();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-visible' : ''}`}>
        <div className="brand-row"><div className="brand-mark"><span>V</span></div>{sidebarOpen && <div><div className="brand-name">Vyapar<span>AI</span></div><div className="brand-sub">Financial Intelligence</div></div>}{mobileOpen && <button className="icon-btn mobile-close" onClick={()=>setMobileOpen(false)}><X size={18}/></button>}</div>
        <div className="workspace-card"><div className="workspace-icon"><CircleDollarSign size={16}/></div>{sidebarOpen && <div className="workspace-copy"><span className="eyebrow">BUSINESS</span><strong>{business.name}</strong><small>{business.industry}</small></div>}</div>
        <nav className="nav-list">{navItems.map(({label,icon:Icon})=><button key={label} className={`nav-item ${activeNav===label?'active':''}`} onClick={()=>go(label)} title={label}><Icon size={18}/>{sidebarOpen && <span>{label}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><button className="nav-item"><Settings size={18}/>{sidebarOpen&&<span>Settings</span>}</button><div className="trust-chip"><ShieldAlert size={15}/>{sidebarOpen&&<span>Local secure workspace</span>}</div></div>
      </aside>
      {mobileOpen && <button className="mobile-backdrop" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
      <main className="main-shell">
        <header className="topbar"><div className="topbar-left"><button className="mobile-menu-btn" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><button className="collapse-btn" onClick={()=>setSidebarOpen(v=>!v)}>{sidebarOpen?<PanelLeftClose size={18}/>:<PanelLeftOpen size={18}/>}</button><div className="page-title-wrap"><div className="page-kicker">VYAPARAI WORKSPACE</div><h1>{activeNav}</h1></div></div><div className="topbar-actions"><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search saved data..."/><kbd>⌘ K</kbd></div><div className="period-pill"><CalendarDays size={15}/> {current?.date || 'No data'} <ChevronDown size={14}/></div><button className="icon-btn"><Bell size={17}/></button><div className="avatar">A</div></div></header>
        <div className="content">{page}</div>
      </main>
      {savedMessage && <div className="toast"><Save size={15}/>{savedMessage}</div>}
      <div className="apex-footer">TEAM APEX • VYAPARAI</div>
    </div>
  );
}

export default App;
