from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.asset import AssetHistoryResponse, AssetHistoryPoint, AssetWithPriceResponse
from app.models.asset import Asset
from app.models.asset_price import AssetPrice

router = APIRouter(
    prefix="/assets",
    tags=["assets"]
)

@router.get("", response_model=List[AssetWithPriceResponse])
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    result = []
    
    from app.services.price_fetcher import PriceFetcher
    
    for asset in assets:
        # Fetch the live exact prices from PriceFetcher
        prices = PriceFetcher.get_asset_prices(asset.ticker, asset.type)
        price_usd = prices.get("usd", 0.0)
        price_ars = prices.get("ars", 0.0)
        
        result.append(AssetWithPriceResponse(
            id=asset.id,
            ticker=asset.ticker,
            name=asset.name,
            type=asset.type,
            currency=asset.currency,
            current_ratio=asset.current_ratio,
            current_price_usd=price_usd,
            current_price_ars=price_ars
        ))
        
    return result

@router.get("/{ticker}/history", response_model=AssetHistoryResponse)
def get_asset_history(ticker: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.ticker == ticker.upper()).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    prices = db.query(AssetPrice).filter(AssetPrice.asset_id == asset.id).order_by(AssetPrice.timestamp).all()
    
    # Agrupar por dia, tomando el ultimo del dia
    daily_prices = {}
    for p in prices:
        daily_prices[p.timestamp.date()] = p
        
    history = []
    for d in sorted(daily_prices.keys()):
        p = daily_prices[d]
        history.append(AssetHistoryPoint(
            date=d.strftime("%Y-%m-%d"),
            price_usd=float(p.price_usd),
            price_ars=float(p.price_ars)
        ))
        
    return AssetHistoryResponse(
        ticker=asset.ticker,
        name=asset.name,
        history=history
    )
