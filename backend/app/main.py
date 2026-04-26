from fastapi import FastAPI
from app.api import users

app = FastAPI(title="LedgerView API")

# Incluir las rutas de usuarios
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "LedgerView API running"}