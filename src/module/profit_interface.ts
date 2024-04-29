import { ISide } from "../interface/std_difi";
interface IProfitOrderRecord {
  amount: number;
  symbol: string;
  slippage: string;
  fee: any;
  clientOrderId: string;
  status: number;
  errMsg: string;
  averagePrice: string; // average transaction price of the order
}
interface IProfitAssetsRecord {
  stdSymbol: string;
  side: string;
  clientOrderId: number;
  cexOrderId: string;
  assets: string;
  amount: number;
  des?: string;
  average: number;
  lostAmount: string;
  action: string;
  isFee: boolean;
  orderIdInfo: any;
}
interface IProfit {
  quoteInfo?: any;
  raw_id: string;
  priceInfo: {
    coinPrice: string;
    coinOrigPrice: string;
    nativeCoinPrice: string;
    nativeCoinOrigPrice: string;
  };
  userInput: {
    amount: number;
    assets: string;
    tokenName: string;
  };
  srcChainInfo: {
    received: {
      // assets from the originating chain's income
      amount: number;
      assets: string;
    }[];
    systemDeduct: {
      amount: number;
      assets: string;
      fee: string;
    }[];
  };
  dstChainInfo: {
    send: {
      amount: number;
      assets: string;
    }[];
    systemDeduct: {
      amount: number;
      assets: string;
      fee: string;
    }[];
  };
  cexInfo: {
    hedgePlan: {
      orderId: string;
      symbol: string;
      side: ISide;
      amount: string;
      amountNumber: number;
    }[];
    orders: IProfitOrderRecord[];
    assetsList: {
      assets: string;
      amount: number;
      des?: string;
      average: number;
    }[];
  };
  profit: {
    recode: {
      amount: number;
      assets: string;
      dst: string;
    }[];
  };
}
export { IProfitAssetsRecord, IProfit, IProfitOrderRecord };
