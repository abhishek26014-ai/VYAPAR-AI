import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Database,
  Gauge,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./index.css";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Business = {
  name: string;
  industry: string;
  health: number;
  risk: RiskLevel;
  cash: number;
  revenue: number;
  expenses: number;
  receivables: number;
  payables: number;
  debt: number;
  margin: number;
};

const businesses: Business[] = [
  {
    name: "Sharma Wholesale",
    industry: "FMCG Wholesale",
    health: 82,
    risk: "LOW",
    cash: 780000,
    revenue: 1180000,
    expenses: 820000,
    receivables: 560000,
    payables: 320000,
    debt: 280000,
    margin: 22.7,
  },
  {
    name: "Kumar Retail Hub",
    industry: "Retail",
    health: 64,
    risk: "MEDIUM",
    cash: 420000,
    revenue: 890000,
    expenses: 690000,
    receivables: 410000,
    payables: 360000,
    debt: 450000,
    margin: 13.4,
  },
  {
    name: "Patel Services",
    industry: "Professional Services",
    health: 91,
    risk: "LOW",
    cash: 960000,
    revenue: 1420000,
    expenses: 890000,
    receivables: 280000,
    payables: 160000,
    debt: 120000,
    margin: 31.1,
  },
];

const cashFlow = [
  { month: "Apr", inflow: 410, outflow: 280, net: 130 },
  { month: "May", inflow: 450, outflow: 300, net: 150 },
  { month: "Jun", inflow: 470, outflow: 340, net: 130 },
  { month: "Jul", inflow: 520, outflow: 360, net: 160 },
  { month: "Aug", inflow: 560, outflow: 370, net: 190 },
  { month: "Sep", inflow: 620, outflow: 410, net: 210 },
  { month: "Oct", inflow: 650, outflow: 430, net: 220 },
];

const forecast = [
  { month: "Oct", actual: 220, forecast: 220 },
  { month: "Nov", actual: null, forecast: 238 },
  { month: "Dec", actual: null, forecast: 242 },
  { month: "Jan", actual: null, forecast: 228 },
  { month: "Feb", actual: null, forecast: 210 },
  { month: "Mar", actual: null, forecast: 206 },
];

const expenseBreakdown = [
  { name: "Payroll", value: 320 },
  { name: "Rent & Utilities", value: 180 },
  { name: "Marketing", value: 150 },
  { name: "Software", value: 90 },
  { name: "Other", value: 240 },
];

const revenueTrend = [
  { month: "Apr", value: 760 },
  { month: "May", value: 810 },
  { month: "Jun", value: 850 },
  { month: "Jul", value: 940 },
  { month: "Aug", value: 1030 },
  { month: "Sep", value: 1090 },
  { month: "Oct", value: 1180 },
];

const riskDrivers = [
  { label: "Cash-flow stability", score: 89, color: "#0d8b62" },
  { label: "Profitability", score: 84, color: "#11a36f" },
  { label: "Receivables", score: 61, color: "#f4ad28" },
  { label: "Debt burden", score: 67, color: "#f07c52" },
  { label: "Expense control", score: 79, color: "#4f8df7" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Financial Health", icon: Gauge },
  { label: "Risk Analysis", icon: ShieldAlert },
  { label: "Cash Flow", icon: LineChartIcon },
  { label: "Anomalies", icon: AlertTriangle },
  { label: "AI Recommendations", icon: Sparkles },
  { label: "What-If Simulator", icon: Zap },
  { label: "Reports", icon: BarChart3 },
];

const currency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function App() {
  const [selectedBusiness, setSelectedBusiness] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("Overview");
  const [showBusinessMenu, setShowBusinessMenu] = useState(false);

  const business = businesses[selectedBusiness];

  const simulator = useMemo(() => {
    const revenueFactor = 0.95;
    const expenseFactor = 0.92;
    const collectionBoost = 1.12;
    const newRevenue = business.revenue * revenueFactor;
    const newExpenses = business.expenses * expenseFactor;
    const improvedCollections = business.receivables * collectionBoost;
    const netImpact = (newRevenue - newExpenses) * 0.24 + improvedCollections * 0.08;
    const simulatedHealth = Math.max(
      0,
      Math.min(100, Math.round(business.health + (netImpact > 0 ? 5 : -7)))
    );
    return {
      revenue: newRevenue,
      expenses: newExpenses,
      health: simulatedHealth,
      cash: business.cash + Math.round(netImpact),
      risk: simulatedHealth >= 80 ? "LOW" : simulatedHealth >= 60 ? "MEDIUM" : "HIGH",
    };
  }, [business]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"} ${mobileOpen ? "mobile-visible" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><span>V</span></div>
          {sidebarOpen && (
            <div>
              <div className="brand-name">Vyapar<span>AI</span></div>
              <div className="brand-sub">Financial Intelligence</div>
            </div>
          )}
          {mobileOpen && (
            <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
          )}
        </div>

        <div className="workspace-card">
          <div className="workspace-icon"><BriefcaseBusiness size={16} /></div>
          {sidebarOpen && (
            <div className="workspace-copy">
              <span className="eyebrow">BUSINESS</span>
              <strong>{business.name}</strong>
              <small>{business.industry}</small>
            </div>
          )}
          {sidebarOpen && <ChevronDown size={15} className="muted-icon" />}
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.label;
            return (
              <button
                key={item.label}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  setMobileOpen(false);
                }}
                title={item.label}
              >
                <Icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item"><Settings size={18} />{sidebarOpen && <span>Settings</span>}</button>
          <div className="trust-chip">
            <ShieldAlert size={15} />
            {sidebarOpen && <span>Secure workspace</span>}
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <button className="collapse-btn" onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="page-title-wrap">
              <div className="page-kicker">BUSINESS OVERVIEW</div>
              <h1>{activeNav}</h1>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />
              <input placeholder="Search insights..." />
              <kbd>⌘ K</kbd>
            </div>
            <div className="period-pill"><CalendarDays size={15} /> May 1 – May 31, 2026 <ChevronDown size={14} /></div>
            <button className="icon-btn"><Bell size={17} /></button>
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="content">
          <section className="hero-row">
            <div>
              <div className="eyebrow green">GOOD MORNING</div>
              <h2>Here’s your financial pulse.</h2>
              <p>Track the signals that matter and act before a small warning becomes a bigger problem.</p>
            </div>
            <div className="business-switcher">
              <button className="switcher-btn" onClick={() => setShowBusinessMenu(v => !v)}>
                <span className="switcher-avatar">{business.name.charAt(0)}</span>
                <span className="switcher-text"><strong>{business.name}</strong><small>{business.industry}</small></span>
                <ChevronDown size={16} />
              </button>
              {showBusinessMenu && (
                <div className="business-menu">
                  {businesses.map((b, index) => (
                    <button key={b.name} onClick={() => { setSelectedBusiness(index); setShowBusinessMenu(false); }}>
                      <span className="switcher-avatar small">{b.name.charAt(0)}</span>
                      <span><strong>{b.name}</strong><small>{b.industry}</small></span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="metric-grid">
            <div className="metric-card featured">
              <div className="metric-top"><span>FINANCIAL HEALTH</span><div className="tiny-badge positive"><TrendingUp size={12} /> +6%</div></div>
              <div className="metric-value-row"><strong>{business.health}</strong><span>/ 100</span></div>
              <div className="health-ring-row"><div className="mini-ring" style={{"--progress": `${business.health * 3.6}deg`} as React.CSSProperties}><div>{business.health}%</div></div><div><strong>Healthy position</strong><small>Driven by stable cash flow and margins</small></div></div>
            </div>

            <div className="metric-card">
              <div className="metric-top"><span>CASH BALANCE</span><CircleDollarSign size={16} className="metric-icon green-icon" /></div>
              <div className="metric-value">{currency(business.cash)}</div>
              <div className="metric-foot"><span className="positive-text">+8.5%</span> vs previous month</div>
              <div className="sparkline green-line"><span style={{height: "40%"}}/><span style={{height: "52%"}}/><span style={{height: "47%"}}/><span style={{height: "63%"}}/><span style={{height: "58%"}}/><span style={{height: "79%"}}/><span style={{height: "88%"}}/></div>
            </div>

            <div className="metric-card">
              <div className="metric-top"><span>RISK STATUS</span><ShieldAlert size={16} className="metric-icon" /></div>
              <div className="risk-row"><div className={`risk-pill ${business.risk.toLowerCase()}`}><span />{business.risk}</div></div>
              <div className="metric-foot">No critical warning detected</div>
              <div className="risk-meter"><span className="low"/><span className="medium"/><span className="high"/><span className="critical"/><i style={{left: `${Math.min(93, Math.max(8, 100-business.health))}%`}}/></div>
            </div>

            <div className="metric-card">
              <div className="metric-top"><span>REVENUE</span><WalletCards size={16} className="metric-icon green-icon" /></div>
              <div className="metric-value">{currency(business.revenue)}</div>
              <div className="metric-foot"><span className="positive-text">+9.2%</span> growth this month</div>
              <div className="sparkline blue-line"><span style={{height: "46%"}}/><span style={{height: "58%"}}/><span style={{height: "50%"}}/><span style={{height: "69%"}}/><span style={{height: "65%"}}/><span style={{height: "82%"}}/><span style={{height: "91%"}}/></div>
            </div>
          </section>

          <section className="chart-grid two-thirds">
            <div className="panel large-panel">
              <div className="panel-header">
                <div><h3>Revenue trend</h3><p>Monthly revenue movement</p></div>
                <button className="ghost-btn">Monthly <ChevronDown size={13} /></button>
              </div>
              <div className="chart-stat"><strong>{currency(business.revenue)}</strong><span className="positive-text"><TrendingUp size={14} /> 9.2% vs last month</span></div>
              <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueTrend} margin={{top: 10,right: 10,left: -18,bottom: 0}}>
                <CartesianGrid stroke="#edf3ef" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:11}} tickFormatter={(v)=>`₹${v/100}k`} />
                <Tooltip formatter={(value: number) => [currency(value * 1000), "Revenue"]} cursor={{fill:"#f3f8f5"}} />
                <Bar dataKey="value" radius={[7,7,2,2]} fill="#0d8b62" />
              </BarChart></ResponsiveContainer></div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div><h3>Cash flow</h3><p>Inflow vs outflow</p></div>
                <button className="more-btn"><MoreHorizontal size={18} /></button>
              </div>
              <div className="chart-area compact"><ResponsiveContainer width="100%" height="100%"><AreaChart data={cashFlow} margin={{top: 15,right: 5,left: -18,bottom: 0}}>
                <defs><linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d8b62" stopOpacity={0.22}/><stop offset="100%" stopColor="#0d8b62" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid stroke="#edf3ef" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:9}} tickFormatter={(v)=>`${v/100}k`} />
                <Tooltip formatter={(value: number) => [`₹${value}k`, "Net cash"]} />
                <Area type="monotone" dataKey="net" stroke="#0d8b62" strokeWidth={2.4} fill="url(#cashGradient)" />
              </AreaChart></ResponsiveContainer></div>
              <div className="chart-legend"><span><i className="dot green"/> Net cash</span><span><i className="dot gray"/> Baseline</span></div>
            </div>
          </section>

          <section className="chart-grid three-col">
            <div className="panel">
              <div className="panel-header"><div><h3>Potential risks</h3><p>Signals needing attention</p></div><button className="more-btn"><MoreHorizontal size={18}/></button></div>
              <div className="risk-list">
                <div className="risk-item"><div className="risk-icon warning"><TrendingDown size={15}/></div><div><strong>Receivables growing</strong><small>+12.4% this month</small></div><span className="risk-score orange">61</span></div>
                <div className="risk-item"><div className="risk-icon green"><Activity size={15}/></div><div><strong>Cash flow stable</strong><small>Positive for 5 weeks</small></div><span className="risk-score">89</span></div>
                <div className="risk-item"><div className="risk-icon blue"><CreditCard size={15}/></div><div><strong>Debt manageable</strong><small>18.7% of revenue</small></div><span className="risk-score blue-score">82</span></div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header"><div><h3>Expense mix</h3><p>Current monthly allocation</p></div><button className="more-btn"><MoreHorizontal size={18}/></button></div>
              <div className="donut-wrap"><div className="donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={2}>{expenseBreakdown.map((_,i)=><Cell key={i} fill={["#0d8b62","#43aa7f","#f4ad28","#4f8df7","#bcc9c1"][i]} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>₹980k</strong><small>Total</small></div></div>
                <div className="legend-list">{expenseBreakdown.map((item,i)=><div key={item.name}><span><i style={{background:["#0d8b62","#43aa7f","#f4ad28","#4f8df7","#bcc9c1"][i]}}/>{item.name}</span><strong>{currency(item.value*1000)}</strong></div>)}</div></div>
            </div>

            <div className="panel">
              <div className="panel-header"><div><h3>AI recommendations</h3><p>Based on current signals</p></div><div className="ai-chip"><Bot size={14}/> AI</div></div>
              <div className="recommendations">
                <div className="recommendation"><div className="rec-icon"><Sparkles size={15}/></div><div><strong>Accelerate collections</strong><small>Receivables are up 12.4%. Review overdue invoices and follow-up cadence.</small></div></div>
                <div className="recommendation"><div className="rec-icon green-bg"><CircleDollarSign size={15}/></div><div><strong>Protect liquidity</strong><small>Maintain a buffer while the next 30-day cash cycle plays out.</small></div></div>
                <div className="recommendation"><div className="rec-icon blue-bg"><Zap size={15}/></div><div><strong>Run a what-if check</strong><small>Test a 10–15% revenue drop before committing new spend.</small></div></div>
              </div>
            </div>
          </section>

          <section className="chart-grid two-col-bottom">
            <div className="panel">
              <div className="panel-header"><div><h3>30 / 60 / 90-day cash forecast</h3><p>Historical cash flow transitioning into forecast</p></div><div className="forecast-tag"><Activity size={14}/> Forecast</div></div>
              <div className="chart-area forecast-area"><ResponsiveContainer width="100%" height="100%"><LineChart data={forecast} margin={{top:12,right:8,left:-18,bottom:0}}>
                <CartesianGrid stroke="#edf3ef" vertical={false}/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:10}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fill:"#94a39a",fontSize:9}}/>
                <Tooltip/>
                <Line type="monotone" dataKey="actual" stroke="#0d8b62" strokeWidth={3} dot={{r:3,fill:"#0d8b62"}} connectNulls={false}/>
                <Line type="monotone" dataKey="forecast" stroke="#57b18e" strokeWidth={2.5} strokeDasharray="7 6" dot={false}/>
              </LineChart></ResponsiveContainer></div>
            </div>

            <div className="panel">
              <div className="panel-header"><div><h3>Financial health drivers</h3><p>Why the score is where it is</p></div><button className="ghost-btn">Details <ChevronDown size={13}/></button></div>
              <div className="driver-list">
                {riskDrivers.map((driver) => (
                  <div className="driver-row" key={driver.label}>
                    <div className="driver-label"><span>{driver.label}</span><strong>{driver.score}</strong></div>
                    <div className="driver-track"><span style={{width:`${driver.score}%`,background:driver.color}} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="simulator-banner">
            <div className="simulator-copy"><div className="sim-icon"><Zap size={18}/></div><div><span className="eyebrow green">WHAT-IF SIMULATOR</span><h3>Test decisions before acting on them.</h3><p>Try revenue, expense and collection changes and instantly see the estimated impact on health, risk and cash.</p></div></div>
            <div className="simulator-results">
              <div><small>Health</small><strong>{simulator.health}</strong><span className="positive-text">/100</span></div>
              <div><small>Risk</small><strong className="risk-text">{simulator.risk}</strong></div>
              <div><small>Simulated cash</small><strong>{currency(simulator.cash)}</strong></div>
              <button className="primary-btn">Open simulator <Zap size={15}/></button>
            </div>
          </section>

          <div className="bottom-note"><Database size={13}/> Synthetic/demo values shown for illustration. Connect your backend API to populate real business data.</div>
        </div>
      </main>
    </div>
  );
}

export default App;
