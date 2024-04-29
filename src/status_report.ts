import * as _ from "lodash";
import { dataConfig } from "./data_config";
class StatusReport {
  private store: any = {};

  public init() {
    _.set(this.store, "status", "runing");
    setInterval(() => {
      _.set(this.store, "lasttime", new Date().getTime());
    }, 1000);

    setInterval(() => {
      _.set(this.store, "bridgeTokenList", dataConfig.getBridgeTokenList());
    }, 5000);

    setInterval(() => {
      _.set(this.store, "tokenList", dataConfig.getTokenList());
    });
  }

  intervalReport() {
    setTimeout(() => {}, 1000 * 30);
  }

  public async appendStatus(key: string, val: any) {
    _.set(this.store, key, val);
  }

  public async pendingStatus(message: string) {
    _.set(this.store, "status", "pending");
    _.set(this.store, "pendingMessage", message);
  }
}

const statusReport: StatusReport = new StatusReport();
export { statusReport };
