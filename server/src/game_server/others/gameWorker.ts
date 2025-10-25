import { GameConfig, type ConfigType } from "common/scripts/config/config.ts";
import { Game, GameData } from "./game.ts";
import { ClientsManager } from "../../engine/mod.ts";
import { PacketManager } from "common/scripts/packets/packet_manager.ts";
import { Server } from "../../engine/server.ts";

export enum WorkerMessages {
    Begin,
    NewGame,
    SetData 
}

export type WorkerMessage =
    {
        type: WorkerMessages.Begin
        id:number
        config:ConfigType
        port:number
    } | {
        type: WorkerMessages.NewGame
        config?:GameConfig
    } | {
        type: WorkerMessages.SetData
        data:GameData
    };
let game:Game|undefined
let begin:{
    id:number
    config:ConfigType
    clients:ClientsManager
    server:Server
}
function DataUpdated(data:GameData){
    // deno-lint-ignore ban-ts-comment
    //@ts-ignore
    self.postMessage({
        type:WorkerMessages.SetData,
        data:data
    })
}
self.addEventListener("message",(e)=>{
    // deno-lint-ignore ban-ts-comment
    //@ts-ignore
    const msg=e.data as WorkerMessage
    switch(msg.type){
        case WorkerMessages.Begin:
            if(begin)break
            begin={
                id:msg.id,
                config:msg.config,
                clients:new ClientsManager(PacketManager),
                server:new Server(msg.port,msg.config.game.host.https,msg.config.game.host.cert,msg.config.game.host.key)
            }
            begin.server.route("api/ws",begin.clients.handler())
            begin.server.run()
            console.log(`Game ${begin.id} Initialized`)
            break
        case WorkerMessages.NewGame:
            if (game){
                game.clock.stop()
                game.running=false
                game.clients.clear()
            }
            game=new Game(msg.config??{team_size:1,mode:"normal"},begin.clients,begin.id,begin.config)
            game.signals.on("update_data",DataUpdated)
            console.log(`Game ${begin.id} Created`)
            game.mainloop(false)
    }
})