from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.schemas.portfolio import PortfolioSummary
from app.services import portfolio_service
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/portfolio",
    tags=["portfolio"]
)

@router.get("/summary", response_model=PortfolioSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the complete portfolio summary for a given user,
    including current values in ARS and USD, average purchase prices,
    and P&L calculations.
    """
    try:
        return portfolio_service.get_portfolio_summary(db=db, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas.portfolio import PortfolioHistoryResponse

@router.get("/history", response_model=PortfolioHistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the historical daily portfolio value in ARS and USD.
    """
    try:
        return portfolio_service.get_portfolio_history(db=db, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{ticker}", response_model=PortfolioHistoryResponse)
def get_asset_history(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the historical daily portfolio value in ARS and USD for a specific asset.
    """
    try:
        return portfolio_service.get_portfolio_asset_history(db=db, user_id=current_user.id, ticker=ticker)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
