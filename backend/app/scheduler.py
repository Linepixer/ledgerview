import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models.asset import Asset
from app.models.asset_price import AssetPrice
from app.services.price_fetcher import PriceFetcher

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

def fetch_and_save_prices():
    """
    Background job to fetch current prices for all known assets and save them
    into the historical asset_prices table.
    """
    logger.info("Starting daily price fetch job...")
    db: Session = SessionLocal()
    try:
        # Get all distinct assets currently in the database
        assets = db.query(Asset).all()
        
        # Get dollar rates once to ensure consistency
        rates = PriceFetcher.get_dollar_rates()
        usd_to_ars = rates.get("cripto") or rates.get("blue") or rates.get("bolsa") or 1500.0

        for asset in assets:
            if asset.ticker.upper() in ["USD", "USDT", "USDC"]:
                continue # We don't historically track stablecoins to themselves usually, but we could.
                
            prices = PriceFetcher.get_asset_prices(asset.ticker, asset.type)
            if prices:
                price_usd = prices["usd"]
                price_ars = prices["ars"]
                
                new_price = AssetPrice(
                    asset_id=asset.id,
                    price_usd=price_usd,
                    price_ars=price_ars,
                    source="AutoFetcher"
                )
                db.add(new_price)
                logger.info(f"Saved {asset.ticker}: ${price_usd:.2f} USD")
            else:
                logger.warning(f"Failed to fetch price for {asset.ticker}")
                
        db.commit()
        logger.info("Daily price fetch job completed successfully.")
    except Exception as e:
        logger.error(f"Error in daily price fetch job: {e}")
        db.rollback()
    finally:
        db.close()

def warm_up_cache():
    """
    Background job to keep the PriceFetcher cache hot.
    Runs every 1 minute.
    """
    logger.info("Warming up price cache...")
    db: Session = SessionLocal()
    try:
        # Force refresh dollar rates
        PriceFetcher._cache_timestamp = 0
        PriceFetcher.get_dollar_rates()
        
        assets = db.query(Asset).all()
        for asset in assets:
            t = asset.ticker.upper()
            # Force refresh asset price
            PriceFetcher._asset_cache_timestamps[t] = 0
            PriceFetcher.get_asset_prices(asset.ticker, asset.type)
        logger.info("Cache warm up completed.")
    except Exception as e:
        logger.error(f"Error warming up cache: {e}")
    finally:
        db.close()

def start_scheduler():
    # Schedule the job to run every day at 18:00 (Market close)
    scheduler.add_job(
        fetch_and_save_prices,
        CronTrigger(hour=18, minute=0),
        id="daily_price_fetcher",
        name="Fetch and save asset prices daily",
        replace_existing=True
    )
    
    # Schedule the cache warmer to run with a base of 75 seconds and a jitter
    # of up to 15 seconds (oscillates randomly between 60 and 90 seconds)
    scheduler.add_job(
        warm_up_cache,
        IntervalTrigger(seconds=75, jitter=15),
        id="price_cache_warmer",
        name="Keep price cache hot",
        replace_existing=True,
        next_run_time=datetime.now()
    )
    
    scheduler.start()
    logger.info("Scheduler started.")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped.")
