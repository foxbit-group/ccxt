from ccxt.base.types import Entry

class ImplicitAPI:
    public_get_public_markets = publicGetMarkets = Entry('markets', 'public', 'GET', {})
    public_get_public_currencies = publicGetCurrencies = Entry('currencies', 'public', 'GET', {})
    public_get_public_ticker = publicGetTicker = Entry('markets/{market_symbol}/candlesticks?interval={interval}&limit={limit}', 'public', 'GET', {})
    public_get_public_orderbook = publicGetOrderBook = Entry('markets/{market_symbol}/orderbook?depth={depth}', 'public', 'GET', {})
    private_get_private_balance = privateGetBalance = Entry('accounts', 'private', 'GET', {})