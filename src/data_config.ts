/* eslint-disable arrow-parens */
import { chainAdapter } from "./chain_adapter/chain_adapter";

const bs58 = require("bs58");
import * as _ from "lodash";
import {
  IBridgeTokenConfigItem,
  ICexCoinConfig,
  IHedgeConfig,
  IHedgeType,
} from "./interface/interface";
import { logger } from "./sys_lib/logger";
import { chainListModule } from "./mongo_module/chain_list";
import axios from "axios";
import { appEnv } from "./app_env";
import { tokensModule } from "./mongo_module/tokens";
import { TimeSleepForever, TimeSleepMs } from "./utils/utils";
import { bridgesModule } from "./mongo_module/bridge";
import { installModule } from "./mongo_module/install";
import { statusReport } from "./status_report";
import { extend_bridge_item } from "./data_config_bridge_extend";

const Web3 = require("web3");
const web3 = new Web3();

class DataConfig {
  private hedgeConfig: IHedgeConfig = {
    hedgeType: IHedgeType.Null,
    hedgeAccount: "",
  };
  private chainTokenUsd: Map<number, number> = new Map();
  // @ts-ignore
  private chainMaxTokenUsd: Map<number, number> = new Map();
  private chainMap: Map<number, string> = new Map();
  private chainDataMap: Map<number, { chainType: string }> = new Map();
  private chainTokenMap: Map<number, string> = new Map();
  private tokenToSymbolMap: Map<string, ICexCoinConfig> = new Map();
  private hedgeAccountList: {
    accountId: string;
    exchangeName: string;
    spotAccount: {
      apiKey: string;
      apiSecret: string;
    };
    usdtFutureAccount: {
      apiKey: string;
      apiSecret: string;
    };
    coinFutureAccount: {
      apiKey: string;
      apiSecret: string;
    };
  }[] = [];
  private lpConfig: {
    quotationInterval: number;
  } = {
    quotationInterval: 1000 * 10,
  };

  public getTokenList() {
    const tokenList: any[] = [];
    for (const [uniqKey, item] of this.tokenToSymbolMap) {
      _.set(item, "uniqKey", uniqKey);
      tokenList.push(item);
    }
    return tokenList;
  }

  public enableSwap: false;
  private bridgeTokenList: IBridgeTokenConfigItem[] = [];

  public async rewriteMarketUrl() {
    const rewrite = _.get(process.env, "rewrite_market_host", "true");
    if (rewrite === "false") {
      logger.warn(`skip rewrite`);
      return;
    }
    const marketServiceRow = await installModule
      .findOne({
        installType: "market",
      })
      .lean();
    if (!marketServiceRow) {
      logger.error(
        `correct market address not found, unable to override default value`
      );
      await statusReport.pendingStatus(
        "correct market address not found, unable to override default value"
      );
      await TimeSleepForever(
        "correct market address not found, unable to override default value"
      );
    } else {
      const rewriteHost = `obridge-amm-market-${marketServiceRow.name}-service`;
      logger.warn("rewrite market host ", rewriteHost);
      _.set(process, "_sys_config.lp_market_host", rewriteHost);
    }
    await TimeSleepMs(5000);
  }

  private async initBaseConfig(baseConfig: any) {
    console.log(baseConfig);
    try {
      this.checkBaseConfig(baseConfig);
    } catch (e) {
      logger.debug(e);
      logger.error(`incorrect basic configuration data`);
      await TimeSleepForever(
        "incorrect basic configuration data, waiting for reconfiguration"
      );
    }
    const chainDataConfigList: {
      chainId: number;
      config: {
        minSwapNativeTokenValue: string;
        maxSwapNativeTokenValue: string;
      };
    }[] = _.get(baseConfig, "chainDataConfig", []);
    for (const chainData of chainDataConfigList) {
      this.chainTokenUsd.set(
        chainData.chainId,
        Number(chainData.config.minSwapNativeTokenValue)
      );
      this.chainMaxTokenUsd.set(
        chainData.chainId,
        Number(chainData.config.maxSwapNativeTokenValue)
      );
      logger.debug(
        "set chain usd",
        chainData.chainId,
        Number(chainData.config.minSwapNativeTokenValue),
        Number(chainData.config.maxSwapNativeTokenValue)
      );
    }
    let hedgeType = _.get(baseConfig, "hedgeConfig.hedgeType", null);
    const hedgeAccount = _.get(baseConfig, "hedgeConfig.hedgeAccount", null);
    if (!hedgeType || !hedgeAccount) {
      logger.error(`incorrect basic configuration data`);
      await TimeSleepForever(
        "incorrect basic configuration data, waiting for reconfiguration"
      );
    }
    if (hedgeType === "null" || !hedgeType) {
      hedgeType = "Null";
    }
    this.hedgeConfig.hedgeType = hedgeType;
    this.hedgeConfig.hedgeAccount = hedgeAccount;
    this.hedgeAccountList = _.get(baseConfig, "hedgeConfig.accountList", []);
    if (hedgeAccount.length <= 0) {
      logger.error(
        `incorrect basic configuration data, please check hedging account settings`
      );
      await TimeSleepForever(
        "incorrect basic configuration data, please check hedging account settings"
      );
    }
  }

  private checkBaseConfig(baseConfig: any) {
    const chainDataConfig: any[] = _.get(baseConfig, "chainDataConfig", []);
    if (!_.isArray(chainDataConfig)) {
      throw new Error(`chainDataConfig is incorrect `);
    }
    if (chainDataConfig.length <= 0) {
      throw new Error(` chainDataConfig is empty`);
    }
    for (const item of chainDataConfig) {
      if (
        !Object.keys(item["config"]).includes("minSwapNativeTokenValue") ||
        !Object.keys(item["config"]).includes("maxSwapNativeTokenValue")
      ) {
        throw new Error(`chainDataConfig is missing a field`);
      }
    }
  }

  public getHedgeAccountList() {
    return this.hedgeAccountList;
  }

  private async getConfigResource(configId: string) {
    let result;
    const lpAdminPanelUrl = appEnv.GetLpAdminUrl();
    const url = `${lpAdminPanelUrl}/lpnode/lpnode_admin_panel/configResource/get`;
    logger.info(`start request :${url}`);
    try {
      result = await axios.request({
        url,
        method: "post",
        data: {
          clientId: configId,
        },
      });
      const configData = JSON.parse(
        _.get(result, "data.result.templateResult", {})
      );
      return configData;
    } catch (e) {
      const err: any = e;
      logger.error(`get config error:`, err.toString());
    }
  }

  private async createConfigResource() {
    let result: any;
    const lpAdminPanelUrl = appEnv.GetLpAdminUrl();
    try {
      result = await axios.request({
        url: `${lpAdminPanelUrl}/lpnode/lpnode_admin_panel/configResource/create`,
        method: "post",
        data: {
          appName: _.get(process.env, "APP_NAME", ""),
          version: _.get(process.env, "APP_VERSION", ""),
          clientId: Buffer.from(new Date().getTime().toString()).toString(
            "base64"
          ),
          template:
            '{"chainDataConfig":[{"chainId":9006,"config":{"minSwapNativeTokenValue":"0.5"}},{"chainId":9000,"config":{"minSwapNativeTokenValue":"0.5"}}],"hedgeConfig":{"hedgeAccount":"a001","hedgeType":"CoinSpotHedge","accountList":[{"accountId":"a001","exchangeName":"binance","spotAccount":{"apiKey":"","apiSecret":""},"usdtFutureAccount":{"apiKey":"","apiSecret":""},"coinFutureAccount":{"apiKey":"","apiSecret":""}}]}}',
        },
      });
      logger.debug("create configuration response", _.get(result, "data", ""));
      const id = _.get(result, "data.result.id", "");
      const clientId = _.get(result, "data.result.clientId", "");
      if (!id || id === "" || !clientId || clientId === "") {
        logger.error(
          "unable to create configuration for service, cannot start, Lp_admin returns incorrectly"
        );
        process.exit(5);
      }
      return [id, clientId];
    } catch (e) {
      const err: any = e;
      logger.error(
        "an error occurred while creating the configuration",
        err.toString(),
        _.get(e, "response.data", "")
      );
    }
    return [];
  }

  public async loadBaseConfig() {
    setInterval(() => {
      // automatically refresh TokenList periodically
      this.loadTokenToSymbol().catch((e) => {
        logger.error("synchronization error with TokenList");
      });
    }, 1000 * 60 * 2);
    await this.loadTokenToSymbol();
    await this.loadChainConfig();
  }

  private async loadTokenToSymbol() {
    const tokenList: {
      address: string;
      coinType: string;
      marketName: string;
      chainId: number;
      precision: number;
    }[] = await tokensModule
      .find({
        ammName: _.get(process.env, "APP_NAME", ""),
      })
      .lean();
    // the synchronized content must be kept together to ensure synchronized currency pairs without affecting quotes elsewhere
    this.tokenToSymbolMap = new Map();
    tokenList.map((it) => {
      const uniqAddress = this.convertAddressToUniq(it.address, it.chainId);
      const key = `${it.chainId}_${uniqAddress}`;
      this.tokenToSymbolMap.set(key, {
        chainId: it.chainId,
        address: this.convertAddressToHex(it.address, it.chainId),
        addressLower: this.convertAddressToHex(
          it.address,
          it.chainId
        ).toLowerCase(),
        coinType: it.coinType,
        symbol: it.marketName,
        precision: it.precision,
      });
      return null;
    });
    console.log("currently configured Token list:");
    const view: {}[] = [];
    for (const [_, item] of this.tokenToSymbolMap) {
      const viewItem = {
        symbol: item.symbol,
        address: item.address,
        chainId: item.chainId,
        precision: item.precision,
      };
      view.push(viewItem);
    }
    console.table(view);

    await TimeSleepMs(1000 * 5);
  }

  private async loadChainConfig() {
    const chainList: {
      chainId: number;
      chainName: string;
      chainType: string;
      tokenName: string;
      tokenUsd: number;
    }[] = await chainListModule.find({}).lean();

    _.map(chainList, (item) => {
      this.chainMap.set(item.chainId, item.chainName);
      this.chainDataMap.set(item.chainId, { chainType: item.chainType });
      this.chainTokenMap.set(item.chainId, item.tokenName);
    });
    console.log("basic data of the current chain:");
    console.table(chainList);
    await TimeSleepMs(5 * 1000);
  }

  public getStdCoinSymbolInfoByToken(token: string, chainId: number) {
    const chainKey = `${chainId}`;
    const uniqAddress = this.convertAddressToUniq(token, chainId);
    const key = `${chainKey}_${uniqAddress}`;
    const info = this.tokenToSymbolMap.get(key);
    if (!info) {
      return { symbol: null, coinType: "" };
    }
    return info;
  }

  public getCexStdSymbolInfoByToken(
    token0: string,
    token1: string,
    token0ChainId: number,
    token1ChainId: number
  ): ICexCoinConfig[] | any {
    const uniqAddress0 = this.convertAddressToUniq(token0, token0ChainId);
    const uniqAddress1 = this.convertAddressToUniq(token1, token1ChainId);
    const key0 = `${token0ChainId}_${uniqAddress0}`;
    const key1 = `${token1ChainId}_${uniqAddress1}`;
    const token0Symbol = this.tokenToSymbolMap.get(key0);
    const token1Symbol = this.tokenToSymbolMap.get(key1);
    if (!token0Symbol || !token1Symbol) {
      logger.warn(
        `the currency pair to be queried was not found 【${token0}/${token1}】`
      );
      return undefined;
    }
    return [token0Symbol, token1Symbol];
  }

  public convertAddressToUniq(address: string, chainId: number): string {
    if (address.startsWith("0x")) {
      return web3.utils.hexToNumberString(address);
    }
    const chainType = _.get(
      this.chainDataMap.get(chainId),
      "chainType",
      undefined
    );
    if (chainType === "near") {
      const bytes = bs58.decode(address);
      const ud = web3.utils.hexToNumberString(
        `0x${Buffer.from(bytes).toString("hex")}`
      );
      return ud;
    }
    return address;
  }

  private convertAddressToHex(address: string, chainId: number): string {
    if (address.startsWith("0x")) {
      return address;
    }
    try {
      const hexAddress: string =
        chainAdapter[`AddressAdapter_${chainId}`](address);
      return hexAddress;
    } catch (e) {
      logger.error("an error occurred while processing the address");
      logger.warn("unknown format");
    }
    logger.warn("unknown format");
    return address;
  }

  public getHedgeConfig() {
    return this.hedgeConfig;
  }

  public getLpConfig() {
    return this.lpConfig;
  }

  public getChainGasTokenUsd(chainId: number): number {
    if (!_.isFinite(chainId)) {
      return 0;
    }
    const usd = this.chainTokenUsd.get(chainId);
    if (!usd) {
      return 0;
    }
    return usd;
  }

  public getChainGasTokenUsdMax(chainId: number): number {
    if (!_.isFinite(chainId)) {
      return 0;
    }
    const usd = this.chainMaxTokenUsd.get(chainId);
    if (!usd) {
      return 0;
    }
    return usd;
  }

  public async syncBridgeConfigFromLocalDatabase(): Promise<void> {
    const appName = _.get(process, "_sys_config.app_name", null);
    if (!appName) {
      logger.error("appname not found when reading configuration.");
      process.exit(1);
    }
    const findOption = { ammName: appName };
    logger.debug(`findOption`, findOption);
    const lpConfigList: {
      bridgeName: string;
      srcChainId: number;
      dstChainId: number;
      srcToken: string;
      dstToken: string;
      msmqName: string;
      walletName: string;
      dstClientUri: string;
    }[] = await bridgesModule.find().lean();
    this.bridgeTokenList = [];
    if (!lpConfigList || lpConfigList.length <= 0) {
      logger.warn(
        "no available bridgeitem configuration found.",
        "findOption",
        findOption
      );
      await TimeSleepMs(1000 * 10);
      process.exit(1);
    }
    for (const item of lpConfigList) {
      const formatedItem: any = {
        bridge_name: item.bridgeName,
        src_chain_id: item.srcChainId,
        dst_chain_id: item.dstChainId,
        srcToken: item.srcToken,
        dstToken: item.dstToken,
        msmq_name: item.msmqName,
        wallet: {
          name: item.walletName,
          balance: {},
        },
        dst_chain_client_uri: item.dstClientUri,
      };
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const context = this;
      const proxyedFormatedItem: IBridgeTokenConfigItem = extend_bridge_item(
        formatedItem,
        context
      );
      this.bridgeTokenList.push(proxyedFormatedItem);
    }
    console.table(this.bridgeTokenList);
  }

  public getChainName(chainId: number): string | undefined {
    return this.chainMap.get(chainId);
  }

  public getChainTokenName(chainId: number) {
    const tokenName = this.chainTokenMap.get(chainId);
    if (!tokenName) {
      logger.error("corresponding chain's basic configuration not found.");
      throw new Error("corresponding chain's basic configuration not found.");
    }
    return tokenName;
  }

  public getBridgeTokenList(): IBridgeTokenConfigItem[] {
    return this.bridgeTokenList;
  }

  public findItemByMsmqName(name: string) {
    const ret: any = _.find(this.bridgeTokenList, {
      msmq_name: name,
    });
    return ret;
  }

  public getPrecision(hexAddress: string) {
    const findHex = hexAddress.toLowerCase();

    this.tokenToSymbolMap.forEach((item) => {
      if (item.addressLower === findHex) {
        return item;
      }
    });
    logger.error("corresponding precision not found.");
    throw new Error(`corresponding precision not found. ${hexAddress}`);
  }
}

const dataConfig: DataConfig = new DataConfig();
export { dataConfig };
