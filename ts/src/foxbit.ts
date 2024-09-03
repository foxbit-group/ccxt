import { ArgumentsRequired, InvalidOrder } from '../ccxt';
import Exchange from './abstract/foxbit';
import type { Currencies, Market, OrderBook, Dict, Ticker, TradingFees, Int, Str, Num, Trade, OHLCV, Balances, Order, OrderType, OrderSide, Strings, Tickers, Currency, Transaction } from './base/types.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';

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
            'rateLimit': 1000,
            'version': '1',
            'comment': 'Foxbit Exchange',
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
                        'get': [
                            'currencies',
                            'markets',
                            'markets/ticker/24hr',
                            'markets/{market}/orderbook',
                            'markets/{market}/candlesticks',
                            'markets/{market}/trades/history',
                            'markets/{market}/ticker/24hr',
                            'markets/{market}/orderbook',
                        ],
                    },
                    'private': {
                        'get': [
                            'accounts',
                            'orders',
                            'orders/by-order-id/{id}',
                            'trades',
                            'deposits/address',
                            'deposits',
                            'withdrawals',
                        ],
                        'post': [
                            'orders',
                            'orders/cancel-replace',
                            'withdrawals',
                        ],
                        'put': [
                            'orders/cancel',
                        ],
                    },
                },
                'status': {
                    'get': [
                        'status',
                    ],
                },
            },
            'has': {
                'CORS': true,
                'spot': true,
                'margin': undefined,
                'swap': undefined,
                'future': undefined,
                'option': undefined,
                'fetchMarkets': true,
                'fetchCurrencies': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fecthOrderBook': true,
                'fetchOHLCV': true,
                'fetchTrades': true,
                'fetchBalance': true,
                'createOrder': true,
                'cancelOrder': true,
                'cancelAllOrders': true,
                'fetchOrder': true,
                'fetchOrders': true,
                'fetchOpenOrders': true,
                'fetchClosedOrders': true,
                'fetchMyTrades': true,
                'fetchDeposits': true,
                'fetchWithdrawals': true,
                'fetchTransactions': true,
                'fetchDepositAddress': true,
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

    async fetchTradingLimits (symbols: string[], params: {}): Promise<{}> {
        return [];
    }

    async fetchTradingFees (params: {}): Promise<TradingFees> {
        return {};
    }

    async fetchOrderBook (symbol: string, limit: Int = 20, params = {}): Promise<OrderBook> {
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

    async fetchTrades (symbol: string, since?: number, limit?: number, params?: {}): Promise<Trade[]> {
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
        return this.fetchOrdersByStatus ('ACTIVE', symbol, since, limit, params);
    }

    async fetchClosedOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
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

    async fetchOrders (symbol?: string, since?: number, limit?: number, params?: {}): Promise<Order[]> {
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
        await this.loadMarkets ();
        const currency = this.currency (code);
        const request: Dict = {
            'currency_symbol': currency['id'],
        };
        // TODO: adicionar validações de networks válidas
        // -- ainda é preciso fazer a implementação das networks
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

    async fetchTransactions (code: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}) {
        const withdrawals = await this.fetchWithdrawals (code, since, limit, params);
        const deposits = await this.fetchDeposits (code, since, limit, params);
        const allTransactions = this.arrayConcat (withdrawals, deposits);
        const result = this.sortBy (allTransactions, 'timestamp');
        return result;
    }

    async fetchStatus (params = {}) {
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
        [ tag, params ] = this.handleWithdrawTagAndParams (tag, params);
        await this.loadMarkets ();
        const currency = this.currency (code);
        const networkCode = this.safeString (params, 'network_code');
        params = this.omit (params, 'network_code');
        const request: Dict = {
            'currency_symbol': currency['id'],
            'amount': this.numberToString (amount),
            'destination_address': address,
            'destination_tag': tag,
            'network_code': networkCode,
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

    sign (path, api: string | string[] = [], method = 'GET', params = {}, headers = undefined, body = undefined) {
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
        console.log ('OS PARAMS QUE CHEGARAM NO sign() FORAM', params);
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
        // ADICIONAR RAW BODY NA ASSINATURA QUANDO FOR POST
        const preHash = timestamp + method + fullPath + signatureQuery + bodyToSignature;
        console.log ('PRE HASH DA ASSINATURA:', preHash);
        const signature = this.hmac (preHash, this.secret, sha256, 'hex');
        console.log ('ASSINATURA DA REQUISIÇÃO:', signature);
        headers = {
            'Content-Type': 'application/json',
            'X-FB-ACCESS-KEY': this.apiKey,
            'X-FB-ACCESS-TIMESTAMP': this.numberToString (timestamp),
            'X-FB-ACCESS-SIGNATURE': signature,
        };
        console.log ('BODY DA REQUISIÇÃO:', body);
        console.log ('FAZENDO REQUISIÇÃO PARA A ROTA: ', url);
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }
}
