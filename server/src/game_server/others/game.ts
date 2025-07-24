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
import { BulletDef, DamageReason, GameItem } from "common/scripts/definitions/utils.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { ProjectileDef } from "common/scripts/definitions/projectiles.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { ServerGameObject } from "./gameObject.ts";
import { Client, DefaultSignals, OfflineClientsManager, ServerGame2D } from "common/scripts/engine/server_offline/offline_server.ts";
import { PlayerBody } from "../gameObjects/player_body.ts";
import { GroupManager, TeamsManager } from "./teams.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";
import { KillFeedMessage, KillFeedMessageType, KillFeedPacket } from "common/scripts/packets/killfeed_packet.ts";
import { DamageSourceDef } from "common/scripts/definitions/alldefs.ts";
export interface GameConfig{
    maxPlayers:number
    gameTps:number
    teamSize:number
    netTps:number
    deenable_feast:boolean
}

export class GamemodeManager{
    game:Game
    closed:boolean=false
    team_size:number=1
    can_join():boolean{
        return !this.closed&&!this.game.fineshed&&this.game.livingPlayers.length<this.game.config.maxPlayers
    }
    kill_leader?:Player

    constructor(game:Game){
        this.game=game
        this.team_size=game.config.teamSize
    }
    can_down(_player:Player):boolean{
        return false
    }
    on_start(){
        this.game.interactionsEnabled=true
        this.game.addTimeout(()=>{
            this.closed=true
            this.game.pvpEnabled=true
            console.log(`Game ${this.game.id} Clossed`)
        },50)
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
export class TeamsGamemodeManager extends GamemodeManager{
    teamsManager:TeamsManager
    constructor(game:Game){
        super(game)
        this.teamsManager=new TeamsManager()
    }
    override can_down(player:Player):boolean{
        return (player.team&&player.team.get_not_downed_players().length>1)!
    }
    set_team_for_player(p:Player){
        if(p.team===undefined){
            let t=this.teamsManager.get_perfect_team(this.team_size,p.groupId)
            if(!t){
                t=this.teamsManager.add_team()
            }
            t.add_player(p)
        }
    }
    override on_player_join(p:Player){
        this.set_team_for_player(p)
        if(!this.game.started&&this.teamsManager.get_living_teams().length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    override on_player_die(p:Player){
        if(p.team){
            for(const pp of p.team.get_downed_players()){
                pp.kill({amount:pp.health,critical:false,position:pp.position,reason:DamageReason.Bleend,owner:pp.downedBy,source:pp.downedBySource})
            }
        }
        if(this.teamsManager.get_living_teams().length<=1){
            this.game.finish()
        }
    }
}
export class GroupGamemodeManager extends TeamsGamemodeManager{
    groupsManager:GroupManager=new GroupManager()
    f=0
    groups_size:number

    constructor(game:Game,groups_size:number=2){
        super(game)
        this.groups_size=groups_size
        this.team_size=4
    }
    override can_down(player:Player):boolean{
        return super.can_down(player)&&(player.team&&player.team.get_not_downed_players().length>1)!
    }
    override on_player_join(p:Player){
        let g=this.groupsManager.groups[this.f]
        if(!g){
            g=this.groupsManager.add_group()
        }
        g.add_player(p)
        this.f++
        if(this.f>=this.groups_size){
            this.f=0
        }
        super.set_team_for_player(p)
        if(p.team)p.team.group=g.id
        if(!this.game.started&&this.teamsManager.get_living_teams().length>1){
            this.game.addTimeout(this.game.start.bind(this.game),3)
        }
    }
    override on_player_die(p:Player){
        if(p.team){
            for(const pp of p.team.get_downed_players()){
                pp.kill({amount:pp.health,critical:false,position:pp.position,reason:DamageReason.Bleend,owner:pp.downedBy,source:pp.downedBySource})
            }
        }
        if(this.teamsManager.get_living_teams().length<=1){
            this.game.finish()
        }
    }
}
export class Game extends ServerGame2D<ServerGameObject>{
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

    constructor(clients:OfflineClientsManager,id:ID,config:GameConfig){
        super(config.gameTps,id,clients,PacketManager,[
            Player,
            Loot,
            Bullet,
            Obstacle,
            Explosion,
            Projectile,
            PlayerBody
        ])
        for(const i of CATEGORYSL){
            this.scene.objects.add_category(i)
        }
        this.config=config
        this.clients
        this.scene.objects.encoders=ObjectsE
        this.map=new GameMap(this,v2.new(32,32))
        this.gamemode=DefaultGamemode
        this.modeManager=this.config.teamSize>1?new TeamsGamemodeManager(this):new GamemodeManager(this)
        this.new_list=false
    }

    override on_update(): void {
        super.on_update()
        this.netUpdate()
        if(this.killing_game){
            this.clock.timeScale=Numeric.lerp(this.clock.timeScale,0,0.03)
            if(this.clock.timeScale<=0.05){
                this.clock.timeScale=1
                this.running=false
            }
        }
    }
    privatesDirtysInter=0
    override on_stop():void{
        super.on_stop()
        clearInterval(this.privatesDirtysInter)
        console.log(`Game ${this.id} Stopped`)
    }
    killing_game:boolean=false
    nd:number=0
    send_killfeed_message(msg:KillFeedMessage){
        const p=new KillFeedPacket()
        p.message=msg
        this.clients.emit(p)
    }
    netUpdate(){
        for(const p of Object.values(this.connectedPlayers)){
            p.update2()
        }
        if(this.nd<=0){
            this.scene.objects.update_to_net()
            this.nd=1/this.config.netTps
        }else{
            this.nd-=this.dt
        }
    }
    override on_run(): void {
        this.map.generate()
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

        const jp=new JoinedPacket()

        for(const lp of this.players){
            if(lp.id===p.id)continue
            jp.players.push({
                id:lp.id,
                name:lp.name
            })
        }
        if(this.modeManager.kill_leader){
            jp.kill_leader={
                id:this.modeManager.kill_leader.id,
                kills:this.modeManager.kill_leader.status.kills,
            }
        }
        client.emit(jp)

        this.modeManager.on_player_join(p)
        this.send_killfeed_message({
            type:KillFeedMessageType.join,
            playerId:p.id,
            playerName:p.name,
        })

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
    add_explosion(position:Vec2,def:ExplosionDef,owner?:Player,source?:DamageSourceDef):Explosion{
        const e=this.scene.objects.add_object(new Explosion(),CATEGORYS.EXPLOSIONS,undefined,{defs:def,owner,position:position,source}) as Explosion
        return e
    }
    add_player_body(owner:Player,angle?:number):PlayerBody{
        const b=this.scene.objects.add_object(new PlayerBody(angle),CATEGORYS.PLAYERS_BODY,undefined,{owner_name:owner.name,owner,position:v2.duplicate(owner.position)}) as PlayerBody
        return b
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
                console.log(`${p.name} Connected`)
            }
        })
        client.on("action",(p:ActionPacket)=>{
            if(this.scene.objects.exist(objId)){
                (this.scene.objects.get_object(objId) as Player).process_action(p)
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