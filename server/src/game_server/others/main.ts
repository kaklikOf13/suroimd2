import { GameServer } from "./server.ts"
import { Server } from "../../engine/mod.ts"
import { HostConfig } from "../../engine/websockets.ts";
import { Config } from "../../../configs/config.ts";

function new_server_from_hc(hc:HostConfig):Server{
  if(hc.https){
    return new Server(hc.port,hc.https,hc.cert,hc.key)
  }
  return new Server(hc.port)
}

// Game Server
function hostGame(){
  return new Promise(()=>{
    if(Config.game.host){
      const server=new GameServer(new_server_from_hc(Config.game.host))
      server.run()
    }
  })
}

if (import.meta.main) {
  hostGame()
}
