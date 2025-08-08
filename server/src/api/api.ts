import { loadConfigDeno } from "../../configs/config.ts";
import { Server } from "../engine/server.ts";
import { ApiServer } from "./server.ts";

const Config=loadConfigDeno("configs/config.json")
const s=new ApiServer(new Server(Config.api.host.port),Config)
s.run()