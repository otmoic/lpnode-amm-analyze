import * as _ from "lodash";
import { logger } from "./sys_lib/logger";
class AppEnv {
  public isProd(): boolean {
    const isProd = _.get(process.env, "OBRIDGE_REDIS_HOST", null);
    if (isProd != null) {
      return true;
    }
    return false;
  }
  public initConfig() {
    this.initBaseConfig();

    const appName = _.get(process.env, "APP_NAME", null);
    if (!appName) {
      logger.error("ncorrect startup env params, must contain appname");
      process.exit(1);
    }
    _.set(process, "_sys_config.app_name", appName);
    const mongoHost = _.get(process.env, "MONGODB_HOST", "");
    const mongoUser = _.get(process.env, "MONGODB_ACCOUNT");
    const mongoPass = _.get(process.env, "MONGODB_PASSWORD", "");
    const lpStoreDb = _.get(process.env, "MONGODB_DBNAME_LP_STORE");
    const lpBusiness = _.get(process.env, "MONGODB_DBNAME_HISTORY");

    _.set(process, "_sys_config.mdb.main", {
      url: `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:27017/${lpStoreDb}?authSource=${lpStoreDb}`,
    });
    _.set(process, "_sys_config.mdb.business", {
      url: `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:27017/${lpBusiness}?authSource=${lpBusiness}`,
    });
    // "market service address"
    _.set(
      process,
      "_sys_config.lp_market_host",
      _.get(process.env, "LP_MARKET_SERVICE_HOST", "")
    );
    _.set(
      process,
      "_sys_config.lp_market_port",
      _.get(process.env, "LP_MARKET_SERVICE_PORT", "18080")
    );
    const adminUrl = _.get(process.env, "LP_ADMIN_PANEL_ACCESS_BASEURL", null);
    if (!adminUrl) {
      logger.error("incorrect startup env params, must contain adminurl");
      process.exit(1);
    }
    _.set(process, "_sys_config.lp_host", adminUrl);
  }
  private initBaseConfig() {
    _.set(process, "_sys_config.balance_lock_expiration_time", 1000 * 60 * 15);
  }
  public GetLpAdminUrl() {
    const adminUrl = _.get(process, "_sys_config.lp_host", null);
    if (!adminUrl) {
      logger.warn("did not get admin-panel host");
    }
    return adminUrl;
  }
}
const appEnv: AppEnv = new AppEnv();
export { appEnv };
