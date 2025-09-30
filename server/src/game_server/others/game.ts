import { ID, Numeric, ReplayRecorder2D, ValidString, Vec2, random, v2 } from "common/scripts/engine/mod.ts"
import { GameConstants, Layers, LayersL, PacketManager } from "common/scripts/others/constants.ts"
import { Player } from "../gameObjects/player.ts"
import { Loot } from "../gameObjects/loot.ts"
import { JoinPacket } from "common/scripts/packets/join_packet.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { ObjectsE } from "common/scripts/others/objectsEncode.ts"
import { Bullet } from "../gameObjects/bullet.ts"
import { Obstacle } from "../gameObjects/obstacle.ts"
import { GameMap, generation } from "./map.ts"
import { Explosion } from "../gameObjects/explosion.ts";
import { DefaultGamemode, Gamemode } from "./gamemode.ts";
import { BulletDef, GameItem } from "common/scripts/definitions/utils.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { ProjectileDef } from "common/scripts/definitions/projectiles.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { ServerGameObject } from "./gameObject.ts";
import { Client, DefaultSignals, OfflineClientsManager, ServerGame2D } from "common/scripts/engine/server_offline/offline_server.ts";
import { PlayerBody } from "../gameObjects/player_body.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";
import { KillFeedMessage, KillFeedMessageType, KillFeedPacket } from "common/scripts/packets/killfeed_packet.ts";
import { DamageSourceDef } from "common/scripts/definitions/alldefs.ts";
import { Vehicle } from "../gameObjects/vehicle.ts";
import { VehicleDef, Vehicles } from "common/scripts/definitions/objects/vehicles.ts";
import { Skins } from "common/scripts/definitions/loadout/skins.ts";
import { Badges } from "common/scripts/definitions/loadout/badges.ts";
import { Creature } from "../gameObjects/creature.ts";
import { CreatureDef } from "common/scripts/definitions/objects/creatures.ts";
import { FloorType } from "common/scripts/others/terrain.ts";
import { Obstacles, SpawnModeType } from "common/scripts/definitions/objects/obstacles.ts";
import { ConfigType, GameDebugOptions } from "common/scripts/config/config.ts";
import { GamemodeManager, SoloGamemodeManager } from "./modeManager.ts";
import { PlaneData } from "common/scripts/packets/update_packet.ts";
import { DeadZoneDefinition, DeadZoneManager, DeadZoneMode } from "../gameObjects/deadzone.ts";
export interface PlaneDataServer extends PlaneData{
    velocity:Vec2
    target_pos:Vec2
    called:boolean
}
export interface GameStatus{
    players:{
        name:string
        username:string
        kills:number
    }[]
}
export class Game extends ServerGame2D<ServerGameObject>{
    map:GameMap
    gamemode:Gamemode
    subscribe_db?:Record<string,{
        skins:number[],
    }>

    debug!:GameDebugOptions

    players:Player[]=[]
    livingPlayers:Player[]=[]
    connectedPlayers:Record<number,Player>={}

    bullets:Record<number,Bullet>=[]

    modeManager:GamemodeManager

    started:boolean=false

    status:GameStatus={
        players:[]
    }

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
    string_id=""
    Config:ConfigType

    replay?:ReplayRecorder2D

    deadzone:DeadZoneManager

    constructor(clients:OfflineClientsManager,id:ID,Config:ConfigType){
        super(Config.game.config.gameTps,id,clients,PacketManager,[
            Player,
            Loot,
            Bullet,
            Obstacle,
            Explosion,
            Projectile,
            PlayerBody,
            Vehicle,
            Creature
        ])
        for(const i of LayersL){
            this.scene.objects.add_layer(i)
        }
        this.Config=Config
        this.debug=Config.game.debug
        this.scene.objects.encoders=ObjectsE
        this.map=new GameMap(this)
        this.gamemode=DefaultGamemode
        this.modeManager=/*this.config.teamSize>1?new TeamsGamemodeManager(this):*/new SoloGamemodeManager(this)
        this.new_list=false
        this.modeManager.generate_map()
        this.deadzone=new DeadZoneManager(this,{
            mode:DeadZoneMode.Staged,
            stages:DeadZoneDefinition,
        })
        this.net_interval=setInterval(this.netUpdate.bind(this),1000/this.Config.game.config.netTps)
    }
    override on_update(): void {
        super.on_update()
        this.deadzone.tick(this.dt)
        for(const p of this.planes){
            p.pos=v2.add(p.pos,v2.scale(p.velocity,this.dt))
            switch(p.type){
                case 0:
                    if(!p.called&&v2.distance(p.pos,p.target_pos)<=4){
                        const obs=this.map.add_obstacle(Obstacles.getFromString("copper_crate"))
                        obs.set_position(v2.duplicate(p.pos))
                        obs.manager.cells.updateObject(obs)
                        p.called=true
                    }
                    break
            }
        }
        if(this.killing_game){
            this.clock.timeScale=Numeric.lerp(this.clock.timeScale,0,0.03)
            if(this.clock.timeScale<=0.05){
                this.clock.timeScale=1
                this.running=false
            }
        }
    }
    planes:PlaneDataServer[]=[]
    add_airdrop(position:Vec2){
        const dir=v2.lookTo(v2.new(0,0),position)
        
        this.planes.push({
            id:random.int(0,1000000),
            complete:false,
            direction:dir,
            target_pos:position,
            called:false,
            pos:v2.new(0,0),//v2.mult(v2.from_RadAngle(dir),this.map.size),
            velocity:v2.scale(v2.from_RadAngle(dir),8),
            type:0
        })
    }
    override on_stop():void{
        super.on_stop()
        if(this.replay)this.replay.stop()
        clearInterval(this.net_interval)
        for(const p of this.players){
            this.status.players.push({
                kills:p.status.kills,
                name:p.name,
                username:p.name,
            })
        }
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
        for(const p of this.players){
            if(p.connected){
                p.update2()
            }
        }
        this.scene.objects.update_to_net()
        this.scene.objects.apply_destroy_queue()
    }
    add_player(id:number|undefined,username:string,packet:JoinPacket,layer:number=Layers.Normal,connected=true):Player{
        const p=this.scene.objects.add_object(new Player(),layer,id) as Player
        if(ValidString.simple_characters(packet.PlayerName)){
            p.name=packet.PlayerName
        }else{
            //Round 6 Easter Egg
            p.name=`${GameConstants.player.defaultName}#${Math.random()<=0.005?456:this.players.length+1}`
        }
        this.players.push(p)
        this.livingPlayers.push(p)

        p.pvpEnabled=this._pvpEnabled||this.debug.deenable_lobby===true
        p.input.is_mobile=packet.is_mobile

        p.username=username

        const pos=this.map.getRandomPosition(p.hb,p.id,p.layer,{
            type:SpawnModeType.whitelist,
            list:[FloorType.Grass],
        },this.map.random)
        if(pos)p.position=pos
        p.manager.cells.updateObject(p)

        if(connected){
            this.send_killfeed_message({
                type:KillFeedMessageType.join,
                playerId:p.id,
                playerName:p.name,
                playerBadge:Badges.getFromString(p.loadout.badge).idNumber
            })
            this.modeManager.on_player_join(p)
        }
        p.inventory.set_current_weapon_index(0)
        return p
    }
    override on_run(): void {
    }
    async activate_player(username:string,packet:JoinPacket,client:Client){
        const p=this.add_player(client.ID,username,packet) as Player;
            p.client=client;
            p.update2()
        this.connectedPlayers[p.id]=p
        p.connected=true
        if(this.Config.database.enabled){
            let ff
            if(this.subscribe_db){
                ff=this.subscribe_db[p.username]
            }else{
                ff=await(await fetch(`${this.Config.api.global}/get-status/${p.username}`)).json()
            }

            if(ff.user){
                const inv=JSON.parse(ff.user.inventory)
                const s=Skins.getFromNumber(packet.skin)
                if(inv.skins.includes(s.idNumber)){
                    p.skin=s
                    p.loadout.skin=s.idString
                }
            }
        }else{
            p.username=""
            const s=Skins.getFromNumber(packet.skin)
            p.skin=s
            p.loadout.skin=s.idString
        }
        

        const jp=new JoinedPacket()

        for(const lp of this.players){
            if(lp.id===p.id)continue
            jp.players.push({
                id:lp.id,
                name:lp.name,
                badge:Badges.getFromString(lp.loadout.badge).idNumber
            })
        }
        if(this.modeManager.kill_leader){
            jp.kill_leader={
                id:this.modeManager.kill_leader.id,
                kills:this.modeManager.kill_leader.status.kills,
            }
        }
        client.emit(jp)
        client.sendStream(this.map.map_packet_stream)

        if(Math.random()<0.2){
            const vehicle=this.add_vehicle(p.position,Vehicles.getFromString(random.choose(["bike","jeep"])))
            vehicle.seats[0].set_player(p)
            p.dirty=true
        }
        return p
    }
    add_npc(name?:string,layer?:number):Player{
        const p=this.add_player(undefined,"",new JoinPacket(name),layer,false)
        p.is_npc=true
        p.connected=true
        return p
    }
    add_bot(name?:string,layer?:number):Player{
        const p=this.add_player(undefined,"",new JoinPacket(name),layer,true)
        p.connected=true
        p.is_bot=true
        p.is_npc=false
        return p
    }
    fineshed:boolean=false
    net_interval=0
    start(){
        if(this.started||!this.modeManager.start_rules())return
        this.started=true
        this.modeManager.on_start()
        this.add_airdrop(v2.random2(v2.new(0,0),this.map.size))
        if(this.replay)this.replay.start()
        console.log(`Game ${this.id} Started`)
        this.deadzone.start()
    }
    finish(){
        if(this.fineshed)return
        this.fineshed=true
        this.modeManager.on_finish()
        console.log(`Game ${this.id} Fineshed`)
    }
    add_bullet(position:Vec2,angle:number,def:BulletDef,owner?:Player,ammo?:string,source?:DamageSourceDef,layer:number=Layers.Normal):Bullet{
        const b=this.scene.objects.add_object(new Bullet(),layer,undefined,{
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
    add_explosion(position:Vec2,def:ExplosionDef,owner?:Player,source?:DamageSourceDef,layer:number=Layers.Normal):Explosion{
        const e=this.scene.objects.add_object(new Explosion(),layer,undefined,{defs:def,owner,position:position,source}) as Explosion
        return e
    }
    add_player_body(owner:Player,angle?:number,layer:number=Layers.Normal):PlayerBody{
        const b=this.scene.objects.add_object(new PlayerBody(angle),layer,undefined,{owner_name:owner.name,owner_badge:owner.loadout.badge,owner,position:v2.duplicate(owner.position)}) as PlayerBody
        return b
    }
    add_player_gore(owner:Player,angle?:number,layer:number=Layers.Normal):PlayerBody{
        const b=this.scene.objects.add_object(new PlayerBody(angle,random.float(4,8)),layer,undefined,{owner_name:"",owner,position:v2.duplicate(owner.position),gore_type:1,gore_id:random.int(0,2)}) as PlayerBody
        return b
    }
    add_projectile(position:Vec2,def:ProjectileDef,owner?:Player,layer:number=Layers.Normal):Projectile{
        const p=this.scene.objects.add_object(new Projectile(),layer,undefined,{defs:def,owner,position:position}) as Projectile
        return p
    }
    add_loot(position:Vec2,def:GameItem,count:number,layer:number=Layers.Normal):Loot{
        const l=this.scene.objects.add_object(new Loot(),layer,undefined,{item:def,count:count,position:position}) as Loot
        return l
    }
    add_vehicle(position:Vec2,def:VehicleDef,layer:number=Layers.Normal):Vehicle{
        const v=this.scene.objects.add_object(new Vehicle(),layer,undefined,{position,def}) as Vehicle
        return v
    }
    
    add_creature(position:Vec2,def:CreatureDef,layer:number=Layers.Normal):Creature{
        const c=this.scene.objects.add_object(new Creature(),layer,undefined,{position,def}) as Creature
        return c
    }
    handleConnections(client:Client,username:string){
        let player:Player|undefined
        client.on("join",async(packet:JoinPacket)=>{
            if (this.allowJoin&&!this.scene.objects.exist_all(client.ID,1)){
                const p=await this.activate_player(username,packet,client)
                player=p
                console.log(`${p.name} Connected`)
            }
        })
        client.on("action",(p:ActionPacket)=>{
            if(player){
                player.process_action(p)
            }
        })
        client.on(DefaultSignals.DISCONNECT,()=>{
            if(player){
                player.connected=false
                delete this.connectedPlayers[player.id]
                console.log(`${player.name} Disconnected`)
            }
        })
    }
}
