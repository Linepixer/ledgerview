from fastapi import FastAPI
from app.api import users, auth

app = FastAPI(title="LedgerView API")

# Incluir las rutas
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "LedgerView API running"}