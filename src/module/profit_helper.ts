import { AmmContext } from "../interface/context";
import * as _ from "lodash";
import { ISide } from "../interface/std_difi";
import { SystemMath } from "../utils/system_math";
import { parseOrderId } from "./exchange/utils";
import { logger } from "../sys_lib/logger";
import { IProfitAssetsRecord } from "./profit_interface";

class ProfitHelper {
  public getSystemSrcChainFee(ammContext: AmmContext): number {
    const fee = ammContext.swapInfo.systemSrcFee;
    if (!_.isFinite(fee)) {
      throw new Error(`incorrect fee`);
    }
    return fee;
  }
  public getSystemDstChainFee(ammContext: AmmContext): number {
    const fee = ammContext.swapInfo.systemDstFee;
    if (!_.isFinite(fee)) {
      throw new Error(`incorrect fee`);
    }
    return fee;
  }

  public getSlippage(orderRaw) {
    const clientOrderId = _.get(orderRaw, "result.clientOrderId", "");
    const origPrice = _.get(parseOrderId(clientOrderId), "price", "");
    const averagePrice = _.get(orderRaw, "result.average", 0);
    logger.debug(origPrice, averagePrice, "++++++++++++++++++");
    const slippage = SystemMath.execNumber(
      `abs(${origPrice}-${averagePrice}) /${origPrice}* 100`
    );
    let side = "-";
    if (origPrice > averagePrice) {
      side = "+";
    }
    return `${side}  ${slippage}%`;
  }
  public getErrorOrderStruct(orderRaw: any) {
    return {
      amount: 0,
      slippage: "",
      fee: {},
      symbol: _.get(orderRaw, "plan.symbol"),
      clientOrderId: _.get(orderRaw, "plan.orderId"),
      status: _.get(orderRaw, "status", 0),
      errMsg: _.get(orderRaw, "error", "failed to obtain the error"),
      averagePrice: "0",
    };
  }

  public getAssetsRecord(orderRaw) {
    const stdSymbol = _.get(orderRaw, "result.stdSymbol", "");
    const symbolInfo = stdSymbol.split("/");
    const side = _.get(orderRaw, "result.side", 0);
    const filled = _.get(orderRaw, "result.filled", 0);
    const average = _.get(orderRaw, "result.average", 0);
    console.dir(parseOrderId(_.get(orderRaw, "result.clientOrderId", "")));
    const result: IProfitAssetsRecord[] = [];
    const clientOrderId = _.get(orderRaw, "result.clientOrderId", 0);
    if (side === ISide.SELL) {
      result.push({
        side,
        stdSymbol,
        clientOrderId,
        cexOrderId: _.get(orderRaw, "result.orderId", ""),
        orderIdInfo: parseOrderId(clientOrderId),
        assets: symbolInfo[1],
        average,
        amount: SystemMath.execNumber(`${filled}*${average}`),
        action: "+",
        lostAmount: "0",
        isFee: false,
      });
      result.push({
        side,
        stdSymbol,
        clientOrderId,
        cexOrderId: _.get(orderRaw, "result.orderId", ""),
        orderIdInfo: parseOrderId(clientOrderId),
        assets: symbolInfo[0],
        average,
        amount: _.get(orderRaw, "result.filled", 0),
        action: "-",
        lostAmount: _.get(orderRaw, "result.lostAmount", ""),
        isFee: false,
      });
    }
    if (side === ISide.BUY) {
      result.push({
        side,
        stdSymbol,
        clientOrderId,
        cexOrderId: _.get(orderRaw, "result.orderId", ""),
        orderIdInfo: parseOrderId(clientOrderId),
        assets: symbolInfo[0],
        average,
        amount: _.get(orderRaw, "result.filled", 0),
        action: "+",
        lostAmount: _.get(orderRaw, "result.lostAmount", ""),
        isFee: false,
      });
      result.push({
        side,
        stdSymbol,
        clientOrderId,
        cexOrderId: _.get(orderRaw, "result.orderId", ""),
        orderIdInfo: parseOrderId(clientOrderId),
        assets: symbolInfo[1],
        average,
        amount: SystemMath.execNumber(`${filled}*${average}`),
        action: "-",
        lostAmount: "0",
        isFee: false,
      });
    }
    this.parseFeeRecord(orderRaw, result);
    return result;
  }
  private parseFeeRecord(orderRaw, assetsRecordList: any[]) {
    const stdSymbol = _.get(orderRaw, "result.stdSymbol", "");
    const side = _.get(orderRaw, "result.side", 0);
    const clientOrderId = _.get(orderRaw, "result.clientOrderId", 0);
    const average = _.get(orderRaw, "result.average", 0);
    logger.debug(orderRaw);
    const fee = _.get(orderRaw, "result.fee", {});
    logger.debug(fee);

    Object.keys(fee).forEach((feeItemKey: string) => {
      const feeResult = {
        side,
        stdSymbol,
        clientOrderId,
        cexOrderId: _.get(orderRaw, "result.orderId", ""),
        orderIdInfo: parseOrderId(clientOrderId),
        assets: feeItemKey,
        average,
        amount: _.get(fee, feeItemKey, 0),
        action: "-",
        lostAmount: _.get(orderRaw, "result.lostAmount", ""),
        isFee: true,
      };
      assetsRecordList.push(feeResult);
    });
  }
}

export { ProfitHelper };
