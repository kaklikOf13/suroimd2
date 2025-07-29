import { Config } from "../../configs/config.ts";
import { Server } from "../engine/server.ts";
import { ApiServer } from "./server.ts";

const s=new ApiServer(new Server(Config.api.host.port))
s.run()