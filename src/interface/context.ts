import { IBridgeTokenConfigItem } from "./interface";

interface AmmContext {
  summary: string;
  bridgeItem: IBridgeTokenConfigItem;
  step: number; // which step are we currently at
  systemInfo: {
    msmqName: string;
  };
  walletInfo: {
    walletName: string;
  };
  AskInfo: {
    cid: string;
  };
  baseInfo: {
    fee: number;
    srcChain: {
      id: number;
      tokenName: string;
    };
    dstChain: {
      id: number;
      tokenName: string;
    };
    srcToken: {
      precision: number;
      cexPrecision: number;
      address: string;
      coinType: string;
      symbol: string;
      chainId: number;
    };
    dstToken: {
      precision: number;
      cexPrecision: number;
      address: string;
      coinType: string;
      symbol: string;
      chainId: number;
    };
  };
  swapInfo: {
    inputAmount: string; //  input quantity from the frontend
    inputAmountNumber: number;
    systemSrcFee: number; // starts to have a value after Lock
    systemDstFee: number; // starts to have a value after Lock
    lpReceiveAmount: number; // actual amount received by Lp
    srcAmount: string; // actual amount received
    srcAmountNumber: number;
    dstAmount: string; // actual amount transferred
    dstAmountNumber: number;
  };
  chainOptInfo: {
    srcChainReceiveAmount: string; // actual amount transferred in on Chain A
    srcChainReceiveAmountNumber: number; // actual amount transferred in on Chain A
    dstChainPayAmount: string; // B actual payment amount on the chain
    dstChainPayAmountNumber: number; // actual payment number on Chain B
    dstChainPayNativeTokenAmount: string;
    dstChainPayNativeTokenAmountNumber: number;
  };
  quoteInfo: {
    dst_usd_price: string;
    quote_hash: string;
    hedge_fee_asset;
    hedge_fee_asset_price: string;
    mode: string;
    origPrice: string;
    origTotalPrice: string;
    native_token_price: string;
    native_token_orig_price: string; // original price before deducting fees
    price: string; // quotation for 1
    native_token_usdt_price: string;
    src_usd_price: string; // U price of the left currency pair
    capacity_num: number; // maximum quantity for currency exchange on the left
  };
  lockInfo: {
    fee: string;
    dstTokenPrice: string; // U price of the target currency
    price: string; // original quotation, currency exchange price
    srcTokenPrice: string; // USDT price of the starting chain token
    nativeTokenPrice: string; // buying price of the native coin, generated during lock
    time: number;
  };
  askTime: number;
  systemOrder: {
    orderId: number;
    balanceLockedId: string; // mongoid of the lock
    bridgeConfig: any;
    hedgePlan: any[];
    hedgeResult: any[];
  };
  tradeStatus: number;
  profitStatus: number;
  systemContext: {
    lockStepInfo: any;
    transferoutConfirmInfo: any;
  };
}

export { AmmContext };
