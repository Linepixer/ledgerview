import json
import urllib.request
import time
import re
from typing import Dict, Optional

class PriceFetcher:
    _cached_rates = None
    _cache_timestamp = 0
    _CACHE_TTL = 60
    _cached_asset_prices = {}
    _asset_cache_timestamps = {}

    @staticmethod
    def _scrape_dolarhoy(url: str) -> Optional[float]:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read().decode()
                match = re.search(r'<div class="value">\$?([\d.,]+)</div>', html)
                if match:
                    val_str = match.group(1).replace(".", "").replace(",", ".")
                    return float(val_str)
        except Exception as e:
            print(f"Warning: DolarHoy Scrape failed for {url}: {e}")
        return None

    @staticmethod
    def _fetch_bitso(book: str) -> Optional[float]:
        url = f"https://api.bitso.com/v3/ticker/?book={book}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                return float(data["payload"]["last"])
        except Exception as e:
            print(f"Warning: Bitso fetch failed for {book}: {e}")
        return None

    @staticmethod
    def get_dollar_rates() -> Dict[str, float]:
        """
        Fetches current ARS/USD exchange rates from DolarHoy and Bitso.
        """
        now = time.time()
        if PriceFetcher._cached_rates and (now - PriceFetcher._cache_timestamp < PriceFetcher._CACHE_TTL):
            return PriceFetcher._cached_rates

        rates = {"bolsa": 1499.0, "cripto": 1541.0, "blue": 1500.0}
        
        # MEP from DolarHoy
        mep = PriceFetcher._scrape_dolarhoy("https://dolarhoy.com/cotizaciondolarbolsa")
        if mep: rates["bolsa"] = mep
            
        # Blue from DolarHoy
        blue = PriceFetcher._scrape_dolarhoy("https://dolarhoy.com/cotizaciondolarblue")
        if blue: rates["blue"] = blue
            
        # Cripto from Bitso (USDT/ARS)
        cripto = PriceFetcher._fetch_bitso("usdt_ars")
        if cripto: rates["cripto"] = cripto

        PriceFetcher._cached_rates = rates
        PriceFetcher._cache_timestamp = now

        return rates

    @staticmethod
    def _scrape_iol_specific(ticker: str) -> Optional[float]:
        # User requested exact URLs for these CEDEARs
        urls = {
            "SPY": "https://iol.invertironline.com/titulo/cotizacion/BCBA/SPY/ETF-SPDR-S-P-500/",
            "SPYD": "https://iol.invertironline.com/titulo/cotizacion/BCBA/SPYD/ETF-SPDR-S-P-500/",
            "QQQ": "https://iol.invertironline.com/titulo/cotizacion/BCBA/QQQ/ETF-INVESCO-QQQ-TRUST/",
            "QQQD": "https://iol.invertironline.com/titulo/cotizacion/BCBA/QQQD/ETF-INVESCO-QQQ-TRUST/",
            "GLD": "https://iol.invertironline.com/titulo/cotizacion/BCBA/GLD/CEDEAR-ETF-SPDR-GOLD-TRUST/",
            "GLDD": "https://iol.invertironline.com/titulo/cotizacion/BCBA/GLDD/CEDEAR-ETF-SPDR-GOLD-TRUST/",
        }
        
        t = ticker.upper()
        # Fallback to dynamic URL if not in dict
        url = urls.get(t, f"https://iol.invertironline.com/titulo/cotizacion/BCBA/{t}/")
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                html = response.read().decode()
                match = re.search(r'data-field="UltimoPrecio">([\d.,]+)<', html)
                if match:
                    val_str = match.group(1).replace(".", "").replace(",", ".")
                    return float(val_str)
        except Exception as e:
            print(f"Warning: IOL Scrape failed for {ticker}: {e}")
        return None

    @staticmethod
    def get_asset_prices(ticker: str, asset_type: str) -> Dict[str, float]:
        t = ticker.upper()
        now = time.time()
        
        # Check cache first
        if t in PriceFetcher._cached_asset_prices:
            if now - PriceFetcher._asset_cache_timestamps.get(t, 0) < PriceFetcher._CACHE_TTL:
                return PriceFetcher._cached_asset_prices[t]
                
        if t in ["USD", "USDT", "USDC"]:
            # Native USD value
            usd = 1.0
            if t == "USD":
                rates = PriceFetcher.get_dollar_rates()
                ars = rates.get("blue") or 1500.0
            else:
                ars = PriceFetcher._fetch_bitso("usdt_ars") or 1500.0
            result = {"usd": usd, "ars": ars}
        else:
            rates = PriceFetcher.get_dollar_rates()
            usd_to_ars = rates.get("cripto") or 1500.0
                
            if asset_type.lower() == "criptomoneda":
                # Fetch USD exact price
                usd = PriceFetcher._fetch_bitso(f"{t.lower()}_usd")
                if usd is None: usd = 0.0
                
                # Fetch ARS exact price if available (like BTC), else fallback to calculation
                ars = PriceFetcher._fetch_bitso(f"{t.lower()}_ars")
                if ars is None: ars = usd * usd_to_ars
                
                result = {"usd": usd, "ars": ars}
            else:
                # Assume it's a CEDEAR or ETF traded in IOL
                ars = PriceFetcher._scrape_iol_specific(t) or 0.0
                usd = PriceFetcher._scrape_iol_specific(t + "D")
                
                if usd is None: usd = ars / usd_to_ars if usd_to_ars else 0.0
                
                result = {"usd": usd, "ars": ars}
            
        # Save to cache
        PriceFetcher._cached_asset_prices[t] = result
        PriceFetcher._asset_cache_timestamps[t] = now
        
        return result
