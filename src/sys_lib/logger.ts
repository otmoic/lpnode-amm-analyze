import { Logger, ILogObject } from "tslog";

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const dayjs = require("dayjs");
dayjs.extend(utc);
dayjs.extend(timezone);
const log: Logger = new Logger({ dateTimeTimezone: "Asia/Shanghai" });
import * as _ from "lodash";

import { appendFileSync, mkdirSync } from "fs";
import * as fs from "fs";
import * as path from "path";

const logPath = path.join(__dirname, "../../log");
setInterval(() => {
  const list = fs.readdirSync(logPath);
  try {
    _.map(list, (item: string) => {
      if (!item || typeof item !== "string") {
        return;
      }
      const filePath = path.join(logPath, item);
      if (item.indexOf(".out") === -1 && item.indexOf(".err") === -1) {
        log.warn(`it's not the intended log file for deletion`, filePath);
        return;
      }
      if (filePath.indexOf(logPath) === -1) {
        log.warn(`content outside the expected directory`, filePath);
        return;
      }

      const status = fs.statSync(filePath);
      if (status.isFile()) {
        // must be a file
        if (filePath.indexOf("/log/") !== -1) {
          // must be within a log directory
          const passBy = new Date().getTime() - status.atimeMs;
          if (passBy > 1000 * 60 * 60 * 24 * 3) {
            // time is more than 3 days
            log.debug(
              "not updated in the past three days",
              "Delete log file ",
              filePath
            );
            fs.unlinkSync(filePath);
          }
        }
      }
    });
  } catch (e) {
    log.error(`an error occurred while deleting the file`, e);
  }
}, 1000 * 60 * 60 * 6);

function logToSendMessage(logObject: ILogObject) {
  if (!fs.existsSync(logPath)) {
    mkdirSync(logPath);
  }
  if (logObject.logLevel === "error" || logObject.logLevel === "fatal") {
    appendFileSync(
      path.join(logPath, `${dayjs().format("YYYY-MM-DD")}.err`),
      `${dayjs().format()} ${
        logObject.logLevel
      }  ${logObject.argumentsArray.join(" ")}  ${logObject.filePath} ${
        logObject.lineNumber
      }\n`
    );
  } else {
    appendFileSync(
      path.join(logPath, `${dayjs().format("YYYY-MM-DD")}.out`),
      `${dayjs().format()} ${
        logObject.logLevel
      }  ${logObject.argumentsArray.join(" ")} ${logObject.filePath} ${
        logObject.lineNumber
      }\n`
    );
  }
  if (logObject.logLevel === "error" || logObject.logLevel === "fatal") {
    const env = _.get(process, "env.NODE_ENV", "dev");
    if (logObject.argumentsArray[0] !== false && env === "production") {
      logObject.argumentsArray.unshift(
        `🚫 Line: ${_.get(
          logObject,
          "lineNumber",
          ""
        )}\n\n___________________\n`
      );
      logObject.argumentsArray.unshift(
        `🚫 File: ${_.get(logObject, "fullFilePath", "")}`
      );
    }
  }
}

log.attachTransport(
  {
    silly: logToSendMessage,
    debug: logToSendMessage,
    trace: logToSendMessage,
    info: logToSendMessage,
    warn: logToSendMessage,
    error: logToSendMessage,
    fatal: logToSendMessage,
  },
  "debug"
);
export { log as logger };
