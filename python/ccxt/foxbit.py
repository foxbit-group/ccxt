from ccxt.base.decimal_to_precision import TICK_SIZE
from ccxt.abstract.foxbit import ImplicitAPI
from ccxt.base.exchange import Exchange
from datetime import datetime
from ccxt.base.types import (
    Num,
    OrderType,
    Currencies,
    Currency,
    Transaction,
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
from ccxt.base.errors import ExchangeError
from ccxt.base.errors import AuthenticationError
from ccxt.base.errors import PermissionDenied
from ccxt.base.errors import AccountSuspended
from ccxt.base.errors import ArgumentsRequired
from ccxt.base.errors import BadRequest
from ccxt.base.errors import BadSymbol
from ccxt.base.errors import OperationRejected
from ccxt.base.errors import MarginModeAlreadySet
from ccxt.base.errors import BadResponse
from ccxt.base.errors import InsufficientFunds
from ccxt.base.errors import InvalidOrder
from ccxt.base.errors import OrderNotFound
from ccxt.base.errors import OrderImmediatelyFillable
from ccxt.base.errors import OrderNotFillable
from ccxt.base.errors import NotSupported
from ccxt.base.errors import OperationFailed
from ccxt.base.errors import DDoSProtection
from ccxt.base.errors import RateLimitExceeded
from ccxt.base.errors import OnMaintenance
from ccxt.base.errors import InvalidNonce
from ccxt.base.errors import RequestTimeout
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
            'rateLimit': 1000,
            'version': 'v3',
            'certified': False,
            'pro': False,
            'has': {
                'CORS': None,
                'spot': True,
                'margin': False,
                'swap': False,
                'future': False,
                'option': False,
                'borrowCrossMargin': False,
                'borrowIsolatedMargin': False,
                'cancelAllOrders': True,
                'cancelOrder': True,
                'cancelOrders': False,
                'createMarketBuyOrderWithCost': True,
                'createMarketOrderWithCost': True,
                'createMarketSellOrderWithCost': True,
                'createOrder': True,
                'createPostOnlyOrder': False,
                'createStopLimitOrder': True,
                'createStopMarketOrder': False,
                'createStopOrder': True,
                'createTrailingPercentOrder': False,
                'fetchBalance': True,
                'fetchBorrowInterest': False,
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
                'fetchDepositWithdrawFee': False,
                'fetchDepositWithdrawFees': False,
                'fetchFundingHistory': False,
                'fetchFundingRate': False,
                'fetchFundingRateHistory': False,
                'fetchFundingRates': False,
                'fetchIsolatedBorrowRate': False,
                'fetchIsolatedBorrowRates': False,
                'fetchLiquidations': False,
                'fetchMarginMode': False,
                'fetchMarkets': True,
                'fetchMyLiquidations': False,
                'fetchMyTrades': True,
                'fetchOHLCV': True,
                'fetchOpenInterest': False,
                'fetchOpenInterestHistory': False,
                'fetchOpenOrders': True,
                'fetchOrder': True,
                'fetchOrderBook': True,
                'fetchOrders': True,
                'fetchOrderTrades': True,
                'fetchPosition': False,
                'fetchPositionMode': False,
                'fetchPositions': False,
                'fetchStatus': True,
                'fetchTicker': True,
                'fetchTickers': True,
                'fetchTime': True,
                'fetchTrades': True,
                'fetchTradingFee': False,
                'fetchTradingFees': False,
                'fetchTransactionFee': False,
                'fetchTransactionFees': False,
                'fetchTransfer': False,
                'fetchTransfers': False,
                'fetchWithdrawAddressesByNetwork': False,
                'fetchWithdrawal': True,
                'fetchWithdrawals': True,
                'reduceMargin': False,
                'repayCrossMargin': False,
                'repayIsolatedMargin': False,
                'setLeverage': False,
                'setMarginMode': False,
                'transfer': False,
                'withdraw': True,
            },
            'hostname': 'foxbit.com.br',
            'urls': {
                'logo': 'https://docs.{hostname}/rest/v3/logo-with-text.svg',
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
            },
            'api': {
                # TODO: Adicionar v3?
                'public': {
                    'get': {
                        # TODO: Adicionar todos os outros? Pelo menos os que usamos.
                        'currencies': 6,
                        'marketsxxx': 6,
                        'markets/quotes': 2, # TODO: Será que faz sentido ter esse?
                        'markets/{market_symbol}/orderbook': 10,
                        'markets/{market_symbol}/candlesticks': 10,
                        'markets/{market_symbol}/ticker/24hr': 4,
                        'markets/ticker/24hr': 1,
                    },
                },
                'private': {},
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '12h': '12h',
                '1d': '1d',
                '1w': '1w',
                '2w': '2w',
                '1M': '1M',
            },
            'fees': {
                'trading': {
                    'tierBased': True,
                    'percentage': True,
                    'taker': self.parse_number('0.0025'), # TODO: Isso não pode ficar hard coded
                    'maker': self.parse_number('0.0050'), # TODO: Isso não pode ficar hard coded
                    'tiers': {},
                },
            },
            'precisionMode': TICK_SIZE, # TODO: Seria isso ou DECIMAL_PLACES?
            'exceptions': {
                'exact': {
                    '400': BadRequest,
                    '401': AuthenticationError,
                    '403': PermissionDenied,
                    '404': BadRequest,
                    '429': RateLimitExceeded,
                    '500': ExchangeError,
                    '504': ExchangeError,
                    # TODO: Vários erros aqui: https://docs.foxbit.com.br/rest/v3/#tag/Errors
                    '2001': AuthenticationError,
                    '2002': AuthenticationError,
                    '2003': AuthenticationError,
                    '2004': AuthenticationError,
                }
            },
            'commonCurrencies': {},
            'options': {
                # TODO: De onde vieram essas options, precisa mesmo?
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

    def fetch_currencies(self, params={}) -> Currencies:
        response = self.publicGetCurrencies(params)

        data = self.safe_value(response, 'data', [])
        return self.parse_currencies(data)

    def fetch_ticker(self, symbol: str, params={}) -> Ticker:
        self.load_markets()
        market = self.market(symbol)
        market_id = market['id'].lower()
        request = {
            'market_symbol': market_id,
        }
        response = self.publicGetTicker(self.extend(request, params))
        # {
        #   "data": [
        #     {
        #       "market_symbol": "btcbrl",
        #       "last_trade": {
        #         "price": "358657.88430000",
        #         "volume": "0.00000278",
        #         "date": "2024-06-02T22:47:40.000Z"
        #       },
        #       "rolling_24h": {
        #         "price_change": "1158.98430000",
        #         "price_change_percent": "0.32419241",
        #         "volume": "3.69065955",
        #         "trades_count": 2693,
        #         "open": "357498.90000000",
        #         "high": "360000.00000000",
        #         "low": "355000.00010000"
        #       },
        #       "best": {
        #         "ask": {
        #           "price": "358802.05790000",
        #           "volume": "0.00178600"
        #         },
        #         "bid": {
        #           "price": "358016.00050000",
        #           "volume": "0.00020012"
        #         }
        #       }
        #     }
        #   ]
        # }
        return self.parse_ticker(response['data'][0], market['symbol'])

    def fetch_tickers(self, symbols: Strings = None, params={}) -> Tickers:
        self.load_markets()
        # {
        #   "data": [
        #     {
        #       "market_symbol": "btcbrl",
        #       "last_trade": {
        #         "price": "358578.09360000",
        #         "volume": "0.00002937",
        #         "date": "2024-06-03T00:52:38.000Z"
        #       },
        #       "rolling_24h": {
        #         "price_change": "947.20430000",
        #         "price_change_percent": "0.26485528",
        #         "volume": "3.41562704",
        #         "trades_count": 2689,
        #         "open": "357630.88930000",
        #         "high": "360000.00000000",
        #         "low": "355000.00010000"
        #       }
        #     },
        #     ...
        #   ]
        # }
        response = self.publicGetTickers()
        return self.parse_tickers(response['data'])

    # TODO: Será que podemos remover?
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

    # TODO: Implementar
    def fetch_trades(self, symbol: str, since: Int = None, limit: Int = None, params={}) -> List[Trade]:
        ...

    def fetch_ohlcv(self, symbol: str, timeframe='1m', since: Int = None, limit: int = 1, params={}) -> List[list]:
        # TODO: @Neville, pq vc da esses espaços antes de começar o texto?
        """
        SETTINGS POSITION 5 VOLUME
        """
        self.load_markets()

        market = self.market(symbol)

        # TODO: Falta start_time e end_time
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

    # TODO: Implementar os outros tipos de ordem
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

    # TODO: Muitas funções para implementar (https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_cancel)
    #       Não implementar SN
    def cancel_order(self, id: str, symbol: str = None, params={}):
        market = self.market(symbol)
        request = {
            'type': 'ID',
            'id': id
        }
        response = self.privateCancelOrder(self.extend(request, params))
        if 'id' in response['data'][0]:
            order_id = response['data'][0]['id']
            request = {
                'order_id': order_id
            }
            response = self.privateGetOrder(self.extend(request, params))

        return self.parse_order(response, market)

    # TODO: Get by client_order_id
    def fetch_order(self, id: str, symbol: str = None, params={}):
        market = self.market(symbol)
        request = {
            'order_id': id
        }

        response = self.privateGetOrder(self.extend(request, params))
        return self.parse_order(response, market)

    # TODO: Tem váriso parâmetros que podem ser implementados: https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_listOrders
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
            'page_size': limit # TODO: Tem como colocar a página?
        }

        response = self.privateGetOrders(self.extend(request, params))
        orders = self.safe_list(response, 'data', [])

        return self.parse_orders(orders, market, since, limit)

    def fetch_close_orders(self, symbol: str = None, since: Int = None, limit: Int = 10, params={}) -> List[Order]:
        market = self.market(symbol)
        request = {
            'market_symbol': market['id'],
            'state': 'CANCELED',
            'page_size': limit # TODO: Tem como colocar a página?
        }

        response = self.privateGetOrders(self.extend(request, params))
        orders = self.safe_list(response, 'data', [])

        return self.parse_orders(orders, market, since, limit)

    def fetch_my_trades(self, symbol: str = None, since: int = None, limit: int = None, params={}):
        if symbol is None:
            symbol = "BTC/BRL" # TODO: Precisa mesmo desse fallback ou deveria dar erro?

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

    def fetch_deposit_address(self, code: str, params={}):
        self.load_markets()
        currency = self.currency(code)
        request = {'market_symbol': currency['id']}
        response = self.privateDepositAddress(self.extend(request, params))

        return {
            'currency': response['currency_symbol'],
            'address': response['address'],
            'tag': response['destination_tag'],
            'network': None,
            'info': response,
        }

    def fetch_deposits(self, code: str = None, since: Int = None, limit: Int = None, params={}) -> List[Transaction]:
        request = {
            'limit': 100
        }
        currency = None

        if code is not None:
            self.load_markets()
            currency = self.currency(code)
            request['market_symbol'] = currency['id']
        if limit is not None:
            request['limit'] = limit

        response = self.privateDeposit(self.extend(request, params))

        deposits = self.safe_list(response, 'data', [])
        return self.parse_transactions(deposits, currency, since, limit)

    def fetch_withdrawals(self, code: str = None, since: Int = None, limit: Int = None, params={}) -> List[Transaction]:
        request = {
            'limit': 100
        }
        currency = None

        if code is not None:
            self.load_markets()
            currency = self.currency(code)
            request['market_symbol'] = currency['id']

        if limit is not None:
            request['limit'] = limit

        response = self.privateWithdrawals(self.extend(request, params))

        withdrawals = self.safe_list(response, 'data', [])
        return self.parse_transactions(withdrawals, currency, since, limit)

    def fetch_transactions(self, params={}):
        ...

    # TODO: Remover, não temos
    def fetch_ledger(self, params={}):
        ...

    def withdraw(self, code: str, amount: float, address: str, tag=None, params={}):
        if code == "BRL":
            body = {
                "amount": amount,
                "currency_symbol": "brl",
                "bank": {
                    "code": params['code_bank'],
                    "branch": {
                        "number": params['branch_number'],
                        "digit": params['branch_digit']
                    },
                    "account": {
                        "number": params['account_number'],
                        "digit": params['account_digit'],
                        "type": "CHECK"
                    }
                }

            }
        else:
            self.load_markets()
            currency = self.currency(code)

            body = {
                "amount": amount,
                "currency_symbol": currency['id'],
                "destination_address": address,
                "destination_tag": tag
            }

        response = self.privatePostWithdrawals(self.extend(body, params))

        return self.extend(response['data'], {
            'code': response['sn'],
            'address': None,
            'tag': None,
        })

    # TODO: Até temos, mas só liberamos para alguns parceiros, remover
    def transfer(self, params={}):
        ...

    # PARSER

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        url = self.implode_hostname(self.urls['api']['rest']) + '/' + self.implode_params(path, params)
        headers = {'Content-Type': 'application/json'}

        if api == "private":
            query_params = ""
            format_path = self.implode_params(path, params)
            timestamp = self.__timestamp_now()
            payload = {
                "method": method,
                "url": f"/rest/v3/{format_path}"
            }

            if method == "POST" or method == "PUT":
                body = json.dumps(params)
                payload['body'] = body
                prehash = f"{timestamp}{payload['method']}{payload['url']}{payload['body']}"
            else:
                if "?" in path:
                    format_path = payload['url'].split("?")[0]
                    query_params = url.split("?")[1]
                else:
                    format_path = payload['url']

                payload['query'] = query_params
                prehash = f"{timestamp}{payload['method']}{format_path}{query_params}"  # /rest/v3/

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
        # TODO: Vi outras chamando self.milliseconds() simplesmente
        return str(
            datetime.now().timestamp()
        ).split('.')[0]

    def parse_markets(self, markets):
        result = []

        for market in markets:
            base = market['base']
            quote = market['quote']

            result.append({
                'id': market['symbol'].upper(), # TODO: aqui não teria um UPPER?
                'symbol': f"{base['symbol'].upper()}/{quote['symbol'].upper()}",
                'base': base["symbol"].upper(), # TODO: aqui não teria um UPPER?
                'quote': quote["symbol"].upper(), # TODO: aqui não teria um UPPER?
                'baseId': base["symbol"].upper(), # TODO: aqui não teria um UPPER?
                'quoteId': quote["symbol"].upper(), # TODO: aqui não teria um UPPER?
                'active': True,
                'type': 'spot',
                'spot': True,
                'margin': False,
                'future': False,
                'swap': False,
                'option': False,
                'contract': False,
                'settle': None,
                'settleId': None,
                'contractSize': None,
                'linear': None,
                'inverse': None,
                'expiry': None,
                'expiryDatetime': None,
                'strike': None,
                'optionType': None,
                'taker': '0.0025', # TODO: Temos como pegar isso da configuração? E na verdade não sei se devemos passar isso, pois é dinâmico por usuario
                'maker': '0.005', # TODO: Temos como pegar isso da configuração?
                'percentage': True,
                'tierBased': True,
                'feeSide': 'get',
                'precision': {
                    'price': self.__count_decimals(market['price_increment']),
                    'amount': self.__count_decimals(market['quantity_increment'])
                },
                'limits': {
                    'amount': {
                        'min': market['quantity_min'],
                        'max': None,
                    },
                    'price': {},
                },
                'info': market
            })
        return result

    def __count_decimals(self, number_str):
        if '.' in number_str:
            parts = number_str.split('.')
            return len(parts[1])
        else:
            return 0

    def parse_currencies(self, currencies):
        result = {}

        for currency in currencies:
            result[currency['symbol'].upper()] = self.parse_currency(currency)

        return result

    def parse_currency(self, currency):
        return {
            'id': currency['symbol'].upper(),
            'code': currency['symbol'].upper(),
            'name': currency['name'],
            'active': None,
            'fee': None,
            'precision': int(currency['precision']),
            'deposit': None,
            'withdraw': None,
            'limits': {
                'deposit': {
                    'min': None,
                    'max': None,
                },
                'withdraw': {
                    'min': None,
                    'max': None,
                },
            },
            'networks': {},
            'info': currency
        }

    # TODO: Usando outra versão da Binance, parece fazer mais sentido, removemos?
    # def parse_trading_by_market(self, market, params):
    #     return {
    #         # TODO: Não encontrei essa config na BitMart e nem em outras grande, faz sentido termos?
    #         "info": {
    #             "symbol": market['id'],
    #             "buy-limit-must-less-than": "1.1",
    #             "buy-limit-must-greater-than": "0.1",
    #             "sell-limit-must-less-than": "10",
    #             "sell-limit-must-greater-than": "0.9",
    #             "limit-order-must-greater-than": "0.001",
    #             "limit-order-must-less-than": "10000",
    #             "limit-buy-amount-must-less-than": "10000",
    #             "limit-sell-amount-must-less-than": "10000",
    #             "market-buy-order-must-greater-than": "0.0001",
    #             "market-sell-amount-must-less-than": "0.0001",
    #             "market-buy-volume-must-greater-than": "0.0001",
    #             "market-sell-volume-must-less-than": "0.0001",
    #             "market-bs-calc-max-scale": "1",
    #             "market-buy-order-must-less-than": "100",
    #             "market-sell-order-must-greater-than": "0.001",
    #             "market-sell-order-must-less-than": "1000",
    #             "limit-order-before-open-greater-than": "999999999",
    #             "limit-order-before-open-less-than": "0",
    #             "circuit-break-when-greater-than": "100",
    #             "circuit-break-when-less-than": "10",
    #             "order-must-less-than": "0",
    #             "market-sell-order-rate-must-less-than": "0.1",
    #             "market-buy-order-rate-must-less-than": "0.1",
    #             "market-order-disabled-start-time": "0",
    #             "market-order-disabled-end-time": "0",
    #             "limit-order-limit-price-start-time": "0",
    #             "limit-order-limit-price-end-time": "0",
    #             "limit-order-limit-price-greater-than": None,
    #             "limit-order-limit-price-less-than": None,
    #             "equity-deviation-rate": None,
    #             "equity-deviation-rate-buy": None,
    #             "equity-deviation-rate-sell": None,
    #             "market-equity-deviation-rate": None,
    #             "market-equity-deviation-rate-buy": None,
    #             "market-equity-deviation-rate-sell": None,
    #             "equity-deviation-rate-switch": "0",
    #             "market-equity-deviation-rate-switch": "0",
    #             "limit-order-switch": "0",
    #             "limit-order-buy-offset": "0",
    #             "market-order-switch": "0",
    #             "market-order-buy-offset": "0",
    #             "updated-at": self.__timestamp_now()
    #         },
    #         "limits": {
    #             "amount": {
    #                 "min": market['limits']['amount']['min'],
    #                 "max": None
    #             }
    #         }
    #     }

    def parse_ticker(self, ticker, symbol):
        # {
        #   "market_symbol": "btcbrl",
        #   "last_trade": {
        #     "price": "358657.88430000",
        #     "volume": "0.00000278",
        #     "date": "2024-06-02T22:47:40.000Z"
        #   },
        #   "rolling_24h": {
        #     "price_change": "1158.98430000",
        #     "price_change_percent": "0.32419241",
        #     "volume": "3.69065955",
        #     "trades_count": 2693,
        #     "open": "357498.90000000",
        #     "high": "360000.00000000",
        #     "low": "355000.00010000"
        #   },
        #   "best": {
        #     "ask": {
        #       "price": "358802.05790000",
        #       "volume": "0.00178600"
        #     },
        #     "bid": {
        #       "price": "358016.00050000",
        #       "volume": "0.00020012"
        #     }
        #   }
        # }
        last_trade = self.safe_value(ticker, 'last_trade', {})
        rolling_24h = self.safe_value(ticker, 'rolling_24h', {})
        best = self.safe_value(ticker, 'best', {})
        ask = self.safe_value(best, 'ask', {})
        bid = self.safe_value(best, 'bid', {})
        last = self.safe_string(last_trade, 'price')

        return {
            'symbol': symbol,
            'timestamp': self.parse8601(self.safe_string(last_trade, 'date')),
            'datetime': self.safe_string(last_trade, 'date'),
            'high': self.safe_string(rolling_24h, 'high'),
            'low': self.safe_string(rolling_24h, 'low'),
            'bid': self.safe_string(bid, 'price'),
            'bidVolume': self.safe_string(bid, 'volume'),
            'ask': self.safe_string(ask, 'price'),
            'askVolume': self.safe_string(ask, 'volume'),
            'vwap': None,
            'open': self.safe_string(rolling_24h, 'open'),
            'close': last,
            'last': last,
            'previousClose': None,
            'change': self.safe_string(rolling_24h, 'price_change'),
            'percentage': self.safe_string(rolling_24h, 'price_change_percent'),
            'average': None,
            'baseVolume': self.safe_string(rolling_24h, 'volume'),
            'quoteVolume': None,
            'info': ticker,
        }

    def parse_tickers(self, tickers):
        # {
        #   "market_symbol": "btcbrl",
        #   "last_trade": {
        #     "price": "358657.88430000",
        #     "volume": "0.00000278",
        #     "date": "2024-06-02T22:47:40.000Z"
        #   },
        #   "rolling_24h": {
        #     "price_change": "1158.98430000",
        #     "price_change_percent": "0.32419241",
        #     "volume": "3.69065955",
        #     "trades_count": 2693,
        #     "open": "357498.90000000",
        #     "high": "360000.00000000",
        #     "low": "355000.00010000"
        #   }
        # }
        result = {}

        for ticker in tickers:
            market_id = ticker['market_symbol'].upper()
            market = self.market(market_id)
            symbol = market['symbol']
            last_trade = self.safe_value(ticker, 'last_trade', {})
            rolling_24h = self.safe_value(ticker, 'rolling_24h', {})
            last = self.safe_string(last_trade, 'price')

            result[symbol] = {
                'symbol': symbol,
                'timestamp': self.parse8601(self.safe_string(last_trade, 'date')),
                'datetime': self.safe_string(last_trade, 'date'),
                'high': self.safe_string(rolling_24h, 'high'),
                'low': self.safe_string(rolling_24h, 'low'),
                'bid': None,
                'bidVolume': None,
                'ask': None,
                'askVolume': None,
                'vwap': None,
                'open': self.safe_string(rolling_24h, 'open'),
                'close': last,
                'last': last,
                'previousClose': None,
                'change': self.safe_string(rolling_24h, 'price_change'),
                'percentage': self.safe_string(rolling_24h, 'price_change_percent'),
                'average': None,
                'baseVolume': self.safe_string(rolling_24h, 'volume'),
                'quoteVolume': None,
                'info': ticker,
            }
        return result

    def parse_balance(self, account):
        # TODO: Acho que aqui não precisa ser float certo?
        return {
            'free': self.safe_string(account, 'balance_available'),
            'used': self.safe_string(account, 'balance_locked'),
            'total': self.safe_string(account, 'balance'),
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
            'clientOrderId': order['sn'],
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

    def parse_transaction(self, transaction, currency: Currency = None, params={}) -> Transaction:

        # request = {
        #     'sn': transaction['sn']
        # }

        # response = self.privateDepositSn((self.extend(request, params)))
        # response['details_crypto']['transaction_id']
        # response['details_crypto']['receiving_address']

        return {
            'info': transaction,
            'id': transaction['sn'],
            'txid': None,
            'type': None,
            'currency': None,
            'network': None,
            'amount': transaction['amount'],
            'status': transaction['state'],
            'timestamp': None,
            'datetime': None,
            'address': None,
            'addressFrom': None,
            'addressTo': None,
            'tag': None,
            'tagFrom': None,
            'tagTo': None,
            'updated': None,
            'comment': None,
            'fee': {
                'currency': None,
                'cost': None,
                'rate': None,
            },
            'internal': False,
        }
