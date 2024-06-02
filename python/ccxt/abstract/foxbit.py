from ccxt.base.types import Entry


class ImplicitAPI:
    public_get_public_markets = publicGetMarkets = Entry('markets', 'public', 'GET', {})
    public_get_public_currencies = publicGetCurrencies = Entry('currencies', 'public', 'GET', {})
    # TODO: Candlesticks (ohlcv) é uma coisa e Ticker é outra, esse é ticker: https://docs.foxbit.com.br/rest/v3/#tag/Market-Data/operation/MarketsController_ticker
    public_get_public_ticker = publicGetTicker = Entry('markets/{market_symbol}/candlesticks?interval={interval}&limit={limit}', 'public', 'GET', {})
    public_get_public_orderbook = publicGetOrderBook = Entry('markets/{market_symbol}/orderbook?depth={depth}', 'public', 'GET', {})
    private_get_private_balance = privateGetBalance = Entry('accounts', 'private', 'GET', {})
    private_get_private_trades = privateGetTrades = Entry('trades?market_symbol={market_symbol}', 'private', 'GET', {})
    private_get_private_orders = privateGetOrders = Entry('orders?state={state}&market_symbol={market_symbol}&page_size={page_size}', 'private', 'GET', {})
    private_get_private_orders_w_state = privateGetOrdersWithoutState = Entry('orders?market_symbol={market_symbol}&page_size={page_size}', 'private', 'GET', {})
    private_get_private_order = privateGetOrder = Entry('orders/by-order-id/{order_id}', 'private', 'GET', {})
    private_post_private_create_order = privatePostOrderCreate = Entry('orders', 'private', 'POST', {})
    private_put_private_cancel_order = privateCancelOrder = Entry('orders/cancel', 'private', 'PUT', {})
    private_get_private_deposit_address = privateDepositAddress = Entry('deposits/address?currency_symbol={market_symbol}', 'private', 'GET', {})
    private_get_private_deposit = privateDeposit = Entry('deposits?page_size={limit}', 'private', 'GET', {})
    private_get_private_deposit_sn = privateDepositSn = Entry('deposits/{sn}', 'private', 'GET', {})
    private_get_private_withdrawals = privateWithdrawals = Entry('withdrawals', 'private', 'GET', {})
    private_port_private_withdrawals = privatePostWithdrawals = Entry('withdrawals', 'private', 'POST', {})
