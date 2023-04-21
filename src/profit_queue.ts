import Bull from "bull";
import { getRedisConfig } from "./redis_bus";
import * as _ from "lodash";
import { logger } from "./sys_lib/logger";
const redisConfig = getRedisConfig();
const appName = _.get(process.env, "APP_NAME", "");
const JobQueue = new Bull(`${appName}_analyze_job`, {
  redis: { port: 6379, host: redisConfig.host, password: redisConfig.pass },
});
JobQueue.add(process.env, {
  repeat: {
    every: 1000 * 60,
    limit: 100,
  },
}).then(() => {
  logger.info(`已经添加定时任务到Job中`);
});
export { JobQueue };
