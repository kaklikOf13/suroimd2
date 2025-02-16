import { Client,DefaultSignals,ServerGame2D as GameBase } from "../../engine/mod.ts"
import { ID, v2 } from "common/scripts/engine/mod.ts";;
import { CATEGORYS,CATEGORYSL, GameConstants, PacketManager } from "common/scripts/others/constants.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ActionPacket } from "common/scripts/packets/action_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { Obstacles } from "common/scripts/definitions/obstacles.ts";
export interface GameConfig{
    maxPlayers:number,
}

export class Game extends GameBase{
    config:GameConfig
    constructor(id:ID,config:GameConfig){
        super(GameConstants.tps,id,PacketManager,[
            Player,
            Loot,
            Bullet,
            Obstacle
        ])
        for(const i of CATEGORYSL){
            this.scene.objects.add_category(i)
        }
        this.config=config
        this.clients
        this.scene.objects.encoders=ObjectsE
    }
    on_run(): void {
        for(let i=0;i<10;i++){
            this.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
                position:v2.random(-10,10),
                def:Obstacles.getFromString("stone")
            })
        }
    }

    handleConnections(client:Client){
        const objId={id:client.ID,category:CATEGORYS.PLAYERS}
        client.on("join",(_packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist(objId)){
                this.scene.objects.add_object(new Player(),CATEGORYS.PLAYERS,client.ID)
                console.log(`Player ${_packet.PlayerName} Connected`)
            }
            client.emit(this.scene.objects.encode(undefined,true))
            //Add Loot
            for(let i=0;i<10;i++){
                const obj=this.scene.objects.add_object(new Loot(),CATEGORYS.LOOTS)
                obj.position=v2.random(-0.1,0.1)
            }
        })
        client.on("action",(p:ActionPacket)=>{
            if(this.scene.objects.exist(objId)){
                (this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:client.ID}) as Player).process_action(p)
            }
        })
        client.on(DefaultSignals.DISCONNECT,()=>{
            if(this.scene.objects.exist(objId)){
                const p=this.scene.objects.get_object(objId) as Player
                p.destroy()
                console.log(`Player ${p.name} Desconnected`)
            }
        })
    }
}