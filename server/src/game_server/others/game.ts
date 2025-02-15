import { Client,DefaultSignals,ServerGame2D as GameBase } from "../../engine/mod.ts"
import { ID } from "common/scripts/engine/mod.ts";;
import { CATEGORYS,CATEGORYSL, GameConstants, PacketManager } from "common/scripts/others/constants.ts";
import { Player } from "../gameObjects/player.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ActionPacket } from "common/scripts/packets/action_packet.ts";
export interface GameConfig{
    maxPlayers:number,
    player:{
        speed:number,
    }
}

export class Game extends GameBase{
    config:GameConfig
    constructor(id:ID,config:GameConfig){
        super(GameConstants.tps,id,PacketManager,{
            "player":Player
        })
        for(const i of CATEGORYSL){
            this.scene.objects.add_category(i)
        }
        this.config=config
        this.clients
    }

    handleConnections(client:Client){
        const objId={id:client.ID,category:CATEGORYS.PLAYERS}
        client.on("join",(_packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist(objId)){
                this.scene.objects.add_object(new Player(),CATEGORYS.PLAYERS,client.ID)
                console.log(`Player ${_packet.PlayerName} Connected`)
            }
            client.emit(this.scene.objects.encode())
        })
        client.on("action",(p:ActionPacket)=>{
            if(this.scene.objects.exist(objId)){
                (this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:client.ID}) as Player).process_action(p)
            }
        })
        client.on(DefaultSignals.DISCONNECT,()=>{
            if(this.scene.objects.exist(objId)){
                const p=this.scene.objects.get_object(objId) as Player
                p.destroyed=true
                console.log(`Player ${p.Name} Desconnected`)
            }
        })
    }
}