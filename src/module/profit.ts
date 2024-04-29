/* eslint-disable arrow-parens */
import { ammContextModule } from "../mongo_module/amm_context";
import { logger } from "../sys_lib/logger";
import { AmmContext } from "../interface/context";
import { SystemMath } from "../utils/system_math";
import { ProfitHelper } from "./profit_helper";
import * as _ from "lodash";

import {
  IProfit,
  IProfitAssetsRecord,
  IProfitOrderRecord,
} from "./profit_interface";
import { Mdb } from "./database/mdb";

const profitHelper = new ProfitHelper();

class Profit {
  public async process() {
    await this.scanContext();
  }

  private async scanContext() {
    try {
      const findOpt = {
        flowStatus: {
          $in: ["HedgeCompletion"],
        },
      };
      const ammContextList: AmmContext[] = await ammContextModule
        .find(findOpt)
        .lean();
      logger.debug(findOpt, "found several records?", ammContextList.length);
      if (!ammContextList || ammContextList.length === 0) {
        logger.info(`did not find suitable records`);
        return;
      }
      logger.info(`loaded ${ammContextList.length} records for processing`);
      await this.processList(ammContextList);
    } catch (e) {
      logger.error(e);
    }
  }
  private async processList(ammContextList: AmmContext[]) {
    try {
      for (let i = 0; i < ammContextList.length; i++) {
        await this.processItem(ammContextList[i]);
      }
    } catch (e) {
      logger.error(`an error occurred in the processing queue`, e);
    }
  }

  private async processItem(ammContext: AmmContext) {
    const raw_id = _.get(ammContext, "_id", "");
    logger.info(raw_id.toString());

    const report = await this.createNewProfitReport(ammContext, raw_id);
    // this.process_setRawPrice(ammContext, report);
    let targetStatus = "HedgeAnalyzeCompletion";
    const appName = _.get(process.env, "APP_NAME", "").replace("-analyze", "");
    try {
      this.process_userInput(ammContext, report);
      this.process_scrChainInfo(ammContext, report);
      this.process_dstChainInfo(ammContext, report);
      this.process_cexInfo(ammContext, report);
      console.log(JSON.stringify(report));
      // console.dir(report, { depth: null });
      await Mdb.getInstance()
        .getMongoDb("business")
        .collection("amm_business")
        .insertOne(report);
    } catch (e) {
      logger.error(e);
      targetStatus = "HedgeAnalyzeError";
      throw e;
    } finally {
      console.log(`processing has been completed...`, {
        flowStatus: targetStatus,
      });
      await Mdb.getInstance()
        .getMongoDb("main")
        .collection(`ammContext_${appName}`)
        .updateOne(
          {
            _id: raw_id,
          },
          {
            $set: { flowStatus: targetStatus },
          }
        );
    }
  }

  private async createNewProfitReport(
    ammContext: AmmContext,
    raw_id: string
  ): Promise<IProfit> {
    const profit = {
      raw_id,
      priceInfo: {
        coinPrice: ammContext.quoteInfo.price,
        coinOrigPrice: ammContext.quoteInfo.origPrice,
        nativeCoinPrice: ammContext.quoteInfo.native_token_price,
        nativeCoinOrigPrice: ammContext.quoteInfo.native_token_orig_price,
        hedgeFeePrice: ammContext.quoteInfo.hedge_fee_asset_price,
        hedgeFeeCoin: ammContext.quoteInfo.hedge_fee_asset,
      },
      userInput: {
        amount: 0,
        assets: "",
        tokenName: "",
      },
      srcChainInfo: {
        received: [],
        systemDeduct: [],
      },
      dstChainInfo: {
        send: [],
        systemDeduct: [],
      },
      cexInfo: {
        assetsList: [],
        hedgePlan: [],
        orders: [],
      },
      profit: {
        recode: [],
      },
    };
    return profit;
  }

  private process_userInput(ammContext, report: IProfit) {
    const srcSymbol = ammContext.baseInfo.srcToken.symbol;
    report.userInput.assets = srcSymbol;
    report.userInput.amount = ammContext.swapInfo.inputAmountNumber;
  }
  private process_scrChainInfo(ammContext: AmmContext, report: IProfit) {
    const srcSymbol = ammContext.baseInfo.srcToken.symbol;
    const srcChainSystemFee = profitHelper.getSystemSrcChainFee(ammContext);
    const receive = {
      amount: SystemMath.execNumber(
        `${ammContext.swapInfo.inputAmountNumber} *  (1-${srcChainSystemFee})`
      ),
      assets: srcSymbol,
    };
    report.srcChainInfo.received.push(receive);
    const systemDeductRecord = {
      amount: SystemMath.execNumber(
        `${ammContext.swapInfo.inputAmountNumber} * ${srcChainSystemFee}`
      ),
      assets: srcSymbol,
      fee: _.attempt((): any => {
        return `${srcChainSystemFee * 100}%`;
      }),
    };
    report.srcChainInfo.systemDeduct.push(systemDeductRecord);
  }

  private process_dstChainInfo(ammContext: AmmContext, report: IProfit) {
    const sendTokenRecord = {
      amount: ammContext.chainOptInfo.dstChainPayAmountNumber,
      assets: ammContext.baseInfo.dstToken.symbol,
    };
    report.dstChainInfo.send.push(sendTokenRecord);
    const sendGasTokenRecord = {
      amount: ammContext.chainOptInfo.dstChainPayNativeTokenAmountNumber,
      assets: ammContext.baseInfo.dstChain.tokenName,
    };
    report.dstChainInfo.send.push(sendGasTokenRecord);
    const dstChainSystemFee = profitHelper.getSystemDstChainFee(ammContext);
    const systemDeductRecord = {
      amount: SystemMath.execNumber(
        `${ammContext.swapInfo.inputAmountNumber} * ${ammContext.quoteInfo.origPrice} * ${dstChainSystemFee}`
      ),
      assets: ammContext.baseInfo.dstToken.symbol,
      fee: _.attempt((): any => {
        return `${dstChainSystemFee * 100}%`;
      }),
    };
    report.dstChainInfo.systemDeduct.push(systemDeductRecord);
  }

  private process_cexInfo(ammContext: AmmContext, report: IProfit) {
    const assetsChangeList: IProfitAssetsRecord[] = [];
    if (!_.isArray(ammContext.systemOrder.hedgeResult)) {
      logger.warn(`hedge result it's not an array`);
      return;
    }
    ammContext.systemOrder.hedgeResult.forEach((orderRaw) => {
      console.dir(orderRaw);
      profitHelper.getAssetsRecord(orderRaw).forEach((assetsChangeItem) => {
        assetsChangeList.push(assetsChangeItem);
      });
    });
    report.cexInfo.assetsList = assetsChangeList;
    // hedgePlan
    report.cexInfo.hedgePlan = ammContext.systemOrder.hedgePlan;
    // orderRecord
    const orderList: IProfitOrderRecord[] = [];
    ammContext.systemOrder.hedgeResult.forEach((orderRaw) => {
      const orderErr = _.get(orderRaw, "error");
      const status = _.get(orderRaw, "status");
      if (status === 0 || orderErr !== "") {
        // this is a wrong order
        const errOrder = profitHelper.getErrorOrderStruct(orderRaw);
        orderList.push(errOrder);
        return;
      }
      orderList.push({
        amount: _.get(orderRaw, "result.amount"),
        averagePrice: _.get(orderRaw, "result.averagePrice", "0"),
        slippage: profitHelper.getSlippage(orderRaw),
        fee: _.get(orderRaw, "result.fee"),
        symbol: _.get(orderRaw, "result.stdSymbol"),
        clientOrderId: _.get(orderRaw, "result.clientOrderId"),
        status: _.get(orderRaw, "status", 0),
        errMsg: _.get(orderRaw, "error", "failed to obtain the error"),
      });
    });
    report.cexInfo.orders = orderList;
  }
}

const profit: Profit = new Profit();
export { Profit, profit };
