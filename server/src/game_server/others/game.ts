import { Client,DefaultSignals,ServerGame2D as GameBase } from "../../engine/mod.ts"
import { ID, Numeric, ValidString, Vec2, v2 } from "common/scripts/engine/mod.ts"
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
import { BulletDef, GameItem } from "common/scripts/definitions/utils.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { ProjectileDef } from "common/scripts/definitions/projectiles.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { ServerGameObject } from "./gameObject.ts";
export interface GameConfig{
    maxPlayers:number
    gameTps:number
    netTps:number
    deenable_feast:boolean
}

export class GamemodeManager{
    game:Game
    closed:boolean=false
    can_join():boolean{
        return !this.closed&&!this.game.fineshed&&this.game.livingPlayers.length<this.game.config.maxPlayers
    }
    constructor(game:Game){
        this.game=game
    }
    on_start(){
        this.game.interactionsEnabled=true
        this.game.addTimeout(()=>{
            this.closed=true
            this.game.pvpEnabled=true
            console.log(`Game ${this.game.id} Clossed`)
        },20)
    }
    on_finish(){
        this.game.addTimeout(()=>{
            for(const p of this.game.livingPlayers){
                p.send_game_over(true)
            }
            this.game.killing_game=true
            console.log(`Game ${this.game.id} Fineshed`)
        },2)
    }
    startRules():boolean{
        return this.game.livingPlayers.length>1
    }
    on_player_join(_p:Player){
        if(!this.game.started&&this.game.livingPlayers.length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    on_player_die(_p:Player){
        if(this.game.livingPlayers.length<=1){
            this.game.finish()
        }
    }
}
export class Game extends GameBase<ServerGameObject>{
    config:GameConfig
    map:GameMap
    gamemode:Gamemode

    players:Player[]=[]
    livingPlayers:Player[]=[]
    connectedPlayers:Record<number,Player>={}

    bullets:Record<number,Bullet>=[]

    modeManager:GamemodeManager

    started:boolean=false

    private _pvpEnabled:boolean=false
    set pvpEnabled(v:boolean){
        this._pvpEnabled=v
        for(const p of this.livingPlayers){
            p.pvpEnabled=v
        }
    }
    get pvpEnabled():boolean{
        return this._pvpEnabled
    }
    private _interactionsEnabled:boolean=false
    get interactionsEnabled():boolean{
        return this._interactionsEnabled
    }
    set interactionsEnabled(v:boolean){
        this._interactionsEnabled=v
        for(const p of this.livingPlayers){
            p.interactionsEnabled=v
        }
    }

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
        this.map=new GameMap(this,v2.new(30,30))
        this.gamemode=DefaultGamemode
        this.modeManager=new GamemodeManager(this)
    }

    on_update(): void {
        super.on_update()
        if(this.killing_game){
            this.clock.timeScale=Numeric.lerp(this.clock.timeScale,0,0.03)
            if(this.clock.timeScale<=0.05){
                this.clock.timeScale=1
                this.running=false
            }
        }
    }
    privatesDirtysInter=0
    on_stop():void{
        super.on_stop()
        clearInterval(this.privatesDirtysInter)
        console.log(`Game ${this.id} Stopped`)
    }
    killing_game:boolean=false
    on_run(): void {
        this.map.generate()
        this.privatesDirtysInter=setInterval(()=>{
            for(const p of Object.values(this.connectedPlayers)){
                p.update2()
            }
        },1/this.config.netTps)
    }
    add_player(client:Client,id:number,packet:JoinPacket):Player{
        const p=this.scene.objects.add_object(new Player(),CATEGORYS.PLAYERS,id) as Player
                (p as Player).client=client;
                (p as Player).update2()
        if(ValidString.simple_characters(packet.PlayerName)){
            p.name=packet.PlayerName
        }else{
            p.name=`${GameConstants.player.defaultName}#${this.players.length+1}`
        }
        this.players.push(p)
        this.livingPlayers.push(p)

        p.pvpEnabled=this._pvpEnabled||this.config.deenable_feast
        p.interactionsEnabled=this._interactionsEnabled||this.config.deenable_feast

        this.modeManager.on_player_join(p)

        return p
    }
    fineshed:boolean=false
    start(){
        if(this.started||!this.modeManager.startRules())return
        this.started=true
        this.modeManager.on_start()
        console.log(`Game ${this.id} Started`)
    }
    finish(){
        if(this.fineshed)return
        this.fineshed=true
        this.modeManager.on_finish()
        console.log(`Game ${this.id} Fineshed`)
    }
    add_bullet(position:Vec2,angle:number,def:BulletDef,owner?:Player,ammo?:string,source?:GameItem):Bullet{
        const b=this.scene.objects.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{
            defs:def,
            position:v2.duplicate(position),
            owner:owner,
            ammo:ammo,
            source
        })as Bullet
        b.set_direction(angle)
        this.bullets[b.id]=b
        return b
    }
    add_explosion(position:Vec2,def:ExplosionDef,owner?:Player):Explosion{
        const e=this.scene.objects.add_object(new Explosion(),CATEGORYS.EXPLOSIONS,undefined,{defs:def,owner,position:position}) as Explosion
        return e
    }
    add_projectile(position:Vec2,def:ProjectileDef,owner?:Player):Projectile{
        const p=this.scene.objects.add_object(new Projectile(),CATEGORYS.PROJECTILES,undefined,{defs:def,owner,position:position}) as Projectile
        return p
    }
    add_loot(position:Vec2,def:GameItem,count:number):Loot{
        const l=this.scene.objects.add_object(new Loot(),CATEGORYS.LOOTS,undefined,{item:def,count:count,position:position}) as Loot
        return l
    }
    handleConnections(client:Client){
        const objId={id:client.ID,category:CATEGORYS.PLAYERS}
        client.on("join",(packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist(objId)){
                const p=this.add_player(client,objId.id,packet)
                this.connectedPlayers[p.id]=p
                this.addTimeout(client.emit.bind(client,this.scene.objects.encode(undefined,true)),0.3)
                console.log(`${p.name} Connected`)
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
                delete this.connectedPlayers[p.id]
                console.log(`${p.name} Disconnected`)
            }
        })
    }
}