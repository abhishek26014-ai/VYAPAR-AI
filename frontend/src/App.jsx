import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  TrendingUp,
  SlidersHorizontal,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Calendar,
  FileText
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const API = "https://vyaparai-fkhz.onrender.com";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulator levers
  const [revChange, setRevChange] = useState(0);
  const [expChange, setExpChange] = useState(0);
  const [collectionChange, setCollectionChange] = useState(0);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, foreRes] = await Promise.all([
        fetch(`${API}/api/v1/dashboard/1`),
        fetch(`${API}/api/v1/forecast/1`),
      ]);
      const dash = await dashRes.json();
      const fore = await foreRes.json();

      setDashboard(dash);

      const chartPoints = [
        ...(fore.historical || []).map((val, idx) => ({
          month: `M${idx + 1}`,
          cash: val,
        })),
        ...(fore.forecast_90 || []).map((val, idx) => ({
          month: `M+${idx + 1}`,
          cash: val,
        })),
      ];
      setForecastData(chartPoints);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  const handleSimulate = async () => {
    try {
      const res = await fetch(`${API}/api/v1/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revenue_change: revChange,
          expense_change: expChange,
          collection_change: collectionChange,
          new_debt: 0,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  useEffect(() => {
    if (revChange !== 0 || expChange !== 0 || collectionChange !== 0) {
      handleSimulate();
    } else {
      setSimResult(null);
    }
  }, [revChange, expChange, collectionChange]);

  const formatCurrency = (val) => `₹${Math.round(val || 0).toLocaleString()}`;

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-800 font-semibold">
        Loading VyaparAI Engine...
      </div>
    );
  }

  const { business, health_score, risk, top_risks } = dashboard;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "health", label: "Financial Health", icon: Activity },
    { id: "risk", label: "Risk Analysis", icon: AlertTriangle },
    { id: "forecast", label: "Cash Flow Forecast", icon: TrendingUp },
    { id: "anomalies", label: "Anomalies", icon: ShieldAlert },
    { id: "recommendations", label: "AI Recommendations", icon: Sparkles },
    { id: "simulator", label: "What-If Simulator", icon: SlidersHorizontal },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-[#053b2b] text-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              Vyapar<span className="text-emerald-300">AI</span>
            </h1>
          </div>
          <p className="text-xs text-emerald-100/70 mt-1">Financial Intelligence Platform</p>

          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-emerald-800/80 text-white shadow-sm font-semibold"
                      : "text-emerald-100/80 hover:bg-emerald-800/30"
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="bg-[#03291e] p-3 rounded-lg text-xs text-emerald-200/80 border border-emerald-900/50">
          <p className="font-semibold uppercase tracking-wider text-[10px] text-emerald-400">Target MSME</p>
          <p className="mt-1 font-bold text-white">{business.name}</p>
          <p>ID: #{business.id}</p>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label || "Overview"}
            </h2>
            <p className="text-sm text-slate-500">Early-warning indicators and real-time business diagnostics</p>
          </div>
          <span className="bg-amber-100 border border-amber-300 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <FileWarning size={14} /> Synthetic Demo Mode
          </span>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">Health Score</div>
                <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {health_score} <span className="text-sm font-normal text-slate-400">/100</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                <div className="text-xs font-semibold uppercase text-slate-500">Distress Risk</div>
                <div className="mt-2 text-2xl font-extrabold text-emerald-700">{risk}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">Cash Balance</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatCurrency(business.cash_balance)}</div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-semibold uppercase text-slate-500">Receivables</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">{formatCurrency(business.receivables)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" /> Cash Flow Forecast (90 Days)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                      <Area type="monotone" dataKey="cash" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" /> Active Risk Warnings
                </h3>
                <div className="space-y-3">
                  {top_risks.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs font-medium text-slate-700">
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FINANCIAL HEALTH TAB */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-36 h-36 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                <span className="text-4xl font-extrabold text-emerald-700">{health_score}</span>
              </div>
              <h3 className="text-xl font-bold mt-4">Solvency Rating: Strong</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">Weighted metric evaluating liquidity runway, debt-to-revenue ratios, and margin coverage.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Health Breakdown</h3>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Operating Cash Ratio</span>
                  <span className="font-semibold text-emerald-600">88%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[88%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Receivable Collection Health</span>
                  <span className="font-semibold text-amber-500">65%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[65%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Debt Coverage Ratio</span>
                  <span className="font-semibold text-emerald-600">92%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RISK ANALYSIS TAB */}
        {activeTab === "risk" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-2">Random Forest Risk Classification</h3>
              <p className="text-sm text-slate-500 mb-4">Probability of entering liquidity distress over the next 90 days.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-xs text-emerald-800 font-semibold uppercase">30-Day Probability</span>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">8.2% (Low)</div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600 font-semibold uppercase">60-Day Probability</span>
                  <div className="text-2xl font-bold text-slate-800 mt-1">14.1% (Low)</div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs text-amber-800 font-semibold uppercase">90-Day Probability</span>
                  <div className="text-2xl font-bold text-amber-900 mt-1">21.5% (Moderate)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASH FLOW FORECAST TAB */}
        {activeTab === "forecast" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Projected vs Historical Working Capital</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 12 }} />
                  <RechartsTooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Area type="monotone" dataKey="cash" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ANOMALIES TAB */}
        {activeTab === "anomalies" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Isolation Forest Outlier Detection</h3>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Receivables Expansion Spurt</h4>
                  <p className="text-xs text-amber-700 mt-0.5">Accounts receivable escalated 18% above typical 3-month variance.</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-amber-200 text-amber-800 rounded">Moderate Alert</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Operating Discretionary Expenditure</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Recurring vendor outflows align within historical bounds.</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded">Normal Range</span>
              </div>
            </div>
          </div>
        )}

        {/* AI RECOMMENDATIONS TAB */}
        {activeTab === "recommendations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">High Priority</span>
                <h4 className="font-bold text-base text-slate-900 mt-3">Expedite Receivables Collections</h4>
                <p className="text-sm text-slate-600 mt-2">
                  Offer a 2% early settlement discount on invoices exceeding 30 days to free up liquid working capital.
                </p>
              </div>
              <button onClick={() => setActiveTab("simulator")} className="mt-4 text-emerald-700 font-semibold text-sm hover:underline text-left">
                Test in What-If Simulator →
              </button>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">Optimization</span>
                <h4 className="font-bold text-base text-slate-900 mt-3">Reserve Buffering</h4>
                <p className="text-sm text-slate-600 mt-2">
                  Maintain current cash buffer of {formatCurrency(business.cash_balance)} to protect upcoming EMI commitments.
                </p>
              </div>
              <button onClick={() => setActiveTab("simulator")} className="mt-4 text-emerald-700 font-semibold text-sm hover:underline text-left">
                Test in What-If Simulator →
              </button>
            </div>
          </div>
        )}

        {/* WHAT-IF SIMULATOR TAB */}
        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-800">Adjust Levers</h3>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenue Change</span>
                  <span className="font-bold text-emerald-600">{revChange > 0 ? `+${revChange}` : revChange}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={revChange}
                  onChange={(e) => setRevChange(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Expense Change</span>
                  <span className="font-bold text-red-500">{expChange > 0 ? `+${expChange}` : expChange}%</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={expChange}
                  onChange={(e) => setExpChange(Number(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Expedite Receivables Collection</span>
                  <span className="font-bold text-emerald-600">+{collectionChange}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={collectionChange}
                  onChange={(e) => setCollectionChange(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-xl flex flex-col justify-center gap-6">
              <h3 className="text-xl font-bold">Simulated Recalculation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase">Simulated Health</span>
                  <div className="text-4xl font-extrabold text-emerald-400 mt-1">
                    {simResult ? simResult.simulated.health_score : health_score}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase">Simulated Risk</span>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {simResult ? simResult.simulated.risk : risk}
                  </div>
                </div>
                <div className="col-span-2 pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-400 uppercase">Projected Cash Balance</span>
                  <div className="text-2xl font-bold text-slate-200 mt-1">
                    {formatCurrency(simResult ? simResult.simulated.cash_balance : business.cash_balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}