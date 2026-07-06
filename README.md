# ledgerview
Open-source portfolio tracker for managing investments using a transaction ledger.

## Features
- **Dual Currency Tracking**: Tracks portfolio in both ARS and USD simultaneously.
- **Automated Pricing**: Fetches real-time prices for Stocks (via yfinance), Crypto (via Binance), and Argentina Dollar Exchange Rates (via DolarAPI).
- **Ledger-based**: Your entire portfolio balance and performance are derived accurately from your transaction history.

## Getting Started

## Instrucciones de Ejecución (Desarrollo Local)

Para levantar el proyecto completo en tu entorno local (Windows), abre **tres pestañas de terminal (PowerShell)** en la raíz del proyecto y ejecuta un paso en cada una:

### 1. Base de Datos (PostgreSQL)
```powershell
docker compose up -d
```

### 2. Backend (Servidor Python / FastAPI)
Abre otra terminal y ejecuta:
```powershell
cd backend
venv\Scripts\uvicorn app.main:app --reload
```
*(La API estará disponible en `http://localhost:8000`)*

### 3. Frontend (Interfaz Web en React / Vite)
Abre la última terminal y ejecuta:
```powershell
cd frontend
npm run dev
```
*(Si te da un error de permisos en PowerShell, ejecuta `cmd /c npm run dev`)*

**¡Listo!** Abre tu navegador web en **[http://localhost:5173](http://localhost:5173)** para usar la aplicación.
