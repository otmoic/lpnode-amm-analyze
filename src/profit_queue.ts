import * as _ from "lodash";
import { Mdb } from "./module/database/mdb";
import Agenda from "agenda";

const mongoConnectionString = Mdb.getInstance().getMongoDbUrl("main");
console.log("agenda config:", mongoConnectionString);
const agenda = new Agenda({ db: { address: mongoConnectionString } });
export { agenda };
