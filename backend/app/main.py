from fastapi import FastAPI

app = FastAPI(title="LedgerView API")

@app.get("/")
def root():
    return {"message": "LedgerView API running"}