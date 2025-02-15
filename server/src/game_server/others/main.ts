import { GameServerConfig,GameServer } from "./server.ts"
import { Server } from "../../engine/mod.ts"
import { HostConfig } from "../../engine/websockets.ts";

export interface Config{
  game:GameServerConfig
  host:HostConfig
}
function new_server_from_hc(hc:HostConfig):Server{
  if(hc.https){
    return new Server(hc.port,hc.https,hc.cert,hc.key)
  }
  return new Server(hc.port)
}

// Game Server
function hostGame(){
  return new Promise(()=>{
    if(config.host){
      const server=new GameServer(new_server_from_hc(config.host),config.game)
      server.run()
    }
  })
}

//Execute
const config:Config=JSON.parse(await Deno.readTextFile("configs/game.json"))
if (import.meta.main) {
  hostGame()
}
