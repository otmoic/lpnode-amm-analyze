import { IBridgeTokenConfigItem } from "../../interface/interface";
import { AmmContext } from "../../interface/context";
import BigNumber from "bignumber.js";
import { evaluate } from "mathjs";
import { logger } from "../../sys_lib/logger";
import * as _ from "lodash";

class LpWalletManager {
  // @ts-ignore
  private bridgeItem: IBridgeTokenConfigItem;

  constructor(item: IBridgeTokenConfigItem) {
    this.bridgeItem = item;
  }

  public async getReceivePrice(ammContext: AmmContext): Promise<number> {
    const inputAmountBN = new BigNumber(ammContext.swapInfo.inputAmountNumber);
    const systemSrcFee = new BigNumber(ammContext.swapInfo.systemSrcFee);
    const formula = `${inputAmountBN.toString()} - ( ${inputAmountBN.toString()} * ${systemSrcFee}) `;
    logger.info(formula);
    const lpReceive = evaluate(formula);
    logger.info("actual income of Lp wallet", formula, "result:", lpReceive);
    if (!_.isFinite(lpReceive)) {
      logger.error(`there is a calculation issue`, "isFinite");
    }
    return lpReceive;
  }
}

export { LpWalletManager };
