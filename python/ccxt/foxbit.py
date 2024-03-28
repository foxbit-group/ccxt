from ccxt.base.exchange import Exchange
from ccxt.abstract.foxbit import ImplicitAPI
from ccxt.base.decimal_to_precision import TICK_SIZE
from ccxt.base.types import Strings, Ticker, Tickers, Int, OrderBook, Trade, Balances
from datetime import datetime
from typing import List
import hmac
import hashlib

class foxbit(Exchange, ImplicitAPI):

    def describe(self):
        return self.deep_extend(super(foxbit, self).describe(), {
            'id': 'foxbit',
            'name': 'Foxbit',
            'countries': ['BR'],
            'rateLimit': 33.34,
            'version': 'v3',
            'certified': True,
            'pro': False,
            'has': {
                'CORS': None,
                'spot': False,
                'margin': True,
                'swap': True,
                'future': False,
                'option': False,
                'borrowCrossMargin': False,
                'borrowIsolatedMargin': False,
                'cancelAllOrders': True,
                'cancelOrder': True,
                'cancelOrders': False,
                'createMarketBuyOrderWithCost': True,
                'createMarketOrderWithCost': False,
                'createMarketSellOrderWithCost': False,
                'createOrder': True,
                'createPostOnlyOrder': True,
                'createStopLimitOrder': False,
                'createStopMarketOrder': False,
                'createStopOrder': False,
                'createTrailingPercentOrder': True,
                'fetchBalance': True,
                'fetchBorrowInterest': True,
                'fetchBorrowRateHistories': False,
                'fetchBorrowRateHistory': False,
                'fetchCanceledOrders': True,
                'fetchClosedOrders': True,
                'fetchCrossBorrowRate': False,
                'fetchCrossBorrowRates': False,
                'fetchCurrencies': True,
                'fetchDeposit': True,
                'fetchDepositAddress': True,
                'fetchDepositAddresses': False,
                'fetchDepositAddressesByNetwork': False,
                'fetchDeposits': True,
                'fetchDepositWithdrawFee': True,
                'fetchDepositWithdrawFees': False,
                'fetchFundingHistory': None,
                'fetchFundingRate': True,
                'fetchFundingRateHistory': False,
                'fetchFundingRates': False,
                'fetchIsolatedBorrowRate': True,
                'fetchIsolatedBorrowRates': True,
                'fetchLiquidations': False,
                'fetchMarginMode': False,
                'fetchMarkets': True,
                'fetchMyLiquidations': True,
                'fetchMyTrades': True,
                'fetchOHLCV': True,
                'fetchOpenInterest': True,
                'fetchOpenInterestHistory': False,
                'fetchOpenOrders': True,
                'fetchOrder': True,
                'fetchOrderBook': True,
                'fetchOrders': False,
                'fetchOrderTrades': True,
                'fetchPosition': True,
                'fetchPositionMode': False,
                'fetchPositions': True,
                'fetchStatus': True,
                'fetchTicker': True,
                'fetchTickers': True,
                'fetchTime': True,
                'fetchTrades': True,
                'fetchTradingFee': True,
                'fetchTradingFees': False,
                'fetchTransactionFee': True,
                'fetchTransactionFees': False,
                'fetchTransfer': False,
                'fetchTransfers': True,
                'fetchWithdrawAddressesByNetwork': False,
                'fetchWithdrawal': True,
                'fetchWithdrawals': True,
                'reduceMargin': False,
                'repayCrossMargin': False,
                'repayIsolatedMargin': True,
                'setLeverage': True,
                'setMarginMode': False,
                'transfer': True,
                'withdraw': True,
            },
            'hostname': 'foxbit.com.br',
            'urls': {
                'logo': 'https://docs.foxbit.com.br/rest/v3/logo-with-text.svg',
                'api': {
                    'rest': 'https://api.{hostname}/rest/v3', 
                },
                'www': 'https://www.{hostname}/',
                'doc': 'https://docs.{hostname}/rest/v3/',
                'referral': {
                    'url': '',
                    'discount': 0.0,
                },
                'fees': 'https://{hostname}/taxas/',
            },
            'requiredCredentials': {
                'apiKey': True,
                'secret': True,
                'uid': False,
            },
            'api': {
                'public': {
                    'get': {
                        'currencies': 6,
                        'markets': 6,
                        'markets/quotes': 2,
                        'markets/{market_symbol}/orderbook': 10,
                        'markets/{market_symbol}/candlesticks': 10
                    },
                },
                'private': {},
            },
            'timeframes': {
                '1m': 1,
                '5m': 5,
                '15m': 15,
                '30m': 30,
                '1h': 60,
                '2h': 120,
                '4h': 240,
                '1d': 1440,
                '1w': 10080,
            },
            'fees': {
                'trading': {
                    'tierBased': True,
                    'percentage': True,
                    'taker': self.parse_number('0.0020'),
                    'maker': self.parse_number('0.0050'),
                    'tiers': {},
                },
            },
            'precisionMode': TICK_SIZE,
            'exceptions': {},
            'commonCurrencies': {},
            'options': {
                'defaultNetwork': 'ERC20',
                'defaultNetworks': {
                    'USDT': 'ERC20',
                },
                'networks': {},
                'defaultType': 'spot', 
                'fetchBalance': {},
                'accountsByType': {},
                'createMarketBuyOrderRequiresPrice': True,
                'brokerId': '',
            },
        })
    
    def fetch_markets(self, params={}):
        response = self.publicGetMarkets(params)
        
        data = self.safe_value(response, 'data', [])
        return self.parse_markets(data)

    def fetch_currencies(self, params={}):
        response = self.publicGetCurrencies(params)
        
        data = self.safe_value(response, 'data', [])
        return self.parse_currencies(data)
    
    def fetch_trading_limits(self, symbols: Strings = None, params={}):
        '''EXPECTED RETURN
            {
                "ETH/BTC": {
                    "info": {
                        "symbol": "ethbtc",
                        "buy-limit-must-less-than": "1.1",
                        "buy-limit-must-greater-than": "0.1",
                        "sell-limit-must-less-than": "10",
                        "sell-limit-must-greater-than": "0.9",
                        "limit-order-must-greater-than": "0.001",
                        "limit-order-must-less-than": "10000",
                        "limit-buy-amount-must-less-than": "10000",
                        "limit-sell-amount-must-less-than": "10000",
                        "market-buy-order-must-greater-than": "0.0001",
                        "market-sell-amount-must-less-than": "0.0001",
                        "market-buy-volume-must-greater-than": "0.0001",
                        "market-sell-volume-must-less-than": "0.0001",
                        "market-bs-calc-max-scale": "1",
                        "market-buy-order-must-less-than": "100",
                        "market-sell-order-must-greater-than": "0.001",
                        "market-sell-order-must-less-than": "1000",
                        "limit-order-before-open-greater-than": "999999999",
                        "limit-order-before-open-less-than": "0",
                        "circuit-break-when-greater-than": "100",
                        "circuit-break-when-less-than": "10",
                        "order-must-less-than": "0",
                        "market-sell-order-rate-must-less-than": "0.1",
                        "market-buy-order-rate-must-less-than": "0.1",
                        "market-order-disabled-start-time": "0",
                        "market-order-disabled-end-time": "0",
                        "limit-order-limit-price-start-time": "0",
                        "limit-order-limit-price-end-time": "0",
                        "limit-order-limit-price-greater-than": None,
                        "limit-order-limit-price-less-than": None,
                        "equity-deviation-rate": None,
                        "equity-deviation-rate-buy": None,
                        "equity-deviation-rate-sell": None,
                        "market-equity-deviation-rate": None,
                        "market-equity-deviation-rate-buy": None,
                        "market-equity-deviation-rate-sell": None,
                        "equity-deviation-rate-switch": "0",
                        "market-equity-deviation-rate-switch": "0",
                        "limit-order-switch": "0",
                        "limit-order-buy-offset": "0",
                        "market-order-switch": "0",
                        "market-order-buy-offset": "0",
                        "updated-at": "1611743119000"
                    },
                    "limits": {
                        "amount": {
                            "min": 0.001,
                            "max": 10000.0
                        }
                    }
                }
            }          
        '''
      
        self.load_markets()
        
        if symbols is None:
            symbols = self.symbols
        
        result = {}
        
        for symbol in symbols:
            result[symbol] = self.parse_trading_by_market(self.market(symbol), params) 

        return result
    
    def fetch_ticker(self, symbol: str, params={}) -> Ticker:
        if symbol is None:
            symbol = self.symbol

        interval = "1d"

        if params.get("interval", None):
            interval = params["interval"]
        
        self.load_markets()
        market = self.market_id(symbol)

        request = {
            'market_symbol': market,
            'interval': interval,
            'limit': 1
        }

        response =  self.publicGetTicker(self.extend(request, params))

        return self.parse_ticker(response[0], symbol)

    def fetch_tickers(self, symbols: Strings = None, params={}) -> Tickers:
        ...

    def fetch_trading_fees(self, params={}):
        """
            NOT ROUTE TO FEE
        """
        self.load_markets()
        result = {}
        
        for symbol in self.symbols:
            result[symbol] = {
                'info': {},
                'symbol': symbol,
                'maker': None,
                'taker': None,
                'percentage': True,
                'tierBased': True,
            }
        
        return result

    def fetch_order_book(self, symbol: str, limit: int = 1, params={}) -> OrderBook:
        self.load_markets()        
        market = self.market_id(symbol)

        request = {
            'market_symbol': market,
            'depth': limit
        }

        response = self.publicGetOrderBook(self.extend(request, params))
        return self.parse_order_book(response, symbol, None, 'bids', 'asks', 0, 1)

    def fetch_trades(self, symbol: str, since: Int = None, limit: Int = None, params={}) -> List[Trade]:
        ...

    def fetch_ohlcv(self, symbol: str, timeframe='1m', since: Int = None, limit: int = 1, params={}) -> List[list]:
        """
            SETTINGS POSITION 5 VOLUME
        """
        self.load_markets()
        
        market = self.market(symbol)
        
        request = {
            'interval': timeframe,
            'market_symbol': market['id'],
            'limit': limit
        }
        response = self.publicGetTicker(self.extend(request, params))

        return self.parse_ohlcvs(response, market, timeframe, since, limit)

    # PRIVATE

    def fetch_balance(self, params={})-> Balances:
        self.load_markets()
        response = self.privateGetBalance(params)

        result = { 'info': response }

        for account in response['data']:
            result[account['currency_symbol'].upper()] = self.parse_balance(account)
        
        return result

    def create_order(self, params={}):
        ...

    def cancel_order(self, params={}):
        ...

    def fetch_order(self, params={}):
        ...

    def fetch_orders(self, params={}):
        ...

    def fetch_open_orders(self, params={}):
        ...
    
    def fetch_close_orders(self, params={}):
        ...

    def fetch_my_trades(self, params={}):
        ...

    def deposit(self, params={}):
        ...

    def withdraw(self, params={}):
        ...

        
    # PARSER

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        url = self.implode_hostname(self.urls['api']['rest']) + '/' + self.implode_params(path, params)
        headers = { 'Content-Type': 'application/json' }

        if api == "private":
            format_url = url.split("?")
            query_params = ""
            try:
                query_params = format_url[1]
            except:
                ... 

            payload = {
                "method": method,
                "url": f"/rest/v3/{path}",
                "query": query_params
            }
            
            timestamp = self.__timestamp_now()

            prehash = f"{timestamp}{payload['method']}{payload['url']}{payload['query']}"

            secret_key = bytes(self.secret, "utf-8")
        
            hash = hmac.new(
                secret_key, 
                prehash.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            headers['X-FB-ACCESS-KEY']       = self.apiKey
            headers['X-FB-ACCESS-TIMESTAMP'] = timestamp
            headers['X-FB-ACCESS-SIGNATURE'] = str(hash)

            if method == "GET":
                return {'url': url, 'method': method, 'body': None, 'headers': headers}
            
            elif method == "POST":
                return {'url': url, 'method': method, 'body': body, 'headers': headers}


            
        
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

    def __timestamp_now(self):
        return str(
            datetime.now().timestamp()
        ).split('.')[0]
    
    def parse_markets(self, markets):
        result = []

        for market in markets:
            base = market['base']
            quote = market['quote']
            
            result.append({                              
                'id':      market['symbol'],      
                'symbol':  f"{base['symbol'].upper()}/{quote['symbol'].upper()}",     
                'base':    base["symbol"],         
                'quote':   quote["symbol"],         
                'baseId':  base["symbol"],         
                'quoteId':  quote["symbol"],        
                'active':   True,         
                'type':    'spot',        
                'spot':     True,         
                'margin':   True,         
                'future':   False,                                      
                'swap':     False,                                      
                'option':   False,                                      
                'contract': False,                                 
                'settle':   quote["symbol"].lower(),                                
                'settleId': quote["symbol"],                                
                'contractSize': 1,                                 
                'linear':   True,                                  
                'inverse':  False,                                 
                'expiry':  None,                          
                'expiryDatetime': '',      
                'strike': 4000,                                    
                'optionType': 'call',                             
                'taker':    0.002,                                 
                'maker':    0.005,                                
                'percentage': True,                                
                'tierBased': False,                                
                'feeSide': 'get',                                  
                'precision': {                                     
                    'price': 8,                                    
                    'amount': 8,                                   
                    'cost': 8,                                          
                },
                'limits': {                                             
                    'amount': {
                        'min': market['price_min'],                                    
                        'max': 0,                                    
                    },
                    'price': {},                                   
                    'cost':  {},                                   
                    'leverage': {},                                
                },
                'info': market
            })
        return result

    def parse_currencies(self, currencies):
        result = {}
        '''EXPECTED RESPONSE
            {
                "BTC": {
                    "info": {
                        "coinId": "1",
                        "coin": "BTC",
                        "transfer": "true",
                        "chains": [
                            {
                                "chain": "BTC",
                                "needTag": "false",
                                "withdrawable": "true",
                                "rechargeable": "true",
                                "withdrawFee": "0.00015",
                                "extraWithdrawFee": "0",
                                "depositConfirm": "1",
                                "withdrawConfirm": "1",
                                "minDepositAmount": "0.00001",
                                "minWithdrawAmount": "0.001",
                                "browserUrl": "https://blockchair.com/bitcoin/transaction/",
                                "contractAddress": None,
                                "withdrawStep": "0"
                            },
                            {
                                "chain": "BEP20",
                                "needTag": "false",
                                "withdrawable": "false",
                                "rechargeable": "true",
                                "withdrawFee": "0.00000305",
                                "extraWithdrawFee": "0",
                                "depositConfirm": "15",
                                "withdrawConfirm": "15",
                                "minDepositAmount": "0.000001",
                                "minWithdrawAmount": "0.0000078",
                                "browserUrl": "https://bscscan.com/tx/",
                                "contractAddress": "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
                                "withdrawStep": "0"
                            }
                        ],
                        "areaCoin": "no"
                    },
                    "id": "1",
                    "code": "BTC",
                    "networks": {
                        "BTC": {
                            "info": {
                                "chain": "BTC",
                                "needTag": "false",
                                "withdrawable": "true",
                                "rechargeable": "true",
                                "withdrawFee": "0.00015",
                                "extraWithdrawFee": "0",
                                "depositConfirm": "1",
                                "withdrawConfirm": "1",
                                "minDepositAmount": "0.00001",
                                "minWithdrawAmount": "0.001",
                                "browserUrl": "https://blockchair.com/bitcoin/transaction/",
                                "contractAddress": None,
                                "withdrawStep": "0"
                            },
                            "id": "BTC",
                            "network": "BTC",
                            "limits": {
                                "withdraw": {
                                    "min": 0.001,
                                    "max": None
                                },
                                "deposit": {
                                    "min": 1e-05,
                                    "max": None
                                }
                            },
                            "active": True,
                            "withdraw": True,
                            "deposit": True,
                            "fee": 0.00015,
                            "precision": None
                        },
                        "BEP20": {
                            "info": {
                                "chain": "BEP20",
                                "needTag": "false",
                                "withdrawable": "false",
                                "rechargeable": "true",
                                "withdrawFee": "0.00000305",
                                "extraWithdrawFee": "0",
                                "depositConfirm": "15",
                                "withdrawConfirm": "15",
                                "minDepositAmount": "0.000001",
                                "minWithdrawAmount": "0.0000078",
                                "browserUrl": "https://bscscan.com/tx/",
                                "contractAddress": "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c",
                                "withdrawStep": "0"
                            },
                            "id": "BEP20",
                            "network": "BEP20",
                            "limits": {
                                "withdraw": {
                                    "min": 7.8e-06,
                                    "max": None
                                },
                                "deposit": {
                                    "min": 1e-06,
                                    "max": None
                                }
                            },
                            "active": False,
                            "withdraw": False,
                            "deposit": True,
                            "fee": 3.05e-06,
                            "precision": None
                        }
                    },
                    "type": None,
                    "name": None,
                    "active": True,
                    "deposit": True,
                    "withdraw": True,
                    "fee": 3.05e-06,
                    "precision": None,
                    "limits": {
                        "amount": {
                            "min": None,
                            "max": None
                        },
                        "withdraw": {
                            "min": 7.8e-06,
                            "max": None
                        },
                        "deposit": {
                            "min": 1e-06,
                            "max": None
                        }
                    },
                    "created": None
                }
            }        
        '''

        for currency in currencies:
            result[currency['symbol'].upper()] = self.parse_currency(currency)   

        return result     

    def parse_currency(self, currency):
        fee = '0.0'
        if not currency['withdraw_info'] is None:
            fee = currency['withdraw_info']['fee']
        
        return {
            'id':       currency['symbol'],   
            'code':     currency['symbol'].upper(),   
            'name':     currency['name'],   
            'active':    True,  
            'fee':       fee,  
            'precision': currency['precision'],  
            'deposit':   True, 
            'withdraw':  True,  
            'limits': {   
                'amount': {
                    'min': 0.01,  
                    'max': 1000,  
                },
                'withdraw': { ... },   
                'deposit': {...},
            },
            'networks': {...},
            'info': { ... }
        }

    def parse_trading_by_market(self, market, params):
        return {
            "info": {
                "symbol": market['id'],
                "buy-limit-must-less-than": "1.1",
                "buy-limit-must-greater-than": "0.1",
                "sell-limit-must-less-than": "10",
                "sell-limit-must-greater-than": "0.9",
                "limit-order-must-greater-than": "0.001",
                "limit-order-must-less-than": "10000",
                "limit-buy-amount-must-less-than": "10000",
                "limit-sell-amount-must-less-than": "10000",
                "market-buy-order-must-greater-than": "0.0001",
                "market-sell-amount-must-less-than": "0.0001",
                "market-buy-volume-must-greater-than": "0.0001",
                "market-sell-volume-must-less-than": "0.0001",
                "market-bs-calc-max-scale": "1",
                "market-buy-order-must-less-than": "100",
                "market-sell-order-must-greater-than": "0.001",
                "market-sell-order-must-less-than": "1000",
                "limit-order-before-open-greater-than": "999999999",
                "limit-order-before-open-less-than": "0",
                "circuit-break-when-greater-than": "100",
                "circuit-break-when-less-than": "10",
                "order-must-less-than": "0",
                "market-sell-order-rate-must-less-than": "0.1",
                "market-buy-order-rate-must-less-than": "0.1",
                "market-order-disabled-start-time": "0",
                "market-order-disabled-end-time": "0",
                "limit-order-limit-price-start-time": "0",
                "limit-order-limit-price-end-time": "0",
                "limit-order-limit-price-greater-than": None,
                "limit-order-limit-price-less-than": None,
                "equity-deviation-rate": None,
                "equity-deviation-rate-buy": None,
                "equity-deviation-rate-sell": None,
                "market-equity-deviation-rate": None,
                "market-equity-deviation-rate-buy": None,
                "market-equity-deviation-rate-sell": None,
                "equity-deviation-rate-switch": "0",
                "market-equity-deviation-rate-switch": "0",
                "limit-order-switch": "0",
                "limit-order-buy-offset": "0",
                "market-order-switch": "0",
                "market-order-buy-offset": "0",
                "updated-at": self.__timestamp_now()
            },
            "limits": {
                "amount": {
                    "min": market['limits']['amount']['min'],
                    "max": None
                }
            }
        }

    def parse_ticker(self, ticker, symbol):
        return {
            'symbol': symbol,
            'timestamp': ticker[0],
            'datetime': self.iso8601(ticker[0]),
            'high': float(ticker[2]),
            'low': float(ticker[3]),
            'bid': self.safe_string(ticker, 'bid'),
            'bidVolume': None,
            'ask': self.safe_string(ticker, 'ask'),
            'askVolume': None,
            'vwap': None,
            'open': float(ticker[1]),
            'close': float(ticker[4]),
            'last': None,
            'previousClose': None,
            'change': None,
            'percentage': None,
            'average': None,
            'baseVolume': float(ticker[6]),
            'quoteVolume': float(ticker[7]),
            'info': ticker,
        }

    def parse_balance(self, account):
        return {
            'free': float(account.get('balance_available', None)),
            'used': float(account.get('balance_locked', None)),
            'total': float(account.get('balance', None))
        }
    
