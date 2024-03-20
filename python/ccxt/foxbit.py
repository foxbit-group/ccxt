from ccxt.base.exchange import Exchange
from ccxt.abstract.foxbit import ImplicitAPI
from ccxt.base.decimal_to_precision import TICK_SIZE

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
                        'markets/{market_symbol}/candlesticks': 3
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

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        url = self.implode_hostname(self.urls['api']['rest']) + '/' + path
        headers = { 'Content-Type': 'application/json' }

        if method == "POST":
            body = self.json(params)
        
        return {'url': url, 'method': method, 'body': body, 'headers': headers}

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
                        'price': { ... },                                   
                        'cost':  { ... },                                   
                        'leverage': { ... },                                
                },
                'info':      { ... }
            })
        return result 
