import './App.css';
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
  CheckCircle2,
  Sliders,
  ArrowRight
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

// @ts-expect-error CSS side-effect imports are intentionally resolved at build time.
import './index.css';
import { 
  authApi, 
  businessApi, 
  recordsApi, 
  type BusinessResponse, 
  type FinancialRecordPayload, 
  type FinancialRecordResponse 
} from './api/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type FinancialRecord = {
  id: number;
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

type PageKey =
  | 'Overview'
  | 'Data Entry'
  | 'Financial Health'
  | 'Risk Analysis'
  | 'Cash Flow'
  | 'Anomalies'
  | 'AI Recommendations'
  | 'What-If Simulator'
  | 'Reports';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

const defaultBusiness: BusinessProfile = {
  name: '',
  industry: '',
  ownerEmail: '',
};

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

// ============================================================================
// UTILITIES
// ============================================================================

const currency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(amount || 0);
};

const compactCurrency = (amount: number) => {
  const a = Math.abs(amount);
  if (a >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (a >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (a >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${Math.round(amount)}`;
};

function recordFromApi(record: FinancialRecordResponse): FinancialRecord {
  return {
    id: record.id,
    date: record.month,
    revenue: record.revenue,
    operatingExpenses: record.expenses,
    cashBalance: record.cash_balance,
    receivables: record.receivables,
    payables: record.payables,
    loanOutstanding: record.debt,
    emi: record.payroll,
    inventoryValue: record.inventory,
    employeeCount: 0,
    overdueReceivables: 0,
    transactionCount: 0,
    notes: '',
  };
}

function recordToApi(record: Omit<FinancialRecord, 'id'>): FinancialRecordPayload {
  return {
    month: record.date,
    revenue: record.revenue,
    expenses: record.operatingExpenses,
    cash_balance: record.cashBalance,
    receivables: record.receivables,
    payables: record.payables,
    debt: record.loanOutstanding,
    inventory: record.inventoryValue,
    payroll: record.emi,
    operating_expenses: record.operatingExpenses,
    other_income: 0,
    other_expenses: 0,
  };
}

function businessFromApi(business: BusinessResponse, ownerEmail: string): BusinessProfile {
  return { 
    name: business.name, 
    industry: business.industry || business.business_type, 
    ownerEmail 
  };
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
  
  const revenueGrowth = previous?.revenue 
    ? (current.revenue - previous.revenue) / previous.revenue 
    : 0;
    
  const expenseGrowth = previous?.operatingExpenses 
    ? (current.operatingExpenses - previous.operatingExpenses) / previous.operatingExpenses 
    : 0;
    
  const overdueRatio = current.receivables > 0 
    ? current.overdueReceivables / current.receivables 
    : 0;
    
  const debtRatio = current.revenue > 0 
    ? current.loanOutstanding / current.revenue 
    : 0;
    
  const liquidity = current.payables > 0 
    ? current.cashBalance / current.payables 
    : 2;

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function Workspace() {
  const [business, setBusiness] = useState<BusinessProfile>(defaultBusiness);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeNav, setActiveNav] = useState<PageKey>('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<FinancialRecord, 'id'>>(emptyForm);
  const [savedMessage, setSavedMessage] = useState('');
  const [search, setSearch] = useState('');
  
  // Simulator State
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
        if (active) {
          setSavedMessage(
            requestError instanceof Error 
              ? requestError.message 
              : 'Unable to load workspace data'
          );
        }
      });
      
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    
    const timeout = window.setTimeout(async () => {
      try {
        const currentBusiness = await businessApi.get();
        await businessApi.update({
          name: business.name || 'My Business',
          business_type: business.industry,
          industry: business.industry,
          city: currentBusiness.city,
          monthly_revenue: currentBusiness.monthly_revenue,
          monthly_expenses: currentBusiness.monthly_expenses,
          current_cash: currentBusiness.current_cash,
          receivables: currentBusiness.receivables,
          payables: currentBusiness.payables,
          debt: currentBusiness.debt,
          employees: currentBusiness.employees,
        });
      } catch (requestError) {
        setSavedMessage(
          requestError instanceof Error 
            ? requestError.message 
            : 'Unable to save business profile'
        );
      }
    }, 400);
    
    return () => window.clearTimeout(timeout);
  }, [business.name, business.industry, dataLoaded]);

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => a.date.localeCompare(b.date));
  }, [records]);
  
  const current = sortedRecords[sortedRecords.length - 1];
  const previous = sortedRecords[sortedRecords.length - 2];
  
  const health = useMemo(() => computeHealth(sortedRecords), [sortedRecords]);
  const risk = riskFromHealth(health);
  
  const profit = current ? current.revenue - current.operatingExpenses : 0;
  const margin = current?.revenue ? (profit / current.revenue) * 100 : 0;
  const cashRunwayMonths = current?.operatingExpenses ? current.cashBalance / current.operatingExpenses : 0;
  
  const revenueGrowth = previous?.revenue 
    ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
    : 0;
    
  const expenseGrowth = previous?.operatingExpenses 
    ? ((current.operatingExpenses - previous.operatingExpenses) / previous.operatingExpenses) * 100 
    : 0;
    
  const receivableGrowth = previous?.receivables 
    ? ((current.receivables - previous.receivables) / previous.receivables) * 100 
    : 0;
    
  const overdueRatio = current?.receivables 
    ? (current.overdueReceivables / current.receivables) * 100 
    : 0;

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
    
    if (receivableGrowth > 10 || overdueRatio > 20) {
      list.push({ 
        title: 'Accelerate collections', 
        body: `Receivables are ${receivableGrowth.toFixed(1)}% higher than the previous record and ${overdueRatio.toFixed(1)}% are overdue.`, 
        tone: 'orange' 
      });
    }
    
    if (expenseGrowth > 10) {
      list.push({ 
        title: 'Review expense growth', 
        body: `Operating expenses increased ${expenseGrowth.toFixed(1)}% versus the previous record.`, 
        tone: 'red' 
      });
    }
    
    if (cashRunwayMonths < 1.5) {
      list.push({ 
        title: 'Protect liquidity', 
        body: `Current cash covers about ${cashRunwayMonths.toFixed(1)} months of the latest operating expense level.`, 
        tone: 'red' 
      });
    }
    
    if (margin < 10) {
      list.push({ 
        title: 'Protect margin', 
        body: `Current estimated operating margin is ${margin.toFixed(1)}%. Review pricing and variable costs.`, 
        tone: 'orange' 
      });
    }
    
    if (!list.length) {
      list.push({ 
        title: 'Maintain the current position', 
        body: 'Current indicators are relatively stable. Keep monitoring cash flow, receivables and expenses.', 
        tone: 'green' 
      });
    }
    
    list.push({ 
      title: 'Run a scenario check', 
      body: 'Use the What-If Simulator before adding major spending or debt.', 
      tone: 'green' 
    });
    
    return list.slice(0, 4);
  }, [receivableGrowth, overdueRatio, expenseGrowth, cashRunwayMonths, margin]);

  const anomalies = useMemo(() => {
    const result: { title: string; body: string; severity: 'Watch' | 'High' }[] = [];
    
    if (Math.abs(revenueGrowth) > 15) {
      result.push({ 
        title: 'Revenue change detected', 
        body: `Revenue changed ${revenueGrowth.toFixed(1)}% from the previous record.`, 
        severity: revenueGrowth < 0 ? 'High' : 'Watch' 
      });
    }
    
    if (expenseGrowth > 15) {
      result.push({ 
        title: 'Expense spike', 
        body: `Operating expenses increased ${expenseGrowth.toFixed(1)}%.`, 
        severity: 'High' 
      });
    }
    
    if (receivableGrowth > 15) {
      result.push({ 
        title: 'Receivables spike', 
        body: `Receivables increased ${receivableGrowth.toFixed(1)}%.`, 
        severity: 'High' 
      });
    }
    
    if (!result.length) {
      result.push({ 
        title: 'No major anomaly detected', 
        body: 'Current records do not trigger the prototype anomaly thresholds.', 
        severity: 'Watch' 
      });
    }
    
    return result;
  }, [revenueGrowth, expenseGrowth, receivableGrowth]);

  const forecast = useMemo(() => {
    const avgNet = sortedRecords.length 
      ? sortedRecords.reduce((sum, r) => sum + (r.revenue - r.operatingExpenses), 0) / sortedRecords.length 
      : 0;
      
    let cash = current?.cashBalance || 0;
    
    return [30, 60, 90].map((days) => {
      cash += avgNet * (days === 30 ? 1 : 1);
      return { day: `${days}d`, projected: Math.round(cash / 1000) };
    });
  }, [sortedRecords, current]);

  const simulator = useMemo(() => {
    if (!current) {
      return { health: 0, risk: 'CRITICAL' as RiskLevel, cash: 0, profit: 0 };
    }
    
    const revenue = current.revenue * (1 + simRevenue / 100);
    const expenses = current.operatingExpenses * (1 + simExpense / 100);
    const collections = current.receivables * (simCollections / 100);
    
    const simulatedCash = current.cashBalance 
      + Math.max(-current.cashBalance, collections - current.receivables) 
      + (revenue - current.revenue) 
      - (expenses - current.operatingExpenses);
      
    const simulatedProfit = revenue - expenses;
    
    let simulatedHealth = health 
      + (simulatedProfit >= profit ? 5 : -5) 
      + (simCollections >= 0 ? Math.min(5, simCollections / 4) : 0);
      
    if (simulatedCash < current.cashBalance * 0.75) {
      simulatedHealth -= 8;
    }
    
    return { 
      health: Math.round(clamp(simulatedHealth, 0, 100)), 
      risk: riskFromHealth(clamp(simulatedHealth, 0, 100)), 
      cash: Math.round(simulatedCash), 
      profit: Math.round(simulatedProfit) 
    };
  }, [current, simRevenue, simExpense, simCollections, health, profit]);

  const refreshData = async () => {
    try {
      const [serverBusiness, serverRecords] = await Promise.all([businessApi.get(), recordsApi.list()]);
      setBusiness((currentBusiness) => businessFromApi(serverBusiness, currentBusiness.ownerEmail));
      setRecords(serverRecords.map(recordFromApi));
      setSavedMessage('Data refreshed from server');
    } catch (requestError) {
      setSavedMessage(
        requestError instanceof Error 
          ? requestError.message 
          : 'Unable to refresh data'
      );
    }
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const updateField = (key: keyof Omit<FinancialRecord, 'id'>, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === 'date' || key === 'notes' ? value : Number(value),
    } as Omit<FinancialRecord, 'id'>));
  };

  const submitRecord = async (e: FormEvent) => {
    e.preventDefault();
    const clean = { ...form };
    if (!clean.date) return;
    
    try {
      const saved = editingId
        ? await recordsApi.update(editingId, recordToApi(clean))
        : await recordsApi.create(recordToApi(clean));
        
      setRecords((prev) => editingId
        ? prev.map((record) => record.id === editingId ? recordFromApi(saved) : record)
        : [...prev, recordFromApi(saved)]);
        
      setSavedMessage(editingId ? 'Financial record updated' : 'Financial record saved');
    } catch (requestError) {
      setSavedMessage(
        requestError instanceof Error 
          ? requestError.message 
          : 'Unable to save financial record'
      );
      return;
    }
    
    setForm(emptyForm);
    setEditingId(null);
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const editRecord = (record: FinancialRecord) => {
    const { id: _id, ...formValues } = record;
    setForm(formValues);
    setEditingId(record.id);
    setActiveNav('Data Entry');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = async (id: number) => {
    try {
      await recordsApi.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSavedMessage('Record deleted');
    } catch (requestError) {
      setSavedMessage(
        requestError instanceof Error 
          ? requestError.message 
          : 'Unable to delete record'
      );
    }
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

  // ============================================================================
  // OVERVIEW TAB
  // ============================================================================

  const renderOverview = () => {
    return (
      <>
        <section className="hero-row">
          <div>
            <div className="eyebrow green">BUSINESS OVERVIEW</div>
            <h2>Here’s your financial pulse.</h2>
            <p>Enter your monthly business numbers and VyaparAI will recalculate health, risk, forecasts, anomalies and recommendations.</p>
          </div>
          <div className="hero-actions">
            <button className="secondary-btn" onClick={() => go('Data Entry')}>
              <Plus size={16}/> Add financial data
            </button>
            <button className="ghost-btn" onClick={refreshData}>Refresh data</button>
          </div>
        </section>

        <section className="metric-grid">
          <div className="metric-card featured">
            <div className="metric-top">
              <span>FINANCIAL HEALTH</span>
              <div className="tiny-badge positive">
                <TrendingUp size={12}/> {health >= 80 ? 'Stable' : 'Needs attention'}
              </div>
            </div>
            <div className="metric-value-row">
              <strong>{health}</strong><span>/ 100</span>
            </div>
            <div className="health-ring-row">
              <div className="mini-ring" style={{ ['--progress' as any]: `${health * 3.6}deg` }}>
                <div>{health}%</div>
              </div>
              <div>
                <strong>{risk === 'LOW' ? 'Healthy position' : `${risk} risk`}</strong>
                <small>Calculated from your latest financial record</small>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>CASH BALANCE</span>
              <CircleDollarSign size={16} className="metric-icon green-icon"/>
            </div>
            <div className="metric-value">{currency(current?.cashBalance || 0)}</div>
            <div className="metric-foot">
              <span className={revenueGrowth >= 0 ? 'positive-text' : 'negative-text'}>
                {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
              </span> revenue change vs previous
            </div>
            <div className="sparkline green-line">
              <span style={{height:'36%'}}/><span style={{height:'45%'}}/><span style={{height:'49%'}}/><span style={{height:'60%'}}/><span style={{height:'58%'}}/><span style={{height:'74%'}}/><span style={{height:'89%'}}/>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>RISK STATUS</span>
              <ShieldAlert size={16} className="metric-icon"/>
            </div>
            <div className="risk-row">
              <div className={`risk-pill ${risk.toLowerCase()}`}><span/>{risk}</div>
            </div>
            <div className="metric-foot">Health score based prototype risk bands</div>
            <div className="risk-meter">
              <span className="low"/><span className="medium"/><span className="high"/><span className="critical"/>
              <i style={{left:`${clamp(100-health, 5, 95)}%`}}/>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-top">
              <span>NET PROFIT</span>
              <WalletCards size={16} className="metric-icon green-icon"/>
            </div>
            <div className="metric-value">{currency(profit)}</div>
            <div className="metric-foot">
              <span className={margin >= 10 ? 'positive-text' : 'negative-text'}>
                {margin.toFixed(1)}%
              </span> estimated operating margin
            </div>
            <div className="sparkline blue-line">
              <span style={{height:'48%'}}/><span style={{height:'54%'}}/><span style={{height:'67%'}}/><span style={{height:'61%'}}/><span style={{height:'73%'}}/><span style={{height:'78%'}}/><span style={{height:'86%'}}/>
            </div>
          </div>
        </section>

        <section className="chart-grid two-thirds">
          <div className="panel large-panel">
            <div className="panel-header">
              <div>
                <h3>Revenue trend</h3>
                <p>Saved records over time</p>
              </div>
              <button className="ghost-btn">Live data <Activity size={13}/></button>
            </div>
            <div className="chart-stat">
              <strong>{currency(current?.revenue || 0)}</strong>
              <span className={revenueGrowth >= 0 ? 'positive-text' : 'negative-text'}>
                <TrendingUp size={14}/> {revenueGrowth.toFixed(1)}% vs previous
              </span>
            </div>
            <div className="chart-area" style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrend} margin={{top:10,right:10,left:-18,bottom:0}}>
                  <CartesianGrid stroke="#edf3ef" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:11}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:11}} tickFormatter={(v)=>`₹${v}k`}/>
                  <Tooltip formatter={(value)=>[currency(Number(value || 0)*1000),'Revenue']}/>
                  <Bar dataKey="value" radius={[7,7,2,2]} fill="#0d8b62"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Cash flow</h3>
                <p>Revenue minus operating expenses</p>
              </div>
            </div>
            <div className="chart-area compact" style={{ height: 220, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{top:15,right:5,left:-18,bottom:0}}>
                  <defs>
                    <linearGradient id="cashGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d8b62" stopOpacity={0.22}/>
                      <stop offset="100%" stopColor="#0d8b62" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf3ef" vertical={false}/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:10}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#94a39a',fontSize:9}} tickFormatter={(v)=>`${v}k`}/>
                  <Tooltip formatter={(value)=>[`₹${Number(value || 0)}k`,'Net cash']}/>
                  <Area type="monotone" dataKey="net" stroke="#0d8b62" strokeWidth={2.4} fill="url(#cashGradient2)"/></AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span><i className="dot green"/> Net cash</span>
              <span>{cashFlowData.length} records saved</span>
            </div>
          </div>
        </section>

        <section className="chart-grid three-col">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Potential risks</h3>
                <p>Signals needing attention</p>
              </div>
            </div>
            <div className="risk-list">
              <div className="risk-item">
                <div className="risk-icon warning"><TrendingDown size={15}/></div>
                <div><strong>Receivables</strong><small>{receivableGrowth.toFixed(1)}% vs previous</small></div>
                <span className={`risk-score ${receivableGrowth>10?'orange':''}`}>{Math.round(clamp(100-overdueRatio, 10, 98))}</span>
              </div>
              <div className="risk-item">
                <div className="risk-icon green"><Activity size={15}/></div>
                <div><strong>Cash runway</strong><small>{cashRunwayMonths.toFixed(1)} months</small></div>
                <span className="risk-score">{Math.round(clamp(cashRunwayMonths*35,10,99))}</span>
              </div>
              <div className="risk-item">
                <div className="risk-icon blue"><ShieldAlert size={15}/></div>
                <div><strong>Debt burden</strong><small>{current?.revenue ? ((current.loanOutstanding/current.revenue)*100).toFixed(1) : '0'}% of revenue</small></div>
                <span className="risk-score blue-score">{Math.round(clamp(100-(current?.revenue ? current.loanOutstanding/current.revenue*100 : 0)*2,15,95))}</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Financial mix</h3>
                <p>Latest record snapshot</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 0', minHeight: '180px' }}>
              <div style={{ width: '150px', height: '150px', position: 'relative', flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
                      {expenseBreakdown.map((_,i) => <Cell key={i} fill={['#0d8b62','#43aa7f','#f4ad28','#4f8df7'][i]}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <strong style={{ fontSize: '15px', color: '#111827', lineHeight: 1.2 }}>
                    {compactCurrency(current?.operatingExpenses || 0)}
                  </strong>
                  <small style={{ fontSize: '11px', color: '#6b7280' }}>Operating</small>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                {expenseBreakdown.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                      <i style={{ background: ['#0d8b62','#43aa7f','#f4ad28','#4f8df7'][i], width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}/>
                      {item.name}
                    </span>
                    <strong style={{ color: '#111827' }}>{compactCurrency(item.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>AI recommendations</h3>
                <p>Based on saved records</p>
              </div>
              <div className="ai-chip"><Bot size={14}/> AI</div>
            </div>
            <div className="recommendations">
              {recommendations.slice(0,3).map((r,i) => (
                <div className="recommendation" key={i}>
                  <div className={`rec-icon ${r.tone==='green'?'green-bg':r.tone==='red'?'red-bg':''}`}>
                    <Sparkles size={15}/>
                  </div>
                  <div>
                    <strong>{r.title}</strong>
                    <small>{r.body}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="simulator-banner">
          <div className="simulator-copy">
            <div className="sim-icon"><Zap size={18}/></div>
            <div>
              <span className="eyebrow green">WHAT-IF SIMULATOR</span>
              <h3>Test decisions before acting on them.</h3>
              <p>Adjust revenue, expenses and collections and instantly see the estimated effect on health, risk and cash.</p>
            </div>
          </div>
          <div className="simulator-results">
            <div>
              <small>Health</small>
              <strong>{simulator.health}</strong>
              <span className="positive-text">/100</span>
            </div>
            <div>
              <small>Risk</small>
              <strong className="risk-text">{simulator.risk}</strong>
            </div>
            <div>
              <small>Simulated cash</small>
              <strong>{currency(simulator.cash)}</strong>
            </div>
            <button className="primary-btn" onClick={() => go('What-If Simulator')}>
              Open simulator <Zap size={15}/>
            </button>
          </div>
        </section>

        <div className="bottom-note">
          <Database size={13}/> Data is synced with the VyaparAI backend.
        </div>
      </>
    );
  };

  // ============================================================================
  // REBUILT: FINANCIAL HEALTH TAB
  // ============================================================================

  const renderHealth = () => {
    const drivers = [
      { label: 'Revenue trend', score: clamp(70 + revenueGrowth * 1.8, 0, 100), desc: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs previous record` },
      { label: 'Profitability margin', score: clamp(50 + margin * 2.2, 0, 100), desc: `${margin.toFixed(1)}% operating margin` },
      { label: 'Liquidity coverage', score: clamp(((current?.cashBalance || 0) / Math.max(1, current?.payables || 1)) * 35, 0, 100), desc: `${cashRunwayMonths.toFixed(1)} months cash runway` },
      { label: 'Receivables health', score: clamp(100 - overdueRatio * 1.2, 0, 100), desc: `${overdueRatio.toFixed(1)}% overdue ratio` },
      { label: 'Debt to revenue', score: clamp(100 - (((current?.loanOutstanding || 0) / Math.max(1, current?.revenue || 1)) * 120), 0, 100), desc: `${((current?.loanOutstanding || 0) / Math.max(1, current?.revenue || 1) * 100).toFixed(1)}% debt burden` },
      { label: 'Expense discipline', score: clamp(80 - Math.max(0, expenseGrowth) * 1.6, 0, 100), desc: `${expenseGrowth.toFixed(1)}% expense change` },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Summary Banner */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#ecfdf5', border: '6px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#047857', lineHeight: 1 }}>{health}</span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', marginTop: '2px' }}>/ 100</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Financial Solvency Rating</h3>
                <span style={{ background: risk === 'LOW' ? '#d1fae5' : '#fee2e2', color: risk === 'LOW' ? '#065f46' : '#991b1b', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {risk} RISK
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '6px 0 0 0', maxWidth: '600px' }}>
                Comprehensive score evaluating revenue trajectory, liquidity buffers, margin preservation, working capital cycles, and debt exposure.
              </p>
            </div>
          </div>
          <button className="primary-btn" onClick={() => go('What-If Simulator')}>
            Run Scenario <Zap size={14} style={{ marginLeft: '6px' }}/>
          </button>
        </div>

        {/* Driver Grid with clean progress tracks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {drivers.map((d) => (
            <div key={d.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{d.label}</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: d.score >= 80 ? '#059669' : d.score >= 60 ? '#d97706' : '#dc2626' }}>
                  {Math.round(d.score)} <span style={{ fontSize: '11px', color: '#94a39a', fontWeight: '500' }}>/ 100</span>
                </span>
              </div>

              {/* Explicit Progress Track */}
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${d.score}%`, 
                    height: '100%', 
                    background: d.score >= 80 ? '#10b981' : d.score >= 60 ? '#f59e0b' : '#ef4444', 
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>

              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {d.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Actionable Recommendations */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: '#059669' }}/>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Prescriptive Recommendations</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.tone === 'green' ? '#10b981' : r.tone === 'orange' ? '#f59e0b' : '#ef4444', marginTop: '6px', flexShrink: 0 }}/>
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>{r.title}</strong>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // REBUILT: RISK ANALYSIS TAB
  // ============================================================================

  const renderRisk = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Risk Level Banner */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Risk Category</span>
            <div style={{ fontSize: '32px', fontWeight: '800', color: risk === 'LOW' ? '#047857' : risk === 'MEDIUM' ? '#b45309' : '#b91c1c', marginTop: '4px' }}>
              {risk} RISK
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Computed from health score thresholds & debt signals</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Revenue Trend</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: revenueGrowth >= 0 ? '#047857' : '#b91c1c', marginTop: '2px' }}>
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
            </div>
            <small style={{ color: '#94a3b8', fontSize: '11px' }}>vs previous month</small>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Expense Drift</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: expenseGrowth <= 5 ? '#047857' : '#b91c1c', marginTop: '2px' }}>
              {expenseGrowth >= 0 ? '+' : ''}{expenseGrowth.toFixed(1)}%
            </div>
            <small style={{ color: '#94a3b8', fontSize: '11px' }}>operating burn rate</small>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Debt / Revenue</span>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>
              {current?.revenue ? ((current.loanOutstanding / current.revenue) * 100).toFixed(1) : '0'}%
            </div>
            <small style={{ color: '#94a3b8', fontSize: '11px' }}>leverage ratio</small>
          </div>
        </div>

        {/* Signals & Anomalies Feed */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Active Risk Signals & Anomalies</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Variance and threshold warnings detected across accounts</p>
            </div>
            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px' }}>
              {anomalies.length} Signals
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: a.severity === 'High' ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.severity === 'High' ? '#b91c1c' : '#b45309', flexShrink: 0 }}>
                    <AlertTriangle size={16}/>
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1e293b' }}>{a.title}</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{a.body}</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', background: a.severity === 'High' ? '#fecaca' : '#fed7aa', color: a.severity === 'High' ? '#991b1b' : '#9a3412' }}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // REBUILT: WHAT-IF SIMULATOR TAB
  // ============================================================================

  const renderSimulator = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header copy */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '10px', color: '#047857' }}>
              <Zap size={20}/>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>What-If Scenario Simulator</h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                Stress test operational levers and forecast instant impacts on Health Score, cash runway, and net profit.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Interactive Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Levers Controls */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} style={{ color: '#047857' }}/> Adjust Operational Levers
            </h4>

            {/* Slider 1: Revenue */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Projected Revenue Change</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: simRevenue >= 0 ? '#059669' : '#dc2626', background: simRevenue >= 0 ? '#ecfdf5' : '#fef2f2', padding: '2px 8px', borderRadius: '6px' }}>
                  {simRevenue >= 0 ? '+' : ''}{simRevenue}%
                </span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1" 
                value={simRevenue} 
                onChange={(e) => setSimRevenue(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0d8b62', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>-50% downturn</span>
                <span>0%</span>
                <span>+50% expansion</span>
              </div>
            </div>

            {/* Slider 2: Expenses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Operating Expense Variance</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: simExpense <= 0 ? '#059669' : '#dc2626', background: simExpense <= 0 ? '#ecfdf5' : '#fef2f2', padding: '2px 8px', borderRadius: '6px' }}>
                  {simExpense >= 0 ? '+' : ''}{simExpense}%
                </span>
              </div>
              <input 
                type="range" 
                min="-50" 
                max="50" 
                step="1" 
                value={simExpense} 
                onChange={(e) => setSimExpense(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0d8b62', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>-50% cost cutting</span>
                <span>0%</span>
                <span>+50% cost surge</span>
              </div>
            </div>

            {/* Slider 3: Collections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Expedited AR Collections</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                  +{simCollections}%
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="40" 
                step="1" 
                value={simCollections} 
                onChange={(e) => setSimCollections(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#0d8b62', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                <span>Baseline</span>
                <span>+20% collected</span>
                <span>+40% accelerated</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#475569' }}>
              <strong>Applied Hypothesis:</strong> Revenue {simRevenue >= 0 ? '+' : ''}{simRevenue}%, Expenses {simExpense >= 0 ? '+' : ''}{simExpense}%, Receivables Recovery +{simCollections}%.
            </div>
          </div>

          {/* Simulated Outputs & Comparison */}
          <div style={{ background: '#042f24', color: '#ffffff', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(4,47,36,0.15)' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: '#6ee7b7', textTransform: 'uppercase' }}>
                SIMULATION RESULTS
              </span>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: '4px 0 20px 0' }}>
                Projected Business Outcome
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '12px', color: '#a7f3d0' }}>Simulated Health</span>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
                    {simulator.health} <span style={{ fontSize: '14px', color: '#6ee7b7' }}>/100</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '12px', color: '#a7f3d0' }}>Simulated Risk</span>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: simulator.risk === 'LOW' ? '#6ee7b7' : '#fcd34d', marginTop: '6px' }}>
                    {simulator.risk}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '12px', color: '#a7f3d0' }}>Projected Cash</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
                    {currency(simulator.cash)}
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '12px', color: '#a7f3d0' }}>Estimated Profit</span>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
                    {currency(simulator.profit)}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side transition preview */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Current Health</span>
                <div style={{ fontSize: '18px', fontWeight: '700' }}>{health}</div>
              </div>
              <ArrowRight size={18} style={{ color: '#34d399' }}/>
              <div>
                <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Simulated Health</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#6ee7b7' }}>{simulator.health}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#a7f3d0' }}>Delta</span>
                <div style={{ fontSize: '18px', fontWeight: '700', color: simulator.health >= health ? '#34d399' : '#f87171' }}>
                  {simulator.health >= health ? '+' : ''}{simulator.health - health} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // OTHER TABS (DATA ENTRY, CASH FLOW, REPORTS)
  // ============================================================================

  const renderDataEntry = () => {
    return (
      <>
        <section className="hero-row">
          <div>
            <div className="eyebrow green">DATA INPUT</div>
            <h2>Feed VyaparAI your real business numbers.</h2>
            <p>Save one record per date or month. Every saved record updates the dashboard automatically.</p>
          </div>
          <div className="hero-actions">
            <button className="secondary-btn" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
              <Plus size={16}/> New record
            </button>
            <button className="ghost-btn" onClick={refreshData}>Refresh data</button>
          </div>
        </section>

        <section className="entry-layout">
          <div className="panel form-panel">
            <div className="panel-header">
              <div>
                <h3>{editingId ? 'Edit financial record' : 'Add financial record'}</h3>
                <p>Use the latest monthly figures available to you.</p>
              </div>
              <div className="ai-chip"><Database size={14}/> Live calculation</div>
            </div>
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
              <div className="form-actions">
                <button type="submit" className="primary-btn">
                  <Save size={16}/>{editingId ? 'Update record' : 'Save record'}
                </button>
                <button type="button" className="ghost-btn" onClick={() => { setForm(emptyForm); setEditingId(null); }}>Clear</button>
              </div>
            </form>
          </div>

          <div className="panel profile-panel">
            <div className="panel-header">
              <div>
                <h3>Business profile</h3>
                <p>Synced with your workspace</p>
              </div>
            </div>
            <div className="form-grid single">
              <label>Business name<input value={business.name} onChange={e=>setBusiness(v=>({...v,name:e.target.value}))}/></label>
              <label>Industry
                <select value={business.industry} onChange={e=>setBusiness(v=>({...v,industry:e.target.value}))}>
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Manufacturing</option>
                  <option>Services</option>
                  <option>Food & Beverage</option>
                  <option>Other MSME</option>
                </select>
              </label>
              <label>Owner email (optional)<input type="email" value={business.ownerEmail} onChange={e=>setBusiness(v=>({...v,ownerEmail:e.target.value}))}/></label>
            </div>
            <div className="info-box">
              <ShieldAlert size={16}/>
              <div>
                <strong>Connected workspace</strong>
                <p>Business details and financial records are saved to your FastAPI backend.</p>
              </div>
            </div>
            <div className="quick-metrics">
              <div><span>Records</span><strong>{records.length}</strong></div>
              <div><span>Latest revenue</span><strong>{compactCurrency(current?.revenue || 0)}</strong></div>
              <div><span>Latest health</span><strong>{health}/100</strong></div>
            </div>
          </div>
        </section>

        <section className="panel records-panel">
          <div className="panel-header">
            <div>
              <h3>Saved financial records</h3>
              <p>Click edit to change a row or delete incorrect data.</p>
            </div>
            <div className="search-box small">
              <Search size={15}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes/date"/>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Cash</th>
                  <th>AR</th>
                  <th>Debt</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map(r => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{currency(r.revenue)}</td>
                    <td>{currency(r.operatingExpenses)}</td>
                    <td>{currency(r.cashBalance)}</td>
                    <td>{currency(r.receivables)}</td>
                    <td>{currency(r.loanOutstanding)}</td>
                    <td>
                      <button className="table-btn" onClick={() => editRecord(r)}>Edit</button>
                      <button className="table-btn danger" onClick={() => deleteRecord(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!visibleRecords.length && (
                  <tr><td colSpan={7} className="empty-row">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  const renderCashFlow = () => (
    <section className="page-grid-single">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Cash-flow history</h3>
            <p>Revenue minus operating expenses</p>
          </div>
        </div>
        <div className="chart-area tall" style={{ height: 320, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid stroke="#edf3ef" vertical={false}/>
              <XAxis dataKey="month"/>
              <YAxis/>
              <Tooltip/>
              <Line type="monotone" dataKey="inflow" stroke="#0d8b62" strokeWidth={3}/>
              <Line type="monotone" dataKey="outflow" stroke="#ef7a60" strokeWidth={2.5}/>
              <Line type="monotone" dataKey="net" stroke="#4f8df7" strokeWidth={2.5}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>30 / 60 / 90-day forecast</h3>
            <p>Illustrative forecast using average saved net cash flow.</p>
          </div>
          <div className="forecast-tag"><Activity size={14}/> Forecast</div>
        </div>
        <div className="forecast-cards">
          {forecast.map(f => (
            <div key={f.day}>
              <span>{f.day}</span>
              <strong>{compactCurrency(f.projected*1000)}</strong>
              <small>Projected cash</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderAnomalies = () => (
    <section className="page-grid-single">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Detected anomalies</h3>
            <p>Prototype thresholds based on changes between saved records.</p>
          </div>
        </div>
        {anomalies.map((a,i) => (
          <div className="alert-card" key={i}>
            <div className={`severity-dot ${a.severity==='High'?'red':'orange'}`}/>
            <div>
              <strong>{a.title}</strong>
              <small>{a.body}</small>
            </div>
            <span>{a.severity}</span>
          </div>
        ))}
      </div>
      <div className="panel info-panel">
        <Upload size={18}/>
        <div>
          <h3>More powerful anomaly detection</h3>
          <p>Once your backend is connected, this section can use Isolation Forest on transaction-level data to identify unusual payments, expense spikes and cash withdrawals.</p>
        </div>
      </div>
    </section>
  );

  const renderRecommendations = () => (
    <section className="page-grid-single">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>AI recommendations</h3>
            <p>Rules-based prototype recommendations calculated from your current records.</p>
          </div>
          <div className="ai-chip"><Bot size={14}/> AI</div>
        </div>
        {recommendations.map((r,i) => (
          <div className="recommendation wide" key={i}>
            <div className={`rec-icon ${r.tone==='green'?'green-bg':r.tone==='red'?'red-bg':''}`}>
              <Sparkles size={15}/>
            </div>
            <div>
              <strong>{r.title}</strong>
              <small>{r.body}</small>
            </div>
            <span className={`recommendation-tag ${r.tone}`}>{r.tone}</span>
          </div>
        ))}
      </div>
      <div className="bottom-note">
        <ShieldAlert size={13}/> Recommendations are decision-support suggestions, not professional financial advice.
      </div>
    </section>
  );

  const renderReports = () => (
    <section className="page-grid-single">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Reports</h3>
            <p>Quick snapshot based on your saved data.</p>
          </div>
          <button className="primary-btn" onClick={()=>window.print()}>
            <Upload size={15}/> Print / Save PDF
          </button>
        </div>
        <div className="report-grid">
          <div><span>Business</span><strong>{business.name}</strong></div>
          <div><span>Health</span><strong>{health}/100</strong></div>
          <div><span>Risk</span><strong>{risk}</strong></div>
          <div><span>Revenue</span><strong>{currency(current?.revenue || 0)}</strong></div>
          <div><span>Profit</span><strong>{currency(profit)}</strong></div>
          <div><span>Cash</span><strong>{currency(current?.cashBalance || 0)}</strong></div>
          <div><span>Receivables</span><strong>{currency(current?.receivables || 0)}</strong></div>
          <div><span>Debt</span><strong>{currency(current?.loanOutstanding || 0)}</strong></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Notes</h3>
            <p>Report details</p>
          </div>
        </div>
        <p className="report-note">
          This report reflects the financial records currently saved in your connected workspace.
        </p>
      </div>
    </section>
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

  // ============================================================================
  // APP SHELL
  // ============================================================================
  
  return (
    <div 
      className="app-shell" 
      style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      {/* SIDEBAR */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-visible' : ''}`}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          flexShrink: 0 
        }}
      >
        <div className="brand-row" style={{ flexShrink: 0 }}>
          <div className="brand-mark"><span>V</span></div>
          {sidebarOpen && (
            <div>
              <div className="brand-name">Vyapar<span>AI</span></div>
              <div className="brand-sub">Financial Intelligence</div>
            </div>
          )}
          {mobileOpen && (
            <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}>
              <X size={18}/>
            </button>
          )}
        </div>
        
        <div className="workspace-card" style={{ flexShrink: 0 }}>
          <div className="workspace-icon">
            <CircleDollarSign size={16}/>
          </div>
          {sidebarOpen && (
            <div className="workspace-copy">
              <span className="eyebrow">BUSINESS</span>
              <strong>{business.name || 'My Business'}</strong>
              <small>{business.industry || 'Workspace'}</small>
            </div>
          )}
        </div>
        
        <nav 
          className="nav-list" 
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {navItems.map(({label, icon: Icon}) => (
            <button 
              key={label} 
              className={`nav-item ${activeNav === label ? 'active' : ''}`} 
              onClick={() => { setActiveNav(label); setMobileOpen(false); }} 
              title={label}
            >
              <Icon size={18}/>
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>
        
        <div 
          className="sidebar-bottom" 
          style={{ 
            marginTop: 'auto', 
            flexShrink: 0,
            paddingTop: '16px',
            paddingBottom: '16px'
          }}
        >
          <button 
            className="nav-item" 
            onClick={async () => { 
              try { await authApi.logout(); } 
              finally { 
                localStorage.removeItem('vyaparai-token'); 
                window.location.reload(); 
              } 
            }}
          >
            <Settings size={18}/>
            {sidebarOpen && <span>Logout</span>}
          </button>
          
          <div className="trust-chip">
            <ShieldAlert size={15}/>
            {sidebarOpen && <span>Protected workspace</span>}
          </div>
          
          {sidebarOpen && (
            <div 
              className="apex-footer" 
              style={{ 
                marginTop: '20px', 
                fontSize: '10px', 
                color: '#9ca3af', 
                textAlign: 'center', 
                letterSpacing: '0.05em',
                fontWeight: '600'
              }}
            >
              TEAM APEX • VYAPARAI
            </div>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <button 
          className="mobile-backdrop" 
          onClick={() => setMobileOpen(false)} 
          aria-label="Close menu"
        />
      )}
      
      {/* MAIN CONTAINER */}
      <main 
        className="main-shell" 
        style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <header className="topbar" style={{ flexShrink: 0 }}>
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <Menu size={20}/>
            </button>
            <button className="collapse-btn" onClick={() => setSidebarOpen(v => !v)}>
              {sidebarOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}
            </button>
            <div className="page-title-wrap">
              <div className="page-kicker">VYAPARAI WORKSPACE</div>
              <h1>{activeNav}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saved data..."/>
              <kbd>⌘ K</kbd>
            </div>
            <div className="period-pill">
              <CalendarDays size={15}/> 
              {current?.date || 'No data'} 
              <ChevronDown size={14}/>
            </div>
            <button className="icon-btn"><Bell size={17}/></button>
            <div className="avatar">A</div>
          </div>
        </header>
        
        <div className="content" style={{ flex: 1, paddingBottom: '40px' }}>
          {page}
        </div>
      </main>

      {savedMessage && (
        <div className="toast">
          <Save size={15}/>{savedMessage}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AUTHENTICATION SCREEN
// ============================================================================

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ 
    full_name: '', 
    business_name: '', 
    email: '', 
    phone: '', 
    password: '', 
    business_type: 'Retail' 
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); 
    setBusy(true); 
    setError('');
    
    try {
      const result = mode === 'login' 
        ? await authApi.login({ email: form.email, password: form.password }) 
        : await authApi.register(form);
        
      localStorage.setItem('vyaparai-token', result.access_token); 
      window.location.reload();
    } catch (requestError) { 
      setError(requestError instanceof Error ? requestError.message : 'Unable to authenticate.'); 
    } finally { 
      setBusy(false); 
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-row">
          <div className="brand-mark"><span>V</span></div>
          <div>
            <div className="brand-name">Vyapar<span>AI</span></div>
            <div className="brand-sub">Financial Intelligence</div>
          </div>
        </div>
        <div className="eyebrow green">SECURE WORKSPACE</div>
        <h1>{mode === 'login' ? 'Welcome back.' : 'Create your workspace.'}</h1>
        <p>
          {mode === 'login' 
            ? 'Sign in to continue to your financial command center.' 
            : 'Start with your business details. You can complete the profile later.'}
        </p>
        
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>Full name
                <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </label>
              <label>Business name
                <input required value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} />
              </label>
              <label>Phone
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>Business type
                <select value={form.business_type} onChange={e => setForm({ ...form, business_type: e.target.value })}>
                  <option>Retail</option>
                  <option>Wholesale</option>
                  <option>Manufacturing</option>
                  <option>Services</option>
                </select>
              </label>
            </>
          )}
          <label>Email
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>Password
            <input required minLength={8} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </label>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button className="primary-btn" disabled={busy}>
            {busy ? 'Connecting...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>
        
        <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}

// ============================================================================
// APP ROOT
// ============================================================================

export default function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem('vyaparai-token')));
  
  useEffect(() => {
    if (!authenticated) return;
    
    authApi.me().catch(() => { 
      localStorage.removeItem('vyaparai-token'); 
      setAuthenticated(false); 
    });
  }, [authenticated]);
  
  return authenticated ? <Workspace /> : <AuthScreen />;
}