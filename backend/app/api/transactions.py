from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.asset import Asset
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"]
)

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.ticker == tx_in.ticker.upper()).first()
    if not asset:
        asset = Asset(
            ticker=tx_in.ticker.upper(),
            name=tx_in.ticker.upper(),
            type=tx_in.asset_type,
            currency="USD"
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

    db_tx = Transaction(
        user_id=current_user.id,
        asset_id=asset.id,
        type=tx_in.type,
        quantity=tx_in.quantity,
        price_per_unit=tx_in.price_per_unit,
        total_value=tx_in.total_value,
        operated_currency=tx_in.operated_currency,
        exchange_rate=tx_in.exchange_rate,
        platform=tx_in.platform,
        notes=tx_in.notes
    )
    if tx_in.timestamp:
        db_tx.timestamp = tx_in.timestamp

    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    
    # Attach fields required by the TransactionResponse schema
    setattr(db_tx, "ticker", tx_in.ticker)
    setattr(db_tx, "asset_type", tx_in.asset_type)
    
    return db_tx

@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_bulk_transactions(
    txs_in: List[TransactionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.exchange_rate import ExchangeRateHistory
    from sqlalchemy import desc

    assets_cache = {}
    created_count = 0
    
    for tx_in in txs_in:
        ticker = tx_in.ticker.upper()
        if ticker not in assets_cache:
            asset = db.query(Asset).filter(Asset.ticker == ticker).first()
            if not asset:
                asset = Asset(
                    ticker=ticker,
                    name=ticker,
                    type=tx_in.asset_type,
                    currency="USD"
                )
                db.add(asset)
                db.commit()
                db.refresh(asset)
            assets_cache[ticker] = asset.id
            
        asset_id = assets_cache[ticker]
        
        exchange_rate = tx_in.exchange_rate
        if not exchange_rate and tx_in.timestamp:
            closest_rate = db.query(ExchangeRateHistory).filter(
                ExchangeRateHistory.rate_type == "historico",
                ExchangeRateHistory.timestamp <= tx_in.timestamp
            ).order_by(desc(ExchangeRateHistory.timestamp)).first()
            
            if closest_rate:
                exchange_rate = closest_rate.rate_value
            else:
                earliest_rate = db.query(ExchangeRateHistory).filter(
                    ExchangeRateHistory.rate_type == "historico"
                ).order_by(ExchangeRateHistory.timestamp).first()
                exchange_rate = earliest_rate.rate_value if earliest_rate else 1
        
        db_tx = Transaction(
            user_id=current_user.id,
            asset_id=asset_id,
            type=tx_in.type,
            quantity=tx_in.quantity,
            price_per_unit=tx_in.price_per_unit,
            total_value=tx_in.total_value,
            operated_currency=tx_in.operated_currency,
            exchange_rate=exchange_rate,
            platform=tx_in.platform,
            notes=tx_in.notes
        )
        if tx_in.timestamp:
            db_tx.timestamp = tx_in.timestamp
            
        db.add(db_tx)
        created_count += 1
        
    db.commit()
    
    return {"message": "Transacciones importadas exitosamente", "count": created_count}

@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.timestamp.desc()).all()
    
    # Attach ticker and asset_type for the response schema
    for tx in transactions:
        setattr(tx, "ticker", tx.asset.ticker if tx.asset else "N/A")
        setattr(tx, "asset_type", tx.asset.type if tx.asset else "Unknown")
        
    return transactions

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
    db.delete(tx)
    db.commit()
