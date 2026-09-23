from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(
    title="VyaparAI API",
    description="AI-powered financial early-warning platform for MSMEs",
    version="1.0.0"
)

# Allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# AUTHENTICATION ROUTES (Fixes the "Not Found" error)
# ---------------------------------------------------------
class RegisterReq(BaseModel):
    full_name: str
    business_name: str
    phone: str = None
    business_type: str = None
    email: str
    password: str

class LoginReq(BaseModel):
    email: str
    password: str

@app.post("/api/v1/register")
def register(user: RegisterReq):
    return {"token": "vyaparai-secure-token", "user": {"email": user.email, "name": user.full_name}}

@app.post("/api/v1/login")
def login(user: LoginReq):
    return {"token": "vyaparai-secure-token", "user": {"email": user.email}}

# ---------------------------------------------------------
# DEMO BUSINESS DATA
# ---------------------------------------------------------
business = {
    "id": 1,
    "name": "Demo MSME",
    "revenue": 1000000,
    "expenses": 600000,
    "profit": 400000,
    "cash_balance": 780000,
    "receivables": 240000,
    "payables": 90000,
    "debt": 300000,
    "emi": 25000,
    "inventory": 180000,
}

# ---------------------------------------------------------
# FINANCIAL HEALTH SCORE
# ---------------------------------------------------------
def calculate_health_score(data: Dict[str, Any]) -> int:
    score = 100
    revenue = data["revenue"]
    expenses = data["expenses"]
    cash = data["cash_balance"]
    receivables = data["receivables"]
    debt = data["debt"]
    emi = data["emi"]

    # Expense pressure
    expense_ratio = expenses / max(revenue, 1)
    if expense_ratio > 0.80: score -= 20
    elif expense_ratio > 0.65: score -= 10

    # Cash reserves
    if cash < expenses * 0.5: score -= 20
    elif cash < expenses: score -= 10

    # Receivables pressure
    receivable_ratio = receivables / max(revenue, 1)
    if receivable_ratio > 0.35: score -= 15
    elif receivable_ratio > 0.20: score -= 7

    # Debt pressure
    debt_ratio = debt / max(revenue, 1)
    if debt_ratio > 0.50: score -= 15
    elif debt_ratio > 0.30: score -= 8

    # EMI pressure
    if emi > revenue * 0.05: score -= 10

    return max(0, min(100, int(score)))

def get_risk(score: int) -> str:
    if score >= 80: return "LOW"
    elif score >= 60: return "MEDIUM"
    elif score >= 40: return "HIGH"
    return "CRITICAL"

# ---------------------------------------------------------
# DASHBOARD
# ---------------------------------------------------------
@app.get("/api/v1/dashboard/{business_id}")
def dashboard(business_id: int):
    score = calculate_health_score(business)
    risk = get_risk(score)
    cash_flow = business["revenue"] - business["expenses"]
    return {
        "business": business,
        "health_score": score,
        "risk": risk,
        "cash_flow": cash_flow,
        "top_risks": ["Receivables increasing", "Expense pressure", "Debt obligations"]
    }

# ---------------------------------------------------------
# CASH FLOW FORECAST
# ---------------------------------------------------------
@app.get("/api/v1/forecast/{business_id}")
def forecast(business_id: int):
    return {
        "historical": [420000, 450000, 470000, 430000, 510000, 530000],
        "forecast_30": [540000, 555000, 570000, 585000],
        "forecast_60": [600000, 590000, 575000, 560000],
        "forecast_90": [545000, 520000, 490000, 460000],
        "warning": "Potential cash-flow pressure may emerge within 90 days."
    }

# ---------------------------------------------------------
# WHAT-IF SIMULATOR
# ---------------------------------------------------------
@app.post("/api/v1/simulate")
def simulate(payload: Dict[str, Any]):
    revenue_change = float(payload.get("revenue_change", 0))
    expense_change = float(payload.get("expense_change", 0))
    collection_change = float(payload.get("collection_change", 0))
    new_debt = float(payload.get("new_debt", 0))

    simulated_revenue = business["revenue"] * (1 + revenue_change / 100)
    simulated_expenses = business["expenses"] * (1 + expense_change / 100)
    simulated_cash = business["cash_balance"]
    
    collection_effect = business["receivables"] * (collection_change / 100)
    simulated_cash += collection_effect
    simulated_cash += new_debt
    simulated_debt = business["debt"] + new_debt
    simulated_profit = simulated_revenue - simulated_expenses

    simulated_data = {
        **business,
        "revenue": simulated_revenue,
        "expenses": simulated_expenses,
        "profit": simulated_profit,
        "cash_balance": simulated_cash,
        "debt": simulated_debt
    }

    simulated_score = calculate_health_score(simulated_data)

    return {
        "simulated": {
            "health_score": simulated_score,
            "risk": get_risk(simulated_score),
            "cash_balance": simulated_cash
        }
    }