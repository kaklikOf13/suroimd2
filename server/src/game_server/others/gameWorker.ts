import { type ConfigType } from "common/scripts/config/config.ts";
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
        https?:boolean
        cert_file?:string
        key_file?:string
    } | {
        type: WorkerMessages.NewGame
        team_size:number
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
                server:new Server(msg.port,msg.https,msg.cert_file,msg.key_file)
            }
            begin.server.route("api/ws",begin.clients.handler())
            begin.server.run()
            console.log(`Game ${begin.id} Initialized`)
            break
        case WorkerMessages.NewGame:
            if(game){
                game.clock.stop()
                game.running=false
                for(const c of game.clients.clients.values()){
                    c.disconnect()
                }
            }
            game=new Game(begin.clients,begin.id,begin.config)
            game.on_update_data.push(DataUpdated)
            console.log(`Game ${begin.id} Created`)
            game.mainloop(false)
    }
})