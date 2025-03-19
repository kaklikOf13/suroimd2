import { Client,DefaultSignals,ServerGame2D as GameBase } from "../../engine/mod.ts"
import { ID, Vec2, v2 } from "common/scripts/engine/mod.ts"
import { CATEGORYS,CATEGORYSL, GameConstants, PacketManager } from "common/scripts/others/constants.ts"
import { Player } from "../gameObjects/player.ts"
import { Loot } from "../gameObjects/loot.ts"
import { JoinPacket } from "common/scripts/packets/join_packet.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { ObjectsE } from "common/scripts/others/objectsEncode.ts"
import { Bullet } from "../gameObjects/bullet.ts"
import { Obstacle } from "../gameObjects/obstacle.ts"
import { GameMap } from "./map.ts"
import { Explosion } from "../gameObjects/explosion.ts";
import { DefaultGamemode, Gamemode } from "./gamemode.ts";
import { BulletDef } from "common/scripts/definitions/utils.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
export interface GameConfig{
    maxPlayers:number
    gameTps:number
    netTps:number
}


export class Game extends GameBase{
    config:GameConfig
    map:GameMap
    gamemode:Gamemode

    players:Player[]=[]
    connectedPlayers:Record<number,Player>={}

    bullets:Record<number,Bullet>=[]
    constructor(id:ID,config:GameConfig){
        super(config.gameTps,id,PacketManager,[
            Player,
            Loot,
            Bullet,
            Obstacle,
            Explosion
        ])
        for(const i of CATEGORYSL){
            this.scene.objects.add_category(i)
        }
        this.config=config
        this.clients
        this.scene.objects.encoders=ObjectsE
        this.map=new GameMap(this,v2.new(13,13))
        this.gamemode=DefaultGamemode
    }

    on_update(): void {
      super.on_update()
    }
    privatesDirtysInter=0
    on_stop():void{
        super.on_stop()

    }
    on_run(): void {
        this.map.generate()
        this.privatesDirtysInter=setInterval(()=>{
            for(const p of Object.values(this.connectedPlayers)){
                p.update2()
            }
        },1/this.config.netTps)
    }
    add_player(client:Client,_packet:JoinPacket):Player{
        const p=this.scene.objects.add_object(new Player(),CATEGORYS.PLAYERS,client.ID) as Player
                (p as Player).client=client;
                (p as Player).update2()
        this.players.push(p)
        return p
    }
    add_bullet(position:Vec2,angle:number,def:BulletDef,owner?:Player):Bullet{
        const b=this.scene.objects.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{
            defs:def,
            position:position,
            owner:owner
        })as Bullet
        b.set_direction(angle)
        this.bullets[b.id]=b
        return b
    }
    add_explosion(position:Vec2,def:ExplosionDef,owner?:Player):Explosion{
        const e=this.scene.objects.add_object(new Explosion(),CATEGORYS.EXPLOSIONS,undefined,{defs:def,owner,position:position}) as Explosion
        return e
    }
    handleConnections(client:Client){
        const objId={id:client.ID,category:CATEGORYS.PLAYERS}
        client.on("join",(packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist(objId)){
                const p=this.add_player(client,packet)
                this.connectedPlayers[p.id]=p
                console.log(`Player ${packet.PlayerName} Connected`)
            }
            client.emit(this.scene.objects.encode(undefined,true))
        })
        client.on("action",(p:ActionPacket)=>{
            if(this.scene.objects.exist(objId)){
                (this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:client.ID}) as Player).process_action(p)
            }
        })
        client.on(DefaultSignals.DISCONNECT,()=>{
            if(this.scene.objects.exist(objId)){
                const p=this.scene.objects.get_object(objId) as Player
                delete this.connectedPlayers[p.id]
                p.destroy()
                console.log(`Player ${p.name} Desconnected`)
            }
        })
    }
}