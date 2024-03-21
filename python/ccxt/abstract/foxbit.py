from ccxt.base.types import Entry

class ImplicitAPI:
    public_get_public_markets = publicGetMarkets = Entry('markets', 'public', 'GET', {})
    public_get_public_currencies = publicGetCurrencies = Entry('currencies', 'public', 'GET', {})
