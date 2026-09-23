from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Database for the Prototype
db = {
    "business": {
        "id": 1, "user_id": 1, "name": "VyaparAI Workspace",
        "business_type": "Retail", "industry": "Retail", "city": "Indore",
        "monthly_revenue": 0, "monthly_expenses": 0, "current_cash": 0,
        "receivables": 0, "payables": 0, "debt": 0, "employees": 0
    },
    "records": []
}

# Data Models
class LoginReq(BaseModel):
    email: str
    password: str

class RegisterReq(BaseModel):
    full_name: str
    business_name: str
    email: str
    phone: str = None
    password: str
    business_type: str = "Retail"

# --- Authentication Routes ---
@app.post("/api/auth/login")
def login(req: LoginReq):
    return {"access_token": "vyaparai-secure-token", "user": {"id": 1, "full_name": "Admin", "email": req.email}}

@app.post("/api/auth/register")
def register(req: RegisterReq):
    db["business"]["name"] = req.business_name
    db["business"]["industry"] = req.business_type
    return {"access_token": "vyaparai-secure-token", "user": {"id": 1, "full_name": req.full_name, "email": req.email}}

@app.get("/api/auth/me")
def me():
    return {"user": {"id": 1, "full_name": "Admin", "email": "admin@vyaparai.com"}, "business": db["business"]}

@app.post("/api/auth/logout")
def logout():
    return {"message": "Logged out"}

# --- Business Profile Routes ---
@app.get("/api/business")
def get_business():
    return db["business"]

@app.put("/api/business")
def update_business(payload: dict):
    db["business"].update(payload)
    return db["business"]

# --- Financial Records Routes ---
@app.get("/api/financial-records")
def get_records():
    return db["records"]

@app.post("/api/financial-records")
def create_record(payload: dict):
    new_id = len(db["records"]) + 1
    payload["id"] = new_id
    db["records"].append(payload)
    return payload

@app.put("/api/financial-records/{record_id}")
def update_record(record_id: int, payload: dict):
    for i, r in enumerate(db["records"]):
        if r["id"] == record_id:
            payload["id"] = record_id
            db["records"][i] = payload
            return payload
    raise HTTPException(status_code=404, detail="Record not found")

@app.delete("/api/financial-records/{record_id}")
def delete_record(record_id: int):
    db["records"] = [r for r in db["records"] if r["id"] != record_id]
    return {"message": "Deleted"}