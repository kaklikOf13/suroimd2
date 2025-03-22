import { Client,DefaultSignals,ServerGame2D as GameBase } from "../../engine/mod.ts"
import { ID, ValidString, Vec2, v2 } from "common/scripts/engine/mod.ts"
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
import { ProjectileDef, Projectiles } from "common/scripts/definitions/projectiles.ts";
import { Projectile } from "../gameObjects/projectile.ts";
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
            Explosion,
            Projectile
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
        clearInterval(this.privatesDirtysInter)
    }
    on_run(): void {
        this.map.generate()
        this.privatesDirtysInter=setInterval(()=>{
            for(const p of Object.values(this.connectedPlayers)){
                p.update2()
            }
        },1/this.config.netTps)
    }
    add_player(client:Client,packet:JoinPacket):Player{
        const p=this.scene.objects.add_object(new Player(),CATEGORYS.PLAYERS,client.ID) as Player
                (p as Player).client=client;
                (p as Player).update2()
        if(ValidString.simple_characters(packet.PlayerName)){
            p.name=packet.PlayerName
        }else{
            p.name=`${GameConstants.player.defaultName}#${this.players.length+1}`
        }
        this.players.push(p)
        return p
    }
    add_bullet(position:Vec2,angle:number,def:BulletDef,owner?:Player):Bullet{
        const b=this.scene.objects.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{
            defs:def,
            position:v2.duplicate(position),
            owner:owner
        })as Bullet
        b.set_direction(angle)
        this.bullets[b.id]=b
        return b
    }
    add_explosion(position:Vec2,def:ExplosionDef,owner?:Player):Explosion{
        const e=this.scene.objects.add_object(new Explosion(),CATEGORYS.EXPLOSIONS,undefined,{defs:def,owner,position:v2.duplicate(position)}) as Explosion
        return e
    }
    add_projectile(position:Vec2,def:ProjectileDef,owner?:Player):Projectile{
        const p=this.scene.objects.add_object(new Projectile(),CATEGORYS.PROJECTILES,undefined,{defs:def,owner,position:v2.duplicate(position)}) as Projectile
        return p
    }
    handleConnections(client:Client){
        const objId={id:client.ID,category:CATEGORYS.PLAYERS}
        client.on("join",(packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist(objId)){
                const p=this.add_player(client,packet)
                this.connectedPlayers[p.id]=p
                setTimeout(this.add_projectile.bind(this,p.position,Projectiles.getFromString("frag_grenade"),p),1000)
                setTimeout(this.add_projectile.bind(this,p.position,Projectiles.getFromString("mirv_grenade"),p),10000)
                console.log(`Player ${p.name} Connected`)
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