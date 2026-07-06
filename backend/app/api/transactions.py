from fastapi import APIRouter, Depends, HTTPException, status
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
    # Find or create asset
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
    
    # Pydantic ResponseValidationError fix:
    # TransactionResponse expects 'ticker' and 'asset_type', which are not real columns
    # in the Transaction table, so we attach them dynamically to the object before returning it.
    setattr(db_tx, "ticker", tx_in.ticker)
    setattr(db_tx, "asset_type", tx_in.asset_type)
    
    return db_tx

@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all transactions for the user, ordered by timestamp descending (newest first)
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.timestamp.desc()).all()
    
    # We need to attach ticker and asset_type to each for the response model
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
