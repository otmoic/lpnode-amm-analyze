import IORedis from "ioredis";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const Redis = require('ioredis');
import Redis from "ioredis";

class SysIoRedis {
  public static getRedis(
    host: string,
    pass: string | undefined,
    port = 6379,
    db = 0
  ): IORedis.Redis {
    const redisClient = new Redis({
      host,
      port,
      db,
      password: pass,
      retryStrategy(times: number) {
        logger.error(
          `redis Host:${host},port:${port} currently attempting the ${times} reconnect`
        );
        const delay = Math.min(times * 50, 1000 * 10);
        return delay;
      },
    });

    redisClient.on("error", (err: any) => {
      logger.error(
        "an error occurred while connecting to redis",
        host,
        pass,
        err
      );
    });
    return redisClient;
  }
}
export { SysIoRedis };
