enum ICexExchangeList {
  "binance" = "binance",
}
// definitions related to balance________________________________________________________________________________
// definition of spot balance
interface ISpotBalanceItem {
  asset: string;
  free: string;
  locked: string;
}
// definition of U-denominated balance
interface IUsdtFutureBalanceItem {
  accountAlias: string; // "FzmYFzsRfWTisR";
  asset: string; // "BTC";
  balance: string; // "0.04377417";
  crossWalletBalance: string; // "0.04377417";
  availableBalance: string; // "0.56178156";
  maxWithdrawAmount: string; // "0.04377417";
  marginAvailable: boolean; // true;
}
// definition of coin-denominated balance
interface ICoinFutureBalanceItem {
  accountAlias: string; // "SgsR"; // unique account identification code
  asset: string; // "BTC"; // assets
  balance: string; // "0.00250000"; // account balance
  withdrawAvailable: string; // "0.00250000"; // maximum withdrawable amount
  crossWalletBalance: string; // "0.00241969"; // account balance
  crossUnPnl: string; // "0.00000000"; // unrealized profit and loss of full position
  availableBalance: string; // "0.00241969"; // available balance
}
// ________________________________________________________________________________

interface ISpotSymbolItem {
  symbol: string;
  status: string; // "TRADING";
  stdSymbol: string;
  baseAsset: string;
  quoteAsset: string;
  orderTypes: string[];
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
}

interface IUsdtFutureSymbolItem {
  symbol: string;
  status: string; // "TRADING";
  stdSymbol: string;
  symbolType: string;
  baseAsset: string;
  quoteAsset: string;
  orderTypes: string[];
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
}

interface ICoinFutureSymbolItem {
  symbol: string;
  status: string; // "TRADING";
  stdSymbol: string;
  symbolType: string;
  baseAsset: string;
  quoteAsset: string;
  orderTypes: string[];
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
}

enum ISide {
  BUY = "BUY",
  SELL = "SELL",
}

interface ISpotOrderResult {
  orderId: number;
  side: string;
  lostAmount: string; // loss of precision after lostsize filter
  origAmount: string;
  fee: { [key: string]: string };
  symbol: string; // "ETHUSDT"
  stdSymbol: string; // "ETH/USDT";
  type: string; // 'market', 'limit'
  amount: number;
  filled: number;
  remaining: number; // 0.4; // remaining amount to fill
  clientOrderId: string; // 'abcdef-ghijklmnop-qrstuvwxyz', // a user-defined clientOrderId, if any
  timestamp: number;
  averagePrice: string;
  lastTradeTimestamp: number;
  average: number; // float average filling price
  status: string; // 'open', 'closed', 'canceled', 'expired', 'rejected'
  timeInForce: string; // "GTC"; // 'GTC', 'IOC', 'FOK', 'PO'
  info: string; // original order information
}

interface ICexAccount {
  accountId: string;
  exchangeName: string; // binance huobi dex_bsc
  spotAccount: {
    apiKey: string;
    apiSecret: string;
  };
  usdtFutureAccount: {
    apiKey: string;
    apiSecret: string;
  };
  coinFutureAccount: {
    apiKey: string;
    apiSecret: string;
  };
  des?: string;
}

export {
  ICexExchangeList,
  ISpotOrderResult,
  ICexAccount,
  ISpotBalanceItem,
  ISpotSymbolItem,
  ISide,
  IUsdtFutureSymbolItem,
  IUsdtFutureBalanceItem,
  ICoinFutureBalanceItem,
  ICoinFutureSymbolItem,
};
