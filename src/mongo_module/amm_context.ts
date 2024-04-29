import { Schema } from "mongoose";
import { Mdb } from "../module/database/mdb";
import * as _ from "lodash";
import { logger } from "../sys_lib/logger";

const dbKey = "main";
const mongoConn = Mdb.getInstance().getMongoDb(dbKey);
const ammContextSchema = new Schema({
  summary: String,
  systemContext: Object,
  chainOptInfo: Object,
  systemInfo: Object,
  walletInfo: Object,
  AskInfo: Object,
  baseInfo: Object,
  swapInfo: Object,
  quoteInfo: Object,
  askTime: Object,
  systemOrder: Object,
  lockInfo: Object,
  tradeStatus: Number,
  profitStatus: Number,
  flowStatus: String,
});

ammContextSchema.index({ "systemOrder.id": 1, type: -1 });
ammContextSchema.index({ tradeStatus: 1, type: -1 });
ammContextSchema.index({ profitStatus: 1, type: -1 });
logger.info(
  "init module",
  `ammContext_${_.get(process.env, "APP_NAME", "").replace("-analyze", "")}`
);
export const ammContextModule = mongoConn.model(
  "ammContextModule",
  ammContextSchema,
  `ammContext_${_.get(process.env, "APP_NAME", "").replace("-analyze", "")}`
);
