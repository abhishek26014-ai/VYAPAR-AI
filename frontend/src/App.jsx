import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  SlidersHorizontal,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`${API}/api/v1/dashboard/1`)
      .then((response) => response.json())
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Backend connection error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-700 text-xl font-semibold">
          Loading VyaparAI...
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">
          Could not connect to VyaparAI backend.
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Health Score",
      value: dashboard.health_score,
      suffix: "/100",
      icon: Activity,
      positive: true,
    },
    {
      title: "Risk Level",
      value: dashboard.risk,
      icon: AlertTriangle,
      positive: false,
    },
    {
      title: "Cash Flow",
      value: "₹4.0L",
      icon: Wallet,
      positive: true,
    },
    {
      title: "Receivables",
      value: "₹2.4L",
      icon: TrendingUp,
      positive: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#053b2b] text-white p-5">

        <div className="mb-10">
          <h1 className="text-2xl font-bold">
            Vyapar<span className="text-emerald-300">AI</span>
          </h1>

          <p className="text-xs text-emerald-100 mt-1">
            Financial Intelligence Platform
          </p>
        </div>

        <nav className="space-y-2">

          <NavItem
            icon={<LayoutDashboard size={18} />}
            text="Dashboard"
            active
          />

          <NavItem
            icon={<Activity size={18} />}
            text="Financial Health"
          />

          <NavItem
            icon={<AlertTriangle size={18} />}
            text="Risk Analysis"
          />

          <NavItem
            icon={<TrendingUp size={18} />}
            text="Cash Flow Forecast"
          />

          <NavItem
            icon={<AlertTriangle size={18} />}
            text="Anomalies"
          />

          <NavItem
            icon={<Lightbulb size={18} />}
            text="AI Recommendations"
          />

          <NavItem
            icon={<SlidersHorizontal size={18} />}
            text="What-If Simulator"
          />

        </nav>

        <div className="absolute bottom-6 left-5 right-5">

          <div className="rounded-xl bg-emerald-900/60 p-4 border border-emerald-700">

            <p className="text-xs text-emerald-200">
              DEMO MODE
            </p>

            <p className="text-sm font-semibold mt-1">
              Synthetic Business Data
            </p>

          </div>

        </div>

      </aside>


      {/* MAIN */}
      <main className="ml-64">

        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">

          <div>
            <h2 className="text-xl font-bold">
              Financial Overview
            </h2>

            <p className="text-sm text-slate-500">
              Monitor your business health and financial risks.
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
              Demo MSME
            </div>

            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
              A
            </div>

          </div>

        </header>


        {/* CONTENT */}
        <section className="p-8">

          {/* ALERT */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 mb-7">

            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Activity
                  className="text-emerald-700"
                  size={22}
                />
              </div>

              <div className="flex-1">

                <p className="text-xs uppercase tracking-wider text-emerald-700 font-bold">
                  AI Insight
                </p>

                <h3 className="font-semibold mt-1">
                  Your business remains financially stable,
                  but receivables require attention.
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  VyaparAI detected increasing receivables
                  and potential liquidity pressure.
                </p>

              </div>

              <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
                WATCH
              </div>

            </div>

          </div>


          {/* STAT CARDS */}
          <div className="grid grid-cols-4 gap-5 mb-7">

            {stats.map((item) => (
              <StatCard
                key={item.title}
                {...item}
              />
            ))}

          </div>


          {/* CHART + RISK */}
          <div className="grid grid-cols-3 gap-5 mb-7">

            <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-6">

              <div className="flex justify-between items-center mb-6">

                <div>
                  <h3 className="font-bold text-lg">
                    Cash Flow
                  </h3>

                  <p className="text-sm text-slate-500">
                    Historical business cash movement
                  </p>
                </div>

                <div className="text-sm text-emerald-700 font-semibold">
                  +12.4%
                </div>

              </div>

              <div className="h-60 flex items-end gap-4">

                {[40, 52, 46, 63, 56, 71, 68, 84, 76, 91].map(
                  (height, index) => (

                    <div
                      key={index}
                      className="flex-1 h-full flex items-end"
                    >

                      <div
                        className="w-full rounded-t-lg bg-emerald-600 hover:bg-emerald-500 transition"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    </div>

                  )
                )}

              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-3">
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
                <span>W5</span>
                <span>W6</span>
                <span>W7</span>
                <span>W8</span>
              </div>

            </div>


            {/* RISK */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">

              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                Current Risk
              </p>

              <div className="flex items-center justify-between mt-4">

                <div>

                  <p className="text-3xl font-bold text-amber-600">
                    {dashboard.risk}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Financial distress indicator
                  </p>

                </div>

                <div className="w-16 h-16 rounded-full border-8 border-amber-100 border-t-amber-500 flex items-center justify-center">
                  <span className="font-bold text-amber-700">
                    68%
                  </span>
                </div>

              </div>

              <div className="mt-7">

                <p className="text-xs font-bold text-slate-500 uppercase">
                  Top Risk Signals
                </p>

                <div className="space-y-4 mt-4">

                  {dashboard.top_risks.map((risk, index) => (

                    <div
                      key={index}
                      className="flex items-center gap-3"
                    >

                      <div className="w-2 h-2 rounded-full bg-red-500" />

                      <span className="text-sm">
                        {risk}
                      </span>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>


          {/* BOTTOM */}
          <div className="grid grid-cols-3 gap-5">

            <MiniCard
              title="Revenue"
              value="₹10.0L"
              change="+8.2%"
              positive
            />

            <MiniCard
              title="Expenses"
              value="₹6.0L"
              change="+4.5%"
              positive={false}
            />

            <MiniCard
              title="Debt Outstanding"
              value="₹3.0L"
              change="Stable"
              positive
            />

          </div>

        </section>

      </main>

    </div>
  );
}


function NavItem({ icon, text, active }) {

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
        active
          ? "bg-white text-[#053b2b]"
          : "text-emerald-100 hover:bg-emerald-900"
      }`}
    >
      {icon}

      <span className="text-sm font-medium">
        {text}
      </span>
    </div>
  );

}


function StatCard({
  title,
  value,
  suffix,
  icon: Icon,
  positive
}) {

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <div className="flex justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {title}
          </p>

          <div className="mt-2 flex items-end gap-1">

            <span className="text-2xl font-bold">
              {value}
            </span>

            {suffix && (
              <span className="text-sm text-slate-400 mb-1">
                {suffix}
              </span>
            )}

          </div>

        </div>

        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">

          <Icon
            size={20}
            className="text-emerald-700"
          />

        </div>

      </div>

      <div className="flex items-center gap-1 mt-4 text-xs">

        {positive ? (
          <ArrowUpRight
            size={14}
            className="text-emerald-600"
          />
        ) : (
          <ArrowDownRight
            size={14}
            className="text-amber-600"
          />
        )}

        <span
          className={
            positive
              ? "text-emerald-600"
              : "text-amber-600"
          }
        >
          Monitoring
        </span>

      </div>

    </div>
  );

}


function MiniCard({
  title,
  value,
  change,
  positive
}) {

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <div className="flex items-end justify-between mt-2">

        <span className="text-2xl font-bold">
          {value}
        </span>

        <span
          className={
            positive
              ? "text-emerald-600 text-sm font-semibold"
              : "text-amber-600 text-sm font-semibold"
          }
        >
          {change}
        </span>

      </div>

    </div>
  );

}

export default App;
