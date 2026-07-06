from pydantic import BaseModel
from typing import List, Dict, Optional

class PortfolioAsset(BaseModel):
    ticker: str
    name: str
    quantity: float
    
    current_price_ars: float
    current_price_usd: float
    average_purchase_price_ars: float
    average_purchase_price_usd: float
    
    total_value_ars: float
    total_value_usd: float
    
    potential_profit_ars: float
    potential_profit_usd: float
    profit_percentage_ars: float
    profit_percentage_usd: float
    
    portfolio_percentage: float
    target_percentage: float = 0.0

class PortfolioSummary(BaseModel):
    assets: List[PortfolioAsset]
    total_value_ars: float
    total_value_usd: float
    exchange_rates: Dict[str, Optional[float]]

class PortfolioHistoryPoint(BaseModel):
    date: str
    total_value_usd: float
    total_value_ars: float

class PortfolioHistoryResponse(BaseModel):
    history: List[PortfolioHistoryPoint]
