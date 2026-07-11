import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from collections import defaultdict
from uuid import UUID

from app.models.transaction import Transaction
from app.models.asset import Asset
from app.schemas.portfolio import PortfolioAsset, PortfolioSummary
from app.services.price_fetcher import PriceFetcher

logger = logging.getLogger(__name__)

def get_portfolio_summary(db: Session, user_id: UUID) -> PortfolioSummary:
    rates = PriceFetcher.get_dollar_rates()
    current_usd_to_ars = rates.get("cripto") or rates.get("blue") or rates.get("bolsa") or 1500.0
    
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    assets = db.query(Asset).all()
    asset_map = {a.id: a for a in assets}
    
    # Track total spent in ARS/USD and quantity bought to calculate average purchase price
    asset_data = defaultdict(lambda: {
        "quantity": 0.0,
        "total_spent_ars": 0.0,
        "total_spent_usd": 0.0,
        "quantity_bought": 0.0
    })
    
    for t in transactions:
        qty = float(t.quantity)
        price = float(t.price_per_unit)
        ex_rate = float(t.exchange_rate) if t.exchange_rate else current_usd_to_ars
        op_cur = t.operated_currency.upper() if t.operated_currency else "USD"
        
        # Calculate value of this transaction in both currencies
        if op_cur == "ARS":
            val_ars = qty * price
            val_usd = val_ars / ex_rate if ex_rate else 0
        else:
            val_usd = qty * price
            val_ars = val_usd * ex_rate
            
        if t.type.lower() in ["compra", "intereses"]:
            asset_data[t.asset_id]["quantity"] += qty
            if t.type.lower() == "compra":
                asset_data[t.asset_id]["quantity_bought"] += qty
                asset_data[t.asset_id]["total_spent_ars"] += val_ars
                asset_data[t.asset_id]["total_spent_usd"] += val_usd
        elif t.type.lower() in ["venta", "comisión", "comision"]:
            asset_data[t.asset_id]["quantity"] -= qty
            # but we might want to handle realized gains later.
            
    portfolio_assets = []
    total_portfolio_usd = 0.0
    total_portfolio_ars = 0.0
    
    # Cache fetched prices to minimize redundant API calls
    current_prices: Dict[UUID, float] = {}
    
    for asset_id, data in asset_data.items():
        if data["quantity"] <= 0:
            continue
            
        asset = asset_map.get(asset_id)
        if not asset:
            continue
            
        # Fetch current price (get both exact ARS and USD if possible)
        prices = current_prices.get(asset_id)
        if prices is None:
            prices = PriceFetcher.get_asset_prices(asset.ticker, asset.type)
            current_prices[asset_id] = prices
            
        price_usd = prices["usd"]
        price_ars = prices["ars"]
        
        # Calculate averages
        avg_ars = data["total_spent_ars"] / data["quantity_bought"] if data["quantity_bought"] > 0 else 0
        avg_usd = data["total_spent_usd"] / data["quantity_bought"] if data["quantity_bought"] > 0 else 0
        
        # Totals
        val_ars = data["quantity"] * price_ars
        val_usd = data["quantity"] * price_usd
        
        # Profits
        profit_ars = val_ars - (avg_ars * data["quantity"])
        profit_usd = val_usd - (avg_usd * data["quantity"])
        
        profit_pct_ars = (profit_ars / (avg_ars * data["quantity"]) * 100) if avg_ars > 0 else 0
        profit_pct_usd = (profit_usd / (avg_usd * data["quantity"]) * 100) if avg_usd > 0 else 0
        
        total_portfolio_ars += val_ars
        total_portfolio_usd += val_usd
        
        p_asset = PortfolioAsset(
            ticker=asset.ticker,
            name=asset.name,
            quantity=data["quantity"],
            current_price_ars=price_ars,
            current_price_usd=price_usd,
            average_purchase_price_ars=avg_ars,
            average_purchase_price_usd=avg_usd,
            total_value_ars=val_ars,
            total_value_usd=val_usd,
            potential_profit_ars=profit_ars,
            potential_profit_usd=profit_usd,
            profit_percentage_ars=profit_pct_ars,
            profit_percentage_usd=profit_pct_usd,
            portfolio_percentage=0.0
        )
        portfolio_assets.append(p_asset)
        
    for pa in portfolio_assets:
        if total_portfolio_usd > 0:
            pa.portfolio_percentage = (pa.total_value_usd / total_portfolio_usd) * 100
            
    return PortfolioSummary(
        assets=portfolio_assets,
        total_value_ars=total_portfolio_ars,
        total_value_usd=total_portfolio_usd,
        exchange_rates=rates
    )

from datetime import datetime, timedelta
from app.models.asset_price import AssetPrice
from app.schemas.portfolio import PortfolioHistoryResponse, PortfolioHistoryPoint

def get_portfolio_history(db: Session, user_id: UUID) -> PortfolioHistoryResponse:
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.timestamp).all()
    if not transactions:
        return PortfolioHistoryResponse(history=[])
        
    prices = db.query(AssetPrice).order_by(AssetPrice.timestamp).all()
    
    # We will compute daily values from the first transaction to today
    start_date = transactions[0].timestamp.date()
    end_date = datetime.now().date()
    
    # Map latest prices by date
    daily_prices = defaultdict(dict)
    for p in prices:
        d = p.timestamp.date()
        daily_prices[d][p.asset_id] = {
            "usd": float(p.price_usd),
            "ars": float(p.price_ars)
        }
        
    # Group transactions by date
    daily_txs = defaultdict(list)
    for t in transactions:
        daily_txs[t.timestamp.date()].append(t)
        
    history = []
    current_balances = defaultdict(float)
    last_known_prices = {}
    
    current_date = start_date
    while current_date <= end_date:
        # Apply transactions for this date
        for t in daily_txs.get(current_date, []):
            qty = float(t.quantity)
            if t.type.lower() in ["compra", "intereses"]:
                current_balances[t.asset_id] += qty
            elif t.type.lower() in ["venta", "comisión", "comision"]:
                current_balances[t.asset_id] -= qty
                
        # Update last known prices
        if current_date in daily_prices:
            for asset_id, p_data in daily_prices[current_date].items():
                last_known_prices[asset_id] = p_data
                
        # Calculate portfolio value
        val_usd = 0.0
        val_ars = 0.0
        for asset_id, qty in current_balances.items():
            if qty > 0:
                p_data = last_known_prices.get(asset_id)
                if p_data:
                    val_usd += qty * p_data["usd"]
                    val_ars += qty * p_data["ars"]
                    
        history.append(PortfolioHistoryPoint(
            date=current_date.strftime("%Y-%m-%d"),
            total_value_usd=val_usd,
            total_value_ars=val_ars
        ))
        
        current_date += timedelta(days=1)
        
    # Overwrite the last data point with the live summary to ensure chart consistency with dashboard totals.
    if history and history[-1].date == end_date.strftime("%Y-%m-%d"):
        summary = get_portfolio_summary(db, user_id)
        history[-1].total_value_usd = summary.total_value_usd
        history[-1].total_value_ars = summary.total_value_ars
        
    return PortfolioHistoryResponse(history=history)

from fastapi import HTTPException

def get_portfolio_asset_history(db: Session, user_id: UUID, ticker: str) -> PortfolioHistoryResponse:
    asset = db.query(Asset).filter(func.upper(Asset.ticker) == ticker.upper()).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    transactions = db.query(Transaction).filter(
        Transaction.user_id == user_id, 
        Transaction.asset_id == asset.id
    ).order_by(Transaction.timestamp).all()
    
    if not transactions:
        return PortfolioHistoryResponse(history=[])
        
    prices = db.query(AssetPrice).filter(AssetPrice.asset_id == asset.id).order_by(AssetPrice.timestamp).all()
    
    # We will compute daily values from the first transaction to today
    start_date = transactions[0].timestamp.date()
    end_date = datetime.now().date()
    
    # Map prices by date
    daily_prices = defaultdict(dict)
    for p in prices:
        d = p.timestamp.date()
        daily_prices[d][p.asset_id] = {
            "usd": float(p.price_usd),
            "ars": float(p.price_ars)
        }
        
    # Group transactions by date
    daily_txs = defaultdict(list)
    for t in transactions:
        daily_txs[t.timestamp.date()].append(t)
        
    history = []
    current_balances = defaultdict(float)
    last_known_prices = {}
    
    current_date = start_date
    while current_date <= end_date:
        # Apply transactions for this date
        for t in daily_txs.get(current_date, []):
            qty = float(t.quantity)
            if t.type.lower() in ["compra", "intereses"]:
                current_balances[t.asset_id] += qty
            elif t.type.lower() in ["venta", "comisión", "comision"]:
                current_balances[t.asset_id] -= qty
                
        # Update last known prices
        if current_date in daily_prices:
            for asset_id, p_data in daily_prices[current_date].items():
                last_known_prices[asset_id] = p_data
                
        # Calculate portfolio value
        val_usd = 0.0
        val_ars = 0.0
        for asset_id, qty in current_balances.items():
            if qty > 0:
                p_data = last_known_prices.get(asset_id)
                if p_data:
                    val_usd += qty * p_data["usd"]
                    val_ars += qty * p_data["ars"]
                    
        history.append(PortfolioHistoryPoint(
            date=current_date.strftime("%Y-%m-%d"),
            total_value_usd=val_usd,
            total_value_ars=val_ars
        ))
        
        current_date += timedelta(days=1)
        
    # Overwrite the last data point with the live summary to ensure chart consistency.
    if history and history[-1].date == end_date.strftime("%Y-%m-%d"):
        summary = get_portfolio_summary(db, user_id)
        # Find the specific asset in the summary
        target_asset = next((a for a in summary.assets if a.ticker.upper() == ticker.upper()), None)
        if target_asset:
            history[-1].total_value_usd = target_asset.total_value_usd
            history[-1].total_value_ars = target_asset.total_value_ars
        else:
            history[-1].total_value_usd = 0.0
            history[-1].total_value_ars = 0.0
        
    return PortfolioHistoryResponse(history=history)
