//  ---------------------------------------------------------------------------

import { ArgumentsRequired, InvalidOrder } from './base/errors.js';
import Exchange from './abstract/foxbit.js';
import type { Currencies, Market, OrderBook, Dict, Ticker, TradingFees, Int, Str, Num, Trade, OHLCV, Balances, Order, OrderType, OrderSide, Strings, Tickers, Currency, Transaction } from './base/types.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';

//  ---------------------------------------------------------------------------

/**
 * @class foxbit
 * @augments Exchange
 */
export default class foxbit extends Exchange {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'foxbit',
            'name': 'Foxbit',
            'country': [ 'pt-BR' ],
            // 300 requests per 10 seconds = 30 requests per second
            // rateLimit = 1000 ms / 30 requests ~= 33.334
            'rateLimit': 33.334,
            'version': '1',
            'comment': 'Foxbit Exchange',
            'certified': false,
            'pro': false,
            'urls': {
                'logo': 'https://foxbit.com.br/wp-content/uploads/2024/05/Logo_Foxbit.png',
                'api': {
                    'public': 'https://api.foxbit.com.br',
                    'private': 'https://api.foxbit.com.br',
                    'status': 'https://metadata-v2.foxbit.com.br/api',
                },
                'www': 'https://app.foxbit.com.br',
                'doc': [
                    'https://docs.foxbit.com.br',
                ],
            },
            'requiredCredentials': {
                'apiKey': true,
                'secret': true,
            },
            'api': {
                'v3': {
                    'public': {
                        'get': {
                            'currencies': 5, // 6 requests per second
                            'markets': 5, // 6 requests per second
                            'markets/ticker/24hr': 60, // 1 request per 2 seconds
                            'markets/{market}/orderbook': 6, // 10 requests per 2 seconds
                            'markets/{market}/candlesticks': 12, // 5 requests per 2 seconds
                            'markets/{market}/trades/history': 12, // 5 requests per 2 seconds
                            'markets/{market}/ticker/24hr': 15, // 4 requests per 2 seconds
                        },
                    },
                    'private': {
                        'get': {
                            'accounts': 2, // 15 requests per second
                            'orders': 2, // 30 requests per 2 seconds
                            'orders/by-order-id/{id}': 2, // 30 requests per 2 seconds
                            'trades': 6, // 5 orders per second
                            'deposits/address': 10, // 3 requests per second
                            'deposits': 10, // 3 requests per second
                            'withdrawals': 10, // 3 requests per second
                        },
                        'post': {
                            'orders': 2, // 30 requests per 2 seconds
                            'orders/cancel-replace': 3, // 20 requests per 2 seconds
                            'withdrawals': 10, // 3 requests per second
                        },
                        'put': {
                            'orders/cancel': 2, // 30 requests per 2 seconds
                        },
                    },
                },
                'status': {
                    'get': {
                        'status': 30, // 1 request per second
                    },
                },
            },
            'has': {
                'CORS': true,
                'spot': true,
                'margin': undefined,
                'swap': undefined,
                'future': undefined,
                'option': undefined,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'createOrder': true,
                'fecthOrderBook': true,
                'fetchBalance': true,
                'fetchClosedOrders': true,
                'fetchCurrencies': true,
                'fetchDepositAddress': true,
                'fetchDeposits': true,
                'fetchMarkets': true,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrders': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTrades': true,
                'fetchTransactions': true,
                'fetchWithdrawals': true,
                'withdraw': true,
                'ws': false,
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
        });
    }

    async fetchCurrencies (params = {}): Promise<Currencies> {
        const response = await this.v3PublicGetCurrencies (params);
        // {
        //   "data": [
        //     {
        //       "symbol": "btc",
        //       "name": "Bitcoin",
        //       "type": "CRYPTO",
        //       "precision": 8,
        //       "deposit_info": {
        //         "min_to_confirm": "1",
        //         "min_amount": "0.0001"
        //       },
        //       "withdraw_info": {
        //         "enabled": true,
        //         "min_amount": "0.0001",
        //         "fee": "0.0001"
        //       },
        //       "category": {
        //           "code": "cripto",
        //         "name": "Cripto"
        //       }
        //     }
        //   ]
        // }
        const data = this.safeValue (response, 'data', []);
        const coins = Object.keys (data);
        const result: Dict = {};
        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i];
            const currency = data[coin];
            const precison = this.safeString (currency, 'precision');
            const currencyId = this.safeString (currency, 'symbol');
            const name = this.safeString (currency, 'name');
            const code = this.safeCurrencyCode (currencyId);
            const depositInfo = this.safeDict (currency, 'deposit_info');
            const withdrawInfo = this.safeDict (currency, 'withdraw_info');
            if (this.safeValue (result, code) === undefined) {
                result[code] = {
                    'id': currencyId,
                    'code': code,
                    'info': currency,
                    'name': name,
                    'active': true,
                    'deposit': true,
                    'withdraw': this.safeBool (withdrawInfo, 'enabled'),
                    'fee': this.safeNumber (withdrawInfo, 'fee'),
                    'precision': precison,
                    'limits': {
                        'amount': {
                            'min': undefined,
                            'max': undefined,
                        },
                        'deposit': {
                            'min': this.safeNumber (depositInfo, 'min_amount'),
                            'max': undefined,
                        },
                        'withdraw': {
                            'min': this.safeNumber (withdrawInfo, 'min_amount'),
                            'max': undefined,
                        },
                    },
                };
            }
        }
        return result;
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        /**
         * @method
         * @name foxbit#fetchMarkets
         * @description Retrieves data on all markets for foxbit.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_index
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const response = await this.v3PublicGetMarkets (params);
        //  {
        //    "data": [
        //      {
        //        "symbol": "usdtbrl",
        //        "quantity_min": "0.00002",
        //        "quantity_increment": "0.00001",
        //        "price_min": "1.0",
        //        "price_increment": "0.0001",
        //        "base": {
        //          "symbol": "btc",
        //          "name": "Bitcoin",
        //          "type": "CRYPTO",
        //          "precision": 8,
        //          "deposit_info": {
        //            "min_to_confirm": "1",
        //            "min_amount": "0.0001"
        //          },
        //          "withdraw_info": {
        //            "enabled": true,
        //            "min_amount": "0.0001",
        //            "fee": "0.0001"
        //          },
        //          "category": {
        //            "code": "cripto",
        //            "name": "Cripto"
        //          }
        //        },
        //        "quote": {
        //          "symbol": "btc",
        //          "name": "Bitcoin",
        //          "type": "CRYPTO",
        //          "precision": 8,
        //          "deposit_info": {
        //            "min_to_confirm": "1",
        //            "min_amount": "0.0001"
        //          },
        //          "withdraw_info": {
        //            "enabled": true,
        //            "min_amount": "0.0001",
        //            "fee": "0.0001"
        //          },
        //          "category": {
        //            "code": "cripto",
        //            "name": "Cripto"
        //          }
        //        }
        //      }
        //    ]
        //  }
        const markets = this.safeList (response, 'data', []);
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            const id = this.safeString (market, 'symbol');
            const baseAssets = this.safeValue (market, 'base');
            const baseId = this.safeString (baseAssets, 'symbol');
            const quoteAssets = this.safeValue (market, 'quote');
            const quoteId = this.safeString (quoteAssets, 'symbol');
            const base = this.safeCurrencyCode (baseId);
            const quote = this.safeCurrencyCode (quoteId);
            const symbol = base + '/' + quote;
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'active': true,
                'type': 'spot',
                'spot': true,
                'margin': undefined,
                'future': undefined,
                'swap': undefined,
                'option': undefined,
                'contract': undefined,
                'settle': undefined,
                'settleId': undefined,
                'contractSize': undefined,
                'linear': undefined,
                'inverse': undefined,
                'expiry': undefined,
                'expiryDatetime': undefined,
                'strike': undefined,
                'optionType': undefined,
                'taker': undefined,
                'maker': undefined,
                'percentage': true,
                'tierBased': false,
                'feeSide': 'get',
                'precision': {
                    'price': this.safeNumber (quoteAssets, 'precision'),
                    'amount': this.safeNumber (baseAssets, 'precision'),
                    'cost': this.safeNumber (quoteAssets, 'precision'),
                },
                'limits': {
                    'amount': {
                        'min': this.safeNumber (market, 'quantity_min'),
                        'max': undefined,
                    },
                    'price': {
                        'min': this.safeNumber (market, 'price_min'),
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                    'leverage': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        /**
         * @method
         * @name foxbit#fetchTicker
         * @description Get last 24 hours ticker information, in real-time, for given market.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_ticker
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'market': market['baseId'] + market['quoteId'],
        };
        const response = await this.v3PublicGetMarketsMarketTicker24hr (this.extend (request, params));
        //  {
        //    "data": [
        //      {
        //        "market_symbol": "btcbrl",
        //        "last_trade": {
        //          "price": "358504.69340000",
        //          "volume": "0.00027893",
        //          "date": "2024-01-01T00:00:00.000Z"
        //        },
        //        "rolling_24h": {
        //          "price_change": "3211.87290000",
        //          "price_change_percent": "0.90400726",
        //          "volume": "20.03206866",
        //          "trades_count": "4376",
        //          "open": "355292.82050000",
        //          "high": "362999.99990000",
        //          "low": "355002.88880000"
        //        },
        //        "best": {
        //          "ask": {
        //            "price": "358504.69340000",
        //            "volume": "0.00027893"
        //          },
        //          "bid": {
        //            "price": "358504.69340000",
        //            "volume": "0.00027893"
        //          }
        //        }
        //      }
        //    ]
        //  }
        const data = this.safeList (response, 'data', []);
        const result = this.safeDict (data, 0, {});
        return this.parseTicker (result, market);
    }

    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        /**
         * @method
         * @name foxbit#fetchTickers
         * @description Retrieve the ticker data of all markets.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_tickers
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        symbols = this.marketSymbols (symbols);
        const response = await this.v3PublicGetMarketsTicker24hr (params);
        //  {
        //    "data": [
        //      {
        //        "market_symbol": "btcbrl",
        //        "last_trade": {
        //          "price": "358504.69340000",
        //          "volume": "0.00027893",
        //          "date": "2024-01-01T00:00:00.000Z"
        //        },
        //        "rolling_24h": {
        //          "price_change": "3211.87290000",
        //          "price_change_percent": "0.90400726",
        //          "volume": "20.03206866",
        //          "trades_count": "4376",
        //          "open": "355292.82050000",
        //          "high": "362999.99990000",
        //          "low": "355002.88880000"
        //        },
        //      }
        //    ]
        //  }
        const data = this.safeList (response, 'data', []);
        return this.parseTickers (data, symbols);
    }

    async fetchTradingFees (params: {}): Promise<TradingFees> {
        return {};
    }

    async fetchOrderBook (symbol: string, limit: Int = 20, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name foxbit#fetchOrderBook
         * @description Exports a copy of the order book of a specific market.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_findOrderbook
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'market': market['baseId'] + market['quoteId'],
            'depth': limit,
        };
        const response = await this.v3PublicGetMarketsMarketOrderbook (this.extend (request, params));
        //  {
        //    "sequence_id": 1234567890,
        //    "timestamp": 1713187921336,
        //    "bids": [
        //      [
        //        "3.00000000",
        //        "300.00000000"
        //      ],
        //      [
        //        "1.70000000",
        //        "310.00000000"
        //      ]
        //    ],
        //    "asks": [
        //      [
        //        "3.00000000",
        //        "300.00000000"
        //      ],
        //      [
        //        "2.00000000",
        //        "321.00000000"
        //      ]
        //    ]
        //  }
        const timestamp = this.safeInteger (response, 'timestamp');
        return this.parseOrderBook (response, symbol, timestamp);
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name foxbit#fetchTrades
         * @description Retrieve the trades of a specific market.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_publicTrades
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'market': market['baseId'] + market['quoteId'],
        };
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 200) {
                request['page_size'] = 200;
            }
        }
        // [
        //     {
        //         "id": 1,
        //         "price": "329248.74700000",
        //         "volume": "0.00100000",
        //         "taker_side": "BUY",
        //         "created_at": "2024-01-01T00:00:00Z"
        //     }
        // ]
        const response = await this.v3PublicGetMarketsMarketTradesHistory (this.extend (request, params));
        const data = this.safeList (response, 'data', []);
        return this.parseTrades (data, market, since, limit);
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name foxbit#fetchOHLCV
         * @description Fetch historical candlestick data containing the open, high, low, and close price, and the volume of a market.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_findCandlesticks
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'market': market['baseId'] + market['quoteId'],
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['limit'] = limit;
            if (limit > 500) {
                request['limit'] = 500;
            }
        }
        const response = await this.v3PublicGetMarketsMarketCandlesticks (this.extend (request, params));
        // [
        //     [
        //         "1692918000000", // timestamp
        //         "127772.05150000", // open
        //         "128467.99980000", // high
        //         "127750.01000000", // low
        //         "128353.99990000", // close
        //         "1692918060000", // close timestamp
        //         "0.17080431", // base volume
        //         "21866.35948786", // quote volume
        //         66, // number of trades
        //         "0.12073605", // taker buy base volume
        //         "15466.34096391" // taker buy quote volume
        //     ]
        // ]
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    async fetchBalance (params = {}): Promise<Balances> {
        /**
         * @method
         * @name foxbit#fetchBalance
         * @description Query for balance and get the amount of funds available for trading or funds locked in orders.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Account/operation/AccountsController_all
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
         */
        await this.loadMarkets ();
        const response = await this.v3PrivateGetAccounts (params);
        // {
        //     "data": [
        //         {
        //         "currency_symbol": "btc",
        //         "balance": "10000.0",
        //         "balance_available": "9000.0",
        //         "balance_locked": "1000.0"
        //         }
        //     ]
        // }
        const accounts = this.safeList (response, 'data', []);
        const result: Dict = {
            'info': response,
        };
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const currencyId = this.safeString (account, 'currency_symbol');
            const currencyCode = this.safeCurrencyCode (currencyId);
            const total = this.safeString (account, 'balance');
            const used = this.safeString (account, 'balance_locked');
            const free = this.safeString (account, 'balance_available');
            const balanceObj = {
                'free': free,
                'used': used,
                'total': total,
            };
            result[currencyCode] = balanceObj;
        }
        return this.safeBalance (result);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name foxbit#fetchOpenOrders
         * @description Fetch all unfilled currently open orders.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_listOrders
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of open order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        return this.fetchOrdersByStatus ('ACTIVE', symbol, since, limit, params);
    }

    async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name foxbit#fetchClosedOrders
         * @description Fetch all currently closed orders.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_listOrders
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        return this.fetchOrdersByStatus ('FILLED', symbol, since, limit, params);
    }

    async fetchOrdersByStatus (status: Str, symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {
            'state': status,
        };
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['market_symbol'] = market['baseId'] + market['quoteId'];
        }
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 100) {
                request['page_size'] = 100;
            }
        }
        const response = await this.v3PrivateGetOrders (this.extend (request, params));
        const data = this.safeList (response, 'data', []);
        return this.parseOrders (data);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name foxbit#createOrder
         * @description Create an order with the specified characteristics
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_create
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much you want to trade in units of the base currency
         * @param {float} [price] the price at which the order is to be fullfilled, in units of the quote currency, ignored in market orders, used as stop_price on stop market orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {float} [params.client_order_id] client-provided numeric identifier (max. of 2^53 - 1) of the order
         * @param {string} [params.remark] A note for the order (<= 100 characters)
         * @param {boolean} [params.post_only] When true your order will not be executed immediately in the market.
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        type = type.toUpperCase ();
        const validOrderTypes = [ 'LIMIT', 'MARKET', 'STOP_MARKET', 'INSTANT' ];
        const isOrderTypeValid = validOrderTypes.indexOf (type) >= 0;
        if (!isOrderTypeValid) {
            throw new InvalidOrder ('Invalid order type: ' + type + '. Must be one of ' + validOrderTypes.join (', ') + '.');
        }
        const request: Dict = {
            'market_symbol': market['baseId'] + market['quoteId'],
            'side': side.toUpperCase (),
            'type': type,
        };
        if (type === 'LIMIT' || type === 'MARKET') {
            request['quantity'] = this.amountToPrecision (symbol, amount);
            if (type === 'LIMIT') {
                request['price'] = this.priceToPrecision (symbol, price);
            }
        }
        if (type === 'STOP_MARKET') {
            request['stop_price'] = this.priceToPrecision (symbol, price);
            request['quantity'] = this.amountToPrecision (symbol, amount);
        }
        if (type === 'INSTANT') {
            request['amount'] = this.priceToPrecision (symbol, amount);
        }
        const response = await this.v3PrivatePostOrders (this.extend (request, params));
        // {
        //     "id": 1234567890,
        //     "sn": "OKMAKSDHRVVREK",
        //     "client_order_id": "451637946501"
        // }
        return this.parseOrder (response, market);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<{}> {
        /**
         * @method
         * @name foxbit#cancelOrders
         * @description Cancel open orders.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_cancel
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {
            'id': id,
            'type': 'ID',
        };
        const response = await this.v3PrivatePutOrdersCancel (this.extend (request, params));
        // {
        //     "data": [
        //         {
        //         "sn": "OKMAKSDHRVVREK",
        //         "id": 123456789
        //         }
        //     ]
        // }
        const data = this.safeList (response, 'data', []);
        const result = this.safeValue (data, 0, {});
        return this.parseOrder (result);
    }

    async cancelAllOrders (symbol: Str = undefined, params = {}): Promise<{}> {
        /**
         * @method
         * @name foxbit#cancelAllOrders
         * @description Cancel all open orders or all open orders for a specific market.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_cancel
         * @param {string} symbol unified market symbol of the market to cancel orders in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {
            'type': 'ALL',
        };
        if (symbol !== undefined) {
            const market = this.market (symbol);
            request['type'] = 'MARKET';
            request['market_symbol'] = market['baseId'] + market['quoteId'];
        }
        const response = await this.v3PrivatePutOrdersCancel (this.extend (request, params));
        // {
        //     "data": [
        //         {
        //           "sn": "OKMAKSDHRVVREK",
        //           "id": 123456789
        //         }
        //     ]
        // }
        return this.safeOrder ({
            'info': response,
        });
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name foxbit#fetchOrder
         * @description Get an order by ID.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_findByOrderId
         * @param {string} symbol it is not used in the foxbit API
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {
            'id': id,
        };
        const response = await this.v3PrivateGetOrdersByOrderIdId (this.extend (request, params));
        // {
        //     "id": "1234567890",
        //     "sn": "OKMAKSDHRVVREK",
        //     "client_order_id": "451637946501",
        //     "market_symbol": "btcbrl",
        //     "side": "BUY",
        //     "type": "LIMIT",
        //     "state": "ACTIVE",
        //     "price": "290000.0",
        //     "price_avg": "295333.3333",
        //     "quantity": "0.42",
        //     "quantity_executed": "0.41",
        //     "instant_amount": "290.0",
        //     "instant_amount_executed": "290.0",
        //     "created_at": "2021-02-15T22:06:32.999Z",
        //     "trades_count": "2",
        //     "remark": "A remarkable note for the order.",
        //     "funds_received": "290.0"
        // }
        return this.parseOrder (response, undefined);
    }

    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name foxbit#fetchOrdersByStatus
         * @description Fetch a list of orders.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_listOrders
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of orders to retrieve
         * @param {string} [params.state] Enum: ACTIVE, CANCELED, FILLED, PARTIALLY_CANCELED, PARTIALLY_FILLED
         * @param {string} [params.side] Enum: BUY, SELL
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        let market = undefined;
        const request: Dict = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['market_symbol'] = market['baseId'] + market['quoteId'];
        }
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 100) {
                request['page_size'] = 100;
            }
        }
        const response = await this.v3PrivateGetOrders (this.extend (request, params));
        // {
        //     "data": [
        //         {
        //         "id": "1234567890",
        //         "sn": "OKMAKSDHRVVREK",
        //         "client_order_id": "451637946501",
        //         "market_symbol": "btcbrl",
        //         "side": "BUY",
        //         "type": "LIMIT",
        //         "state": "ACTIVE",
        //         "price": "290000.0",
        //         "price_avg": "295333.3333",
        //         "quantity": "0.42",
        //         "quantity_executed": "0.41",
        //         "instant_amount": "290.0",
        //         "instant_amount_executed": "290.0",
        //         "created_at": "2021-02-15T22:06:32.999Z",
        //         "trades_count": "2",
        //         "remark": "A remarkable note for the order.",
        //         "funds_received": "290.0"
        //         }
        //     ]
        // }
        const list = this.safeList (response, 'data', []);
        return this.parseOrders (list, market, since, limit);
    }

    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name foxbit#fetchMyTrades
         * @description Trade history queries will only have data available for the last 3 months, in descending order (most recents trades first).
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/TradesController_all
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trade structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.order_id] The specific order ID identification you want to filter.
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchMyTrades() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'market_symbol': market['baseId'] + market['quoteId'],
        };
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 100) {
                request['page_size'] = 100;
            }
        }
        const response = await this.v3PrivateGetTrades (this.extend (request, params));
        // {
        //     "data": [
        //         "id": 1234567890,
        //         "sn": "TC5JZVW2LLJ3IW",
        //         "order_id": 1234567890,
        //         "market_symbol": "btcbrl",
        //         "side": "BUY",
        //         "price": "290000.0",
        //         "quantity": "1.0",
        //         "fee": "0.01",
        //         "fee_currency_symbol": "btc",
        //         "created_at": "2021-02-15T22:06:32.999Z"
        //     ]
        // }
        const data = this.safeList (response, 'data', []);
        return this.parseTrades (data, market, since, limit);
    }

    async fetchDepositAddress (code: string, params = {}) {
        /**
         * @method
         * @name foxbit#fetchDepositAddress
         * @description Fetch the deposit address for a currency associated with this account.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Deposit/operation/DepositsController_depositAddress
         * @param {string} code unified currency code
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.network_code] the blockchain network to create a deposit address on
         * @returns {object} an [address structure]{@link https://docs.ccxt.com/#/?id=address-structure}
         */
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'currency_symbol': currency['id'],
        };
        const response = await this.v3PrivateGetDepositsAddress (this.extend (request, params));
        // {
        //     "currency_symbol": "btc",
        //     "address": "2N9sS8LgrY19rvcCWDmE1ou1tTVmqk4KQAB",
        //     "message": "Address was retrieved successfully",
        //     "destination_tag": "string",
        //     "network": {
        //         "name": "Bitcoin Network",
        //         "code": "btc"
        //     }
        // }
        return this.parseDepositAddress (response, currency);
    }

    async fetchDeposits (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        /**
         * @method
         * @name foxbit#fetchDeposits
         * @description Fetch all deposits made to an account.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Deposit/operation/DepositsController_listOrders
         * @param {string} [code] unified currency code
         * @param {int} [since] the earliest time in ms to fetch deposits for
         * @param {int} [limit] the maximum number of deposit structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 100) {
                request['page_size'] = 100;
            }
        }
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        const response = await this.v3PrivateGetDeposits (this.extend (request, params));
        // {
        //     "data": [
        //         {
        //             "sn": "OKMAKSDHRVVREK",
        //             "state": "ACCEPTED",
        //             "currency_symbol": "btc",
        //             "amount": "1.0",
        //             "fee": "0.1",
        //             "created_at": "2022-02-18T22:06:32.999Z",
        //             "details_crypto": {
        //                 "transaction_id": "e20f035387020c5d5ea18ad53244f09f3",
        //                 "receiving_address": "2N2rTrnKEFcyJjEJqvVjgWZ3bKvKT7Aij61"
        //             }
        //         }
        //     ]
        // }
        const data = this.safeList (response, 'data', []);
        return this.parseTransactions (data, currency, since, limit);
    }

    async fetchWithdrawals (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        /**
         * @method
         * @name foxbit#fetchWithdrawals
         * @description Fetch all withdrawals made from an account.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Withdrawal/operation/WithdrawalsController_listWithdrawals
         * @param {string} [code] unified currency code
         * @param {int} [since] the earliest time in ms to fetch withdrawals for
         * @param {int} [limit] the maximum number of withdrawal structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        await this.loadMarkets ();
        const request: Dict = {};
        let currency = undefined;
        if (code !== undefined) {
            currency = this.currency (code);
        }
        if (limit !== undefined) {
            request['page_size'] = limit;
            if (limit > 100) {
                request['page_size'] = 100;
            }
        }
        if (since !== undefined) {
            request['start_time'] = this.iso8601 (since);
        }
        const response = await this.v3PrivateGetWithdrawals (this.extend (request, params));
        // {
        //     "data": [
        //         {
        //             "sn": "OKMAKSDHRVVREK",
        //             "state": "ACCEPTED",
        //             "rejection_reason": "monthly_limit_exceeded",
        //             "currency_symbol": "btc",
        //             "amount": "1.0",
        //             "fee": "0.1",
        //             "created_at": "2022-02-18T22:06:32.999Z",
        //             "details_crypto": {
        //                 "transaction_id": "e20f035387020c5d5ea18ad53244f09f3",
        //                 "destination_address": "2N2rTrnKEFcyJjEJqvVjgWZ3bKvKT7Aij61"
        //             },
        //             "details_fiat": {
        //                 "bank": {
        //                     "code": "1",
        //                     "branch": {
        //                         "number": "1234567890",
        //                         "digit": "1"
        //                     },
        //                     "account": {
        //                         "number": "1234567890",
        //                         "digit": "1",
        //                         "type": "CHECK"
        //                     }
        //                 }
        //             }
        //         }
        //     ]
        // }
        const data = this.safeList (response, 'data', []);
        return this.parseTransactions (data, currency, since, limit);
    }

    async fetchTransactions (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Transaction[]> {
        /**
         * @method
         * @name foxbit#fetchTransactions
         * @description Fetch all transactions (deposits and withdrawals) made from an account.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Withdrawal/operation/WithdrawalsController_listWithdrawals
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Deposit/operation/DepositsController_listOrders
         * @param {string} [code] unified currency code
         * @param {int} [since] the earliest time in ms to fetch withdrawals for
         * @param {int} [limit] the maximum number of withdrawal structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [transaction structures]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        const withdrawals = await this.fetchWithdrawals (code, since, limit, params);
        const deposits = await this.fetchDeposits (code, since, limit, params);
        const allTransactions = this.arrayConcat (withdrawals, deposits);
        const result = this.sortBy (allTransactions, 'timestamp');
        return result;
    }

    async fetchStatus (params = {}) {
        /**
         * @method
         * @name foxbit#fetchStatus
         * @description The latest known information on the availability of the exchange API.
         * @see https://status.foxbit.com/
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [status structure]{@link https://docs.ccxt.com/#/?id=exchange-status-structure}
         */
        const response = await this.statusGetStatus (params);
        // {
        //     "data": {
        //       "id": 1,
        //       "attributes": {
        //         "status": "NORMAL",
        //         "createdAt": "2023-05-17T18:37:05.934Z",
        //         "updatedAt": "2024-04-17T02:33:50.945Z",
        //         "publishedAt": "2023-05-17T18:37:07.653Z",
        //         "locale": "pt-BR"
        //       }
        //     },
        //     "meta": {
        //     }
        // }
        const data = this.safeValue (response, 'data', {});
        const attributes = this.safeValue (data, 'attributes', {});
        const statusRaw = this.safeString (attributes, 'status');
        const statusMap = {
            'NORMAL': 'ok',
            'UNDER_MAINTENANCE': 'maintenance',
        };
        return {
            'status': this.safeString (statusMap, statusRaw, statusRaw),
            'updated': this.safeString (attributes, 'updatedAt'),
            'eta': undefined,
            'url': undefined,
            'info': response,
        };
    }

    async editOrder (id: string, symbol: string, type: OrderType, side: OrderSide, amount: Num = undefined, price: Num = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name foxbit#editOrder
         * @description Simultaneously cancel an existing order and create a new one.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Trading/operation/OrdersController_cancelReplace
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of the currency you want to trade in units of the base currency
         * @param {float} [price] the price at which the order is to be fullfilled, in units of the quote currency, ignored in market orders, used as stop_price on stop market orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' editOrder() requires a symbol argument');
        }
        const validOrderTypes = [ 'LIMIT', 'MARKET', 'STOP_MARKET', 'INSTANT' ];
        const isOrderTypeValid = validOrderTypes.indexOf (type) >= 0;
        type = type.toUpperCase ();
        if (!isOrderTypeValid) {
            throw new InvalidOrder ('Invalid order type: ' + type + '. Must be one of ' + validOrderTypes.join (', ') + '.');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request: Dict = {
            'mode': 'ALLOW_FAILURE',
            'cancel': {
                'type': 'ID',
                'id': id,
            },
            'create': {
                'type': type,
                'side': side.toUpperCase (),
                'market_symbol': market['baseId'] + market['quoteId'],
            },
        };
        if (type === 'LIMIT' || type === 'MARKET') {
            request['create']['quantity'] = this.amountToPrecision (symbol, amount);
            if (type === 'LIMIT') {
                request['create']['price'] = this.priceToPrecision (symbol, price);
            }
        }
        if (type === 'STOP_MARKET') {
            request['create']['stop_price'] = this.priceToPrecision (symbol, price);
            request['create']['quantity'] = this.amountToPrecision (symbol, amount);
        }
        if (type === 'INSTANT') {
            request['create']['amount'] = this.priceToPrecision (symbol, amount);
        }
        let response = undefined;
        response = await this.v3PrivatePostOrdersCancelReplace (this.extend (request, params));
        // {
        //     "cancel": {
        //         "id": 123456789
        //     },
        //     "create": {
        //         "id": 1234567890,
        //         "client_order_id": "451637946501"
        //     }
        // }
        return this.parseOrder (response['create'], market);
    }

    async withdraw (code: string, amount: number, address: string, tag = undefined, params = {}) {
        /**
         * @method
         * @name foxbit#withdraw
         * @description Make a withdrawal.
         * @see https://docs.foxbit.com.br/rest/v3/#tag/Withdrawal/operation/WithdrawalsController_createWithdrawal
         * @param {string} code unified currency code
         * @param {float} amount the amount to withdraw
         * @param {string} address the address to withdraw to
         * @param {string} tag
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.network_code] unified network code
         * @returns {object} a [transaction structure]{@link https://docs.ccxt.com/#/?id=transaction-structure}
         */
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'currency_symbol': currency['id'],
            'amount': this.numberToString (amount),
            'destination_address': address,
            'destination_tag': tag,
        };
        const response = await this.v3PrivatePostWithdrawals (this.extend (request, params));
        // {
        //     "amount": "1",
        //     "currency_symbol": "xrp",
        //     "network_code": "ripple",
        //     "destination_address": "0x1234567890123456789012345678",
        //     "destination_tag": "123456"
        // }
        return this.parseTransaction (response);
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        const marketId = this.safeString (ticker, 'market_symbol');
        const symbol = this.safeSymbol (marketId, market, undefined, 'spot');
        const rolling_24h = ticker['rolling_24h'];
        const best = this.safeDict (ticker, 'best');
        const bestAsk = this.safeDict (best, 'ask');
        const bestBid = this.safeDict (best, 'bid');
        const lastTrade = ticker['last_trade'];
        const lastPrice = this.safeString (lastTrade, 'price');
        return this.safeTicker ({
            'symbol': symbol,
            'timestamp': this.parseDate (lastTrade['date']),
            'datetime': this.iso8601 (this.parseDate (lastTrade['date'])),
            'high': this.safeNumber (rolling_24h, 'high'),
            'low': this.safeNumber (rolling_24h, 'low'),
            'bid': this.safeNumber (bestBid, 'price'),
            'bidVolume': this.safeNumber (bestBid, 'volume'),
            'ask': this.safeNumber (bestAsk, 'price'),
            'askVolume': this.safeNumber (bestAsk, 'volume'),
            'vwap': undefined,
            'open': this.safeNumber (rolling_24h, 'open'),
            'close': lastPrice,
            'last': lastPrice,
            'previousClose': undefined,
            'change': this.safeString (rolling_24h, 'price_change'),
            'percentage': this.safeString (rolling_24h, 'price_change_percent'),
            'average': undefined,
            'baseVolume': this.safeString (rolling_24h, 'volume'),
            'quoteVolume': undefined,
            'info': ticker,
        }, market);
    }

    parseOHLCV (ohlcv): OHLCV {
        return [
            this.safeInteger (ohlcv, 0),
            this.safeFloat (ohlcv, 1),
            this.safeFloat (ohlcv, 2),
            this.safeFloat (ohlcv, 3),
            this.safeFloat (ohlcv, 4),
            this.safeFloat (ohlcv, 6),
        ];
    }

    parseTrade (trade, market = undefined): Trade {
        const timestamp = this.parseDate (this.safeString (trade, 'created_at'));
        const price = this.safeNumber (trade, 'price');
        const amount = this.safeNumber (trade, 'volume', this.safeNumber (trade, 'quantity'));
        const privateSideField = this.safeStringLower (trade, 'side');
        const side = this.safeStringLower (trade, 'taker_side', privateSideField);
        const cost = amount * price;
        const fee = {
            'currency': this.safeSymbol (this.safeString (trade, 'fee_currency_symbol')),
            'cost': this.safeNumber (trade, 'fee'),
            'rate': undefined,
        };
        return {
            'id': this.safeString (trade, 'id'),
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': undefined,
            'type': undefined,
            'side': side,
            'takerOrMaker': undefined,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        };
    }

    parseOrderStatus (status: Str) {
        const statuses: Dict = {
            'PARTIALLY_CANCELED': 'open',
            'ACTIVE': 'open',
            'PARTIALLY_FILLED': 'open',
            'FILLED': 'closed',
            'CANCELED': 'canceled',
        };
        return this.safeString (statuses, status, status);
    }

    parseOrder (order, market = undefined): Order {
        let symbol = this.safeString (order, 'market_symbol');
        if (market === undefined && symbol !== undefined) {
            market = this.market (symbol);
        }
        if (market !== undefined) {
            symbol = market['symbol'];
        }
        const timestamp = this.parseDate (this.safeString (order, 'created_at'));
        const price = this.safeNumber (order, 'price');
        const filled = this.safeNumber (order, 'quantity_executed');
        const remaining = this.safeNumber (order, 'quantity');
        let amount = undefined;
        if (remaining !== undefined && filled !== undefined) {
            amount = remaining + filled;
        }
        return {
            'id': this.safeString (order, 'id'),
            'info': order,
            'clientOrderId': this.safeString (order, 'client_order_id'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'status': this.parseOrderStatus (this.safeString (order, 'state')),
            'symbol': this.safeString (market, 'symbol'),
            'type': this.safeString (order, 'type'),
            'timeInForce': undefined,
            'postOnly': undefined,
            'reduceOnly': undefined,
            'side': this.safeStringLower (order, 'side'),
            'price': price,
            'triggerPrice': undefined,
            'takeProfitPrice': undefined,
            'stopLossPrice': undefined,
            'cost': this.safeNumber (order, 'funds_received'),
            'average': this.safeNumber (order, 'price_avg'),
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'trades': undefined,
            'fee': {
                'currency': undefined,
                'cost': undefined,
            },
        };
    }

    parseDepositAddress (depositAddress, currency: Currency = undefined) {
        const network = this.safeDict (depositAddress, 'network');
        return {
            'address': this.safeString (depositAddress, 'address'),
            'tag': this.safeString (depositAddress, 'tag'),
            'currency': this.safeCurrencyCode (undefined, currency),
            'network': this.safeStringUpper (network, 'code'),
            'info': depositAddress,
        };
    }

    parseTransactionStatus (status: Str) {
        const statuses: Dict = {
            // BOTH
            'SUBMITTING': 'pending',
            'SUBMITTED': 'pending',
            'REJECTED': 'failed',
            // DEPOSIT-SPECIFIC
            'CANCELLED': 'canceled',
            'ACCEPTED': 'ok',
            'WARNING': 'pending',
            'UNBLOCKED': 'pending',
            'BLOCKED': 'pending',
            // WITHDRAWAL-SPECIFIC
            'PROCESSING': 'pending',
            'CANCELED': 'canceled',
            'FAILED': 'failed',
            'DONE': 'ok',
        };
        return this.safeString (statuses, status, status);
    }

    parseTransaction (transaction, currency: Currency = undefined, since: Int = undefined, limit: Int = undefined): Transaction {
        const cryptoDetails = this.safeDict (transaction, 'details_crypto');
        const address = this.safeString2 (cryptoDetails, 'receiving_address', 'destination_address');
        const sn = this.safeString (transaction, 'sn');
        const snPrefix = sn[0];
        const type = snPrefix === 'W' ? 'withdrawal' : 'deposit';
        const fee = this.safeNumber (transaction, 'fee');
        const amount = this.safeNumber (transaction, 'amount');
        const currencySymbol = this.safeString (transaction, 'currency_symbol');
        let actualAmount = amount;
        const currencyCode = this.safeCurrencyCode (currencySymbol);
        const status = this.parseTransactionStatus (this.safeString (transaction, 'state'));
        const created_at = this.safeString (transaction, 'created_at');
        const timestamp = this.parseDate (created_at);
        const datetime = this.iso8601 (timestamp);
        if (fee !== undefined && amount !== undefined) {
            actualAmount = amount - fee;
        }
        const feeObj = {
            'cost': fee,
            'currency': currencyCode,
        };
        feeObj['rate'] = feeObj['cost'] / actualAmount;
        return {
            'info': transaction,
            'id': this.safeString (transaction, 'sn'),
            'txid': this.safeString (cryptoDetails, 'transaction_id'),
            'timestamp': timestamp,
            'datetime': datetime,
            'network': this.safeString (transaction, 'network_code'),
            'address': address,
            'addressTo': address,
            'addressFrom': undefined,
            'tag': this.safeString (transaction, 'destination_tag'),
            'tagTo': this.safeString (transaction, 'destination_tag'),
            'tagFrom': undefined,
            'type': type,
            'amount': actualAmount,
            'currency': currencyCode,
            'status': status,
            'updated': undefined,
            'fee': feeObj,
            'comment': undefined,
            'internal': undefined,
        };
    }

    sign (path, api: string[] | string = [], method = 'GET', params = {}, headers = undefined, body = undefined) {
        const version = api[0];
        let urlPath = api[1];
        let fullPath = '/rest/' + version + '/' + this.implodeParams (path, params);
        if (api === 'status') {
            fullPath = '/status';
            urlPath = 'status';
        }
        let url = this.urls['api'][urlPath] + fullPath;
        params = this.omit (params, this.extractParams (path));
        const timestamp = this.now ();
        let query = '';
        let signatureQuery = '';
        if (method === 'GET') {
            const paramKeys = Object.keys (params);
            if (paramKeys.length > 0) {
                query = this.urlencode (params);
                url += '?' + query;
            }
            for (let i = 0; i < paramKeys.length; i++) {
                const key = paramKeys[i];
                signatureQuery += key + '=' + params[key];
                if (i < paramKeys.length - 1) {
                    signatureQuery += '&';
                }
            }
        }
        if (method === 'POST' || method === 'PUT') {
            body = this.json (params);
        }
        let bodyToSignature = '';
        if (body !== undefined) {
            bodyToSignature = body;
        }
        headers = {
            'Content-Type': 'application/json',
        };
        if (urlPath === 'private') {
            const preHash = timestamp + method + fullPath + signatureQuery + bodyToSignature;
            const signature = this.hmac (preHash, this.secret, sha256, 'hex');
            headers['X-FB-ACCESS-KEY'] = this.apiKey;
            headers['X-FB-ACCESS-TIMESTAMP'] = this.numberToString (timestamp);
            headers['X-FB-ACCESS-SIGNATURE'] = signature;
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
}
