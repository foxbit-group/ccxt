from ccxt.base.decimal_to_precision import TICK_SIZE
from ccxt.abstract.foxbit import ImplicitAPI
from ccxt.base.exchange import Exchange
from datetime import datetime
from ccxt.base.types import (
	Num,
	OrderType,
	OrderSide,
	Strings,
	Ticker,
	Tickers,
	Int,
	OrderBook,
	Trade,
	Balances,
	Order,
	Market
)
from typing import List
import hashlib
import hmac
import json

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

	# PUBLIC

	def fetch_markets(self, params={}):
		response = self.publicGetMarkets(params)

		data = self.safe_value(response, 'data', [])
		return self.parse_markets(data)

	def fetch_currencies(self, params={}):
		response = self.publicGetCurrencies(params)

		data = self.safe_value(response, 'data', [])
		return self.parse_currencies(data)

	def fetch_trading_limits(self, symbols: Strings = None, params={}):
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

		response = self.publicGetTicker(self.extend(request, params))

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

	def fetch_balance(self, params={}) -> Balances:
		self.load_markets()
		response = self.privateGetBalance(params)

		result = {'info': response}

		for account in response['data']:
				result[account['currency_symbol'].upper()] = self.parse_balance(account)

		return result

	def create_order(self, symbol: str, type: OrderType, side: OrderSide, amount: float, price: Num = None, params={}):
		market = self.market(symbol)

		request = {
			"side": side.upper(),
			"type": type.upper(),
			"market_symbol": market['id'],
			"quantity": str(amount)
		}

		if type == "limit":
			request['price'] = str(price)

		response = self.privatePostOrderCreate(self.extend(request, params))
		request = {
			'order_id': response['id']
		}

		response = self.privateGetOrder(self.extend(request, params))		
		return self.parse_order(response, market)

	def cancel_order(self, params={}):
			...

	def fetch_order(self, id: str, symbol: str = None, params={}):
		market = self.market(symbol)
		request = {
			'order_id': id
		}

		response = self.privateGetOrder(self.extend(request, params))		
		return self.parse_order(response, market)

	def fetch_orders(self, symbol: str = None, since: Int = None, limit: Int = None, params={}) -> List[Order]:
		market = self.market(symbol)
		request = {
			'market_symbol': market['id'],
			'page_size': limit
		}

		response = self.privateGetOrdersWithoutState(self.extend(request, params))
		orders = self.safe_list(response, 'data', [])

		return self.parse_orders(orders, market, since, limit)

	def fetch_open_orders(self, symbol: str = None, since: Int = None, limit: Int = 10, params={}) -> List[Order]:
		market = self.market(symbol)
		request = {
			'market_symbol': market['id'],
			'state': 'ACTIVE',
			'page_size': limit
		}

		response = self.privateGetOrders(self.extend(request, params))
		orders = self.safe_list(response, 'data', [])

		return self.parse_orders(orders, market, since, limit)

	def fetch_close_orders(self, symbol: str = None, since: Int = None, limit: Int = 10, params={}) -> List[Order]:
		market = self.market(symbol)
		request = {
			'market_symbol': market['id'],
			'state': 'CANCELED',
			'page_size': limit
		}

		response = self.privateGetOrders(self.extend(request, params))
		orders = self.safe_list(response, 'data', [])

		return self.parse_orders(orders, market, since, limit)

	def fetch_my_trades(self, symbol: str = None, since: int = None, limit: int = None, params={}):
		if symbol is None:
				symbol = "BTC/BRL"

		self.load_markets()
		market = self.market(symbol)

		request = {
				'market_symbol': market['id'],
		}

		response = self.privateGetTrades(self.extend(request, params))

		result = []

		for trade in response['data']:
				result.append(self.parse_trade(trade))

		return result

	def fetch_deposit_address(self, params={}):
			...

	def fetch_deposits(self, params={}):
			...

	def fetch_withdraws(self, params={}):
			...

	def fetch_transactions(self, params={}):
			...

	def fetch_ledger(self, params={}):
			...

	def withdraw(self, params={}):
			...

	def transfer(self, params={}):
			...

	# PARSER

	def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
		url = self.implode_hostname(self.urls['api']['rest']) + '/' + self.implode_params(path, params)
		headers = {'Content-Type': 'application/json'}

		if api == "private":
			query_params = ""
			format_path  = self.implode_params(path, params)
			timestamp 	 = self.__timestamp_now()
			payload = {
				"method": method,
				"url": f"/rest/v3/{format_path}"
			}

			if method == "POST":
				body = json.dumps(params)
				payload['body'] = body
				prehash = f"{timestamp}{payload['method']}{payload['url']}{payload['body']}"
			else:
				if "?" in path:
					format_path = path.split("?")[0]
					query_params = url.split("?")[1]

				payload['query'] = query_params
				prehash = f"{timestamp}{payload['method']}{payload['url']}{query_params}"

			secret_key = bytes(self.secret, "utf-8")

			hash = hmac.new(
				secret_key,
				prehash.encode("utf-8"),
				hashlib.sha256
			).hexdigest()

			headers['X-FB-ACCESS-KEY'] = self.apiKey
			headers['X-FB-ACCESS-TIMESTAMP'] = timestamp
			headers['X-FB-ACCESS-SIGNATURE'] = str(hash)

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
				'id': market['symbol'],
				'symbol': f"{base['symbol'].upper()}/{quote['symbol'].upper()}",
				'base': base["symbol"],
				'quote': quote["symbol"],
				'baseId': base["symbol"],
				'quoteId': quote["symbol"],
				'active': True,
				'type': 'spot',
				'spot': True,
				'margin': True,
				'future': False,
				'swap': False,
				'option': False,
				'contract': False,
				'settle': quote["symbol"].lower(),
				'settleId': quote["symbol"],
				'contractSize': 1,
				'linear': True,
				'inverse': False,
				'expiry': None,
				'expiryDatetime': '',
				'strike': 4000,
				'optionType': 'call',
				'taker': 0.002,
				'maker': 0.005,
				'percentage': True,
				'tierBased': False,
				'feeSide': 'get',
				'precision': {
					'price': base['precision'],
					'amount': quote['precision']
				},
				'limits': {
					'amount': {
						'min': market['price_min'],
						'max': 0,
					},
					'price': {},
					'cost': {},
					'leverage': {},
				},
				'info': market
			})
		return result

	def parse_currencies(self, currencies):
		result = {}
		
		for currency in currencies:
				result[currency['symbol'].upper()] = self.parse_currency(currency)

		return result

	def parse_currency(self, currency):
		fee = '0.0'
		if not currency['withdraw_info'] is None:
			fee = currency['withdraw_info']['fee']

		return {
			'id': currency['symbol'],
			'code': currency['symbol'].upper(),
			'name': currency['name'],
			'active': True,
			'fee': fee,
			'precision': currency['precision'],
			'deposit': True,
			'withdraw': True,
			'limits': {
				'amount': {
					'min': 0.01,
					'max': 1000,
				},
				'withdraw': {...},
				'deposit': {...},
			},
			'networks': {...},
			'info': {...}
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

	def parse_trade(self, trade):
		# REFAC
		return {
			'id': '12345-67890:09876/54321',
			'timestamp': 1502962946216,
			'datetime': '2017-08-17 12:42:48.000',
			'symbol': 'ETH/BTC',
			'order': '12345-67890:09876/54321',
			'type': 'limit',
			'side': 'buy',
			'takerOrMaker': 'taker',
			'price': 0.06917684,
			'amount': 1.5,
			'cost': 0.10376526,
			'fee': {
				'cost': 0.0015,
				'currency': 'ETH',
				'rate': 0.002,
			},
			'fees': [
				{
					'cost': 0.0015,
					'currency': 'ETH',
					'rate': 0.002,
				},
			],
		}

	def parse_order(self, order, market: Market = None) -> Order:
		if order['price'] is None:
			price = 0.0
		else:
			price = float(order['price'])

		return {
			'id': order['id'],
			'clientOrderId':  order['sn'],
			'datetime': order['created_at'],
			'timestamp': self.iso8601(order['created_at']),
			'lastTradeTimestamp': None,
			'status': order['state'],
			'symbol': market['symbol'],
			'type': order['type'].lower(),
			'timeInForce': 'GTC',    
			'side': order['side'].lower(),
			'price': price,
			'average': float(order['price_avg']),
			'amount': order['quantity'],
			'filled': float(order['quantity_executed']),
			'remaining': None,
			'cost': None,
			'trades': None,
			'fee': {},
			'info': order
		}
