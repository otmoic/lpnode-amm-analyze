const fs = require("fs");
const path = require("path");
const envFile = fs.existsSync(path.join(__dirname, "env.js"));
if (envFile) {
  require("./env.js");
} else {
  console.log("env file does not exist");
}

// process.exit();
import { App } from "./app";

import { logger } from "./sys_lib/logger";
import * as _ from "lodash";

import { appEnv } from "./app_env";
appEnv.initConfig();
// import { dataConfig } from "./data_config";
import { Mdb } from "./module/database/mdb";
import { profit } from "./module/profit";
import { agenda } from "./profit_queue";

// @ts-ignore
const cTable = require("console.table");

class Main extends App {
  public constructor() {
    super();
  }

  public async main() {
    try {
      Mdb.getInstance().getMongoDb("main");
      await Mdb.getInstance().awaitDbConn("main");
      Mdb.getInstance().getMongoDb("business");
      await Mdb.getInstance().awaitDbConn("business");
      logger.debug(`database connection ready...`, "..");
    } catch (e) {
      logger.error("Error initializing database connection", e);
      process.exit(3);
    }

    agenda.define("analytics-task", async (job, done) => {
      try {
        logger.info(
          `ob time reached, starting execution`,
          new Date().getTime()
        );
        await profit.process();
        logger.info(`job already completed`);
      } catch (e) {
        logger.error(`error handling job`, e);
      } finally {
        done();
      }
    });
    logger.info("set agenda", "*/1 * * * *");
    agenda.every("*/1 * * * *", "analytics-task");
    logger.info("start agenda");
    agenda.start();
  }
}
const mainIns: Main = new Main();
mainIns
  .main()
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  .then(() => {})
  .catch((e: any) => {
    logger.error("main process error", _.get(e, "message", "message"));
  });
