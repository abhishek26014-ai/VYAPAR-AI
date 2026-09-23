import './App.css';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, BarChart3, Bell, Bot, CalendarDays, ChevronDown,
  CircleDollarSign, Database, Gauge, LayoutDashboard, LineChart as LineChartIcon,
  Menu, PanelLeftClose, PanelLeftOpen, Plus, Save, Search, Settings, ShieldAlert,
  Sparkles, TrendingDown, TrendingUp, Upload, WalletCards, X, Zap, CheckCircle2,
  AlertCircle, SlidersHorizontal, FileWarning
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie,
  PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from 'recharts';
// @ts-expect-error CSS side-effect imports are intentionally resolved at build time.
import './index.css';
import { authApi, businessApi, recordsApi, type BusinessResponse, type FinancialRecordPayload, type FinancialRecordResponse } from './api/client';

type FinancialRecord = {
  id: number; date: string; revenue: number; operatingExpenses: number; cashBalance: number;
  receivables: number; payables: number; loanOutstanding: number; emi: number; inventoryValue: number;
  employeeCount: number; overdueReceivables: number; transactionCount: number; notes: string;
};

type BusinessProfile = { name: string; industry: string; ownerEmail: string; };

type PageKey = 'Overview' | 'Data Entry' | 'Financial Health' | 'Risk Analysis' | 'Cash Flow' | 'Anomalies' | 'AI Recommendations' | 'What-If Simulator' | 'Reports';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const defaultBusiness: BusinessProfile = { name: '', industry: '', ownerEmail: '' };
const emptyForm: Omit<FinancialRecord, 'id'> = {
  date: new Date().toISOString().slice(0, 10), revenue: 0, operatingExpenses: 0, cashBalance: 0,
  receivables: 0, payables: 0, loanOutstanding: 0, emi: 0, inventoryValue: 0, employeeCount: 0,
  overdueReceivables: 0, transactionCount: 0, notes: '',
};

const navItems: { label: PageKey; icon: any }[] = [
  { label: 'Overview', icon: LayoutDashboard }, { label: 'Data Entry', icon: Database },
  { label: 'Financial Health', icon: Gauge }, { label: 'Risk Analysis', icon: ShieldAlert },
  { label: 'Cash Flow', icon: LineChartIcon }, { label: 'Anomalies', icon: AlertTriangle },
  { label: 'AI Recommendations', icon: Sparkles }, { label: 'What-If Simulator', icon: Zap },
  { label: 'Reports', icon: BarChart3 },
];

const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
const compactCurrency = (amount: number) => {
  const a = Math.abs(amount);
  if (a >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (a >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${Math.round(amount)}`;
};

function recordFromApi(record: FinancialRecordResponse): FinancialRecord {
  return {
    id: record.id, date: record.month, revenue: record.revenue, operatingExpenses: record.expenses,
    cashBalance: record.cash_balance, receivables: record.receivables, payables: record.payables,
    loanOutstanding: record.debt, emi: record.payroll, inventoryValue: record.inventory,
    employeeCount: 0, overdueReceivables: 0, transactionCount: 0, notes: '',
  };
}

function recordToApi(record: Omit<FinancialRecord, 'id'>): FinancialRecordPayload {
  return {
    month: record.date, revenue: record.revenue, expenses: record.operatingExpenses,
    cash_balance: record.cashBalance, receivables: record.receivables, payables: record.payables,
    debt: record.loanOutstanding, inventory: record.inventoryValue, payroll: record.emi,
    operating_expenses: record.operatingExpenses, other_income: 0, other_expenses: 0,
  };
}

function businessFromApi(business: BusinessResponse, ownerEmail: string): BusinessProfile {
  return { name: business.name, industry: business.industry || business.business_type, ownerEmail };
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

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

  const score = Math.round(revenueScore * 0.18 + marginScore * 0.18 + liquidityScore * 0.22 + receivableScore * 0.14 + debtScore * 0.12 + expenseScore * 0.16);
  return clamp(score, 0, 100);
}

function riskFromHealth(health: number): RiskLevel {
  if (health >= 80) return 'LOW';
  if (health >= 60) return 'MEDIUM';
  if (health >= 40) return 'HIGH';
  return 'CRITICAL';
}

function Workspace() {
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeNav, setActiveNav] = useState<PageKey>('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<FinancialRecord, 'id'>>(emptyForm);
  const [savedMessage, setSavedMessage] = useState('');
  const [search, setSearch] = useState('');
  const [simRevenue, setSimRevenue] = useState(-10);
  const [simExpense, setSimExpense] = useState(-5);
  const [simCollections, setSimCollections] = useState(10);

  useEffect(() => {
    let active = true;
    Promise.all([authApi.me(), recordsApi.list()])
      .then(([session, serverRecords]) => {
        if (!active) return;
        setBusiness(businessFromApi(session.business, session.user.email));
        setRecords(serverRecords.map(recordFromApi));
        setDataLoaded(true);
      })
      .catch((requestError) => {
        if (active) setSavedMessage(requestError instanceof Error ? requestError.message : 'Unable to load workspace data');
      });
    return () => { active = false; };
  }, []);

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
    inflow: Math.round(r.revenue / 1000), outflow: Math.round(r.operatingExpenses / 1000), net: Math.round((r.revenue - r.operatingExpenses) / 1000),
  }));

  const revenueTrend = sortedRecords.map((r) => ({ month: new Date(r.date).toLocaleDateString('en-IN', { month: 'short' }), value: Math.round(r.revenue / 1000) }));
  const expenseBreakdown = current ? [{ name: 'Operating', value: current.operatingExpenses }, { name: 'Receivables', value: current.receivables }, { name: 'Inventory', value: current.inventoryValue }, { name: 'Payables', value: current.payables }] : [];

  const recommendations = useMemo(() => {
    const list: { title: string; body: string; tone: 'green' | 'orange' | 'red' }[] = [];
    if (receivableGrowth > 10 || overdueRatio > 20) list.push({ title: 'Accelerate collections', body: `Receivables are ${receivableGrowth.toFixed(1)}% higher than the previous record.`, tone: 'orange' });
    if (expenseGrowth > 10) list.push({ title: 'Review expense growth', body: `Operating expenses increased ${expenseGrowth.toFixed(1)}%.`, tone: 'red' });
    if (!list.length) list.push({ title: 'Maintain the current position', body: 'Current indicators are relatively stable.', tone: 'green' });
    return list.slice(0, 4);
  }, [receivableGrowth, overdueRatio, expenseGrowth]);

  const anomalies = useMemo(() => {
    const result: { title: string; body: string; severity: 'Watch' | 'High' }[] = [];
    if (Math.abs(revenueGrowth) > 15) result.push({ title: 'Revenue change detected', body: `Revenue changed ${revenueGrowth.toFixed(1)}%`, severity: revenueGrowth < 0 ? 'High' : 'Watch' });
    if (!result.length) result.push({ title: 'No major anomaly detected', body: 'Current records are stable.', severity: 'Watch' });
    return result;
  }, [revenueGrowth]);

  const forecast = useMemo(() => {
    const avgNet = sortedRecords.length ? sortedRecords.reduce((sum, r) => sum + (r.revenue - r.operatingExpenses), 0) / sortedRecords.length : 0;
    let cash = current?.cashBalance || 0;
    return [30, 60, 90].map((days) => { cash += avgNet; return { day: `${days}d`, projected: Math.round(cash / 1000) }; });
  }, [sortedRecords, current]);

  const simulator = useMemo(() => {
    if (!current) return { health: 0, risk: 'CRITICAL' as RiskLevel, cash: 0, profit: 0 };
    const revenue = current.revenue * (1 + simRevenue / 100);
    const expenses = current.operatingExpenses * (1 + simExpense / 100);
    const collections = current.receivables * (simCollections / 100);
    const simulatedCash = current.cashBalance + Math.max(-current.cashBalance, collections - current.receivables) + (revenue - current.revenue) - (expenses - current.operatingExpenses);
    const simulatedProfit = revenue - expenses;
    return { health: health, risk: riskFromHealth(health), cash: Math.round(simulatedCash), profit: Math.round(simulatedProfit) };
  }, [current, simRevenue, simExpense, simCollections, health]);

  const updateField = (key: keyof Omit<FinancialRecord, 'id'>, value: string) => setForm(prev => ({ ...prev, [key]: key === 'date' || key === 'notes' ? value : Number(value) }));

  const submitRecord = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date) return;
    try {
      const saved = editingId ? await recordsApi.update(editingId, recordToApi(form)) : await recordsApi.create(recordToApi(form));
      setRecords(prev => editingId ? prev.map(r => r.id === editingId ? recordFromApi(saved) : r) : [...prev, recordFromApi(saved)]);
      setForm(emptyForm); setEditingId(null);
    } catch (requestError) { setSavedMessage('Error saving record'); }
  };

  const go = (page: PageKey) => { setActiveNav(page); setMobileOpen(false); };

  if (!dataLoaded) return <div className="h-screen flex items-center justify-center bg-slate-900 text-emerald-400">Initializing VyaparAI...</div>;

  return (
    <div className="h-screen w-full flex bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      
      {/* PREMIUM SIDEBAR */}
      <aside className={`w-72 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shadow-2xl z-20 shrink-0 ${mobileOpen ? 'absolute' : 'hidden md:flex'}`}>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20"><Activity className="h-6 w-6 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-none">Vyapar<span className="text-emerald-400">AI</span></h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Intelligence Platform</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon; const isActive = activeNav === item.label;
              return (
                <button key={item.label} onClick={() => go(item.label)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 ${isActive ? "bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium"}`}>
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-500"} /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-6 bg-slate-950/50 border-t border-slate-800/50">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <p className="font-bold uppercase tracking-wider text-[10px] text-emerald-500">Connected Workspace</p>
            <p className="mt-1 font-bold text-white text-sm truncate">{business.name}</p>
          </div>
          <button onClick={async () => { await authApi.logout(); localStorage.removeItem('vyaparai-token'); window.location.reload(); }} className="w-full mt-4 text-xs font-semibold text-slate-400 hover:text-white">Logout</button>
          <div className="mt-6 text-center"><p className="text-[10px] font-bold tracking-widest text-slate-600">TEAM APEX • VYAPARAI</p></div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto p-8 lg:p-10 custom-scrollbar relative">
        <div className="flex justify-between items-end mb-10 pb-6 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-3 mb-2 md:hidden">
              <button onClick={() => setMobileOpen(!mobileOpen)}><Menu size={24} /></button>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 capitalize tracking-tight">{activeNav}</h2>
          </div>
        </div>

        {activeNav === 'Overview' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg text-white">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">Health Score</div>
                <div className="mt-3 text-4xl font-extrabold">{health}<span className="text-lg font-medium text-emerald-200">/100</span></div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Distress Risk</div><div className="mt-3 text-3xl font-extrabold text-slate-800">{risk}</div></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Cash Balance</div><div className="mt-3 text-3xl font-extrabold text-slate-800">{currency(current?.cashBalance || 0)}</div></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit</div><div className="mt-3 text-3xl font-extrabold text-slate-800">{currency(profit)}</div></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><TrendingUp className="h-5 w-5 text-emerald-500" /> Revenue Trend</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueTrend} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(v) => `₹${v}k`} tick={{ fontSize: 12 }} /><RechartsTooltip /><Bar dataKey="value" radius={[7, 7, 2, 2]} fill="#10b981" /></BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><LineChartIcon className="h-5 w-5 text-blue-500" /> Cash Flow</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlowData} margin={{ top: 15, right: 5, left: -18, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(v) => `${v}k`} tick={{ fontSize: 12 }} /><RechartsTooltip /><Area type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} fill="#eff6ff" /></AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'Data Entry' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-6">Add Financial Record</h3>
            <form onSubmit={submitRecord} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col text-sm font-semibold">Date<input type="date" value={form.date} onChange={e => updateField('date', e.target.value)} required className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <label className="flex flex-col text-sm font-semibold">Revenue (₹)<input type="number" value={form.revenue} onChange={e => updateField('revenue', e.target.value)} className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <label className="flex flex-col text-sm font-semibold">Operating Expenses (₹)<input type="number" value={form.operatingExpenses} onChange={e => updateField('operatingExpenses', e.target.value)} className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <label className="flex flex-col text-sm font-semibold">Cash Balance (₹)<input type="number" value={form.cashBalance} onChange={e => updateField('cashBalance', e.target.value)} className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <label className="flex flex-col text-sm font-semibold">Accounts Receivable (₹)<input type="number" value={form.receivables} onChange={e => updateField('receivables', e.target.value)} className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <label className="flex flex-col text-sm font-semibold">Loan Outstanding (₹)<input type="number" value={form.loanOutstanding} onChange={e => updateField('loanOutstanding', e.target.value)} className="mt-1 p-2 border rounded-lg bg-slate-50"/></label>
              <button type="submit" className="md:col-span-2 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition">Save Record</button>
            </form>
          </div>
        )}

        {['Financial Health', 'Risk Analysis', 'Cash Flow', 'Anomalies', 'AI Recommendations', 'What-If Simulator', 'Reports'].includes(activeNav) && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/60 shadow-sm text-center max-w-4xl mx-auto">
             <div className="inline-flex bg-emerald-100 p-4 rounded-full mb-4"><Sparkles className="h-8 w-8 text-emerald-600" /></div>
             <h3 className="text-xl font-bold text-slate-800">Advanced Analytics Hub</h3>
             <p className="text-slate-500 mt-2 max-w-md mx-auto">Dashboard metrics and charts automatically run in the Overview tab based on Data Entry inputs.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ full_name: '', business_name: '', email: '', phone: '', password: '', business_type: 'Retail' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = mode === 'login' ? await authApi.login({ email: form.email, password: form.password }) : await authApi.register(form);
      localStorage.setItem('vyaparai-token', result.access_token); window.location.reload();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate.'); } 
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <section className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Activity className="h-8 w-8 text-emerald-500" /><h1 className="text-3xl font-extrabold text-slate-800">Vyapar<span className="text-emerald-500">AI</span></h1>
        </div>
        <h2 className="text-xl font-bold text-center mb-6">{mode === 'login' ? 'Secure Login' : 'Create Workspace'}</h2>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <>
              <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full p-3 border rounded-lg bg-slate-50" />
              <input required placeholder="Business Name" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} className="w-full p-3 border rounded-lg bg-slate-50" />
            </>
          )}
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full p-3 border rounded-lg bg-slate-50" />
          <input required minLength={8} type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full p-3 border rounded-lg bg-slate-50" />
          {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
          <button disabled={busy} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">{busy ? 'Connecting...' : mode === 'login' ? 'Login' : 'Create Account'}</button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full mt-4 text-sm text-slate-500 hover:text-emerald-600 font-semibold">{mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}</button>
      </section>
    </main>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('vyaparai-token')));
  useEffect(() => {
    if (!authenticated) return;
    authApi.me().catch(() => { localStorage.removeItem('vyaparai-token'); setAuthenticated(false); });
  }, [authenticated]);
  return authenticated ? <Workspace /> : <AuthScreen />;
}