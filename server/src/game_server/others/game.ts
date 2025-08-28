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
import { Creature } from "../gameObjects/creature.ts";
import { CreatureDef } from "common/scripts/definitions/objects/creatures.ts";
import { FloorType } from "common/scripts/others/terrain.ts";
import { Obstacles, SpawnModeType } from "common/scripts/definitions/objects/obstacles.ts";
import { ConfigType, GameConfig } from "common/scripts/config/config.ts";
import { GamemodeManager, TeamsGamemodeManager } from "./modeManager.ts";
import { PlaneData } from "common/scripts/packets/update_packet.ts";
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
    config:GameConfig
    map:GameMap
    gamemode:Gamemode
    subscribe_db?:Record<string,{
        skins:number[],
    }>


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
    string_id=""
    Config:ConfigType

    replay?:ReplayRecorder2D

    constructor(clients:OfflineClientsManager,id:ID,config:GameConfig,Config:ConfigType){
        super(config.gameTps,id,clients,PacketManager,[
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
        this.config=config
        this.Config=Config
        this.clients
        this.scene.objects.encoders=ObjectsE
        this.map=new GameMap(this)
        this.gamemode=DefaultGamemode
        this.modeManager=this.config.teamSize>1?new TeamsGamemodeManager(this):new GamemodeManager(this)
        this.new_list=false
        /*this.map.generate(generation.island({
            generation:{
                size:v2.new(800,800),
                ground_loot:[{count:900,table:"ground_loot"}],
                spawn:[
                    [
                        {id:"oak_tree",count:4000},
                        {id:"stone",count:3300},
                        {id:"bush",count:2500},
                        {id:"wood_crate",count:1200},
                        {id:"barrel",count:1000}
                    ]
                ],
                terrain:{
                    base:FloorType.Water,
                    rivers:{
                        divisions:100,
                        spawn_floor:1,
                        expansion:32,
                        defs:[
                            {
                                rivers:[
                                    {sub_river_width:2,width:10,width_variation:1,sub_river_chance:0.5},
                                    {sub_river_width:1,width:15,width_variation:1,sub_river_chance:0.1},
                                ],
                                weight:10
                            },
                            {
                                rivers:[
                                    {sub_river_width:3,width:20,width_variation:1,sub_river_chance:0.9},
                                ],
                                weight:1
                            }
                        ]
                    },
                    floors:[
                        {
                            padding:25,
                            type:FloorType.Sand,
                            spacing:0.3,
                            variation:1.3,
                        },
                        {
                            padding:14,
                            type:FloorType.Grass,
                            spacing:0.3,
                            variation:1.3,
                        }
                    ]
                }
            }
        }))*/
        this.map.generate(generation.island({
            generation:{
                size:v2.new(100,100),
                ground_loot:[{count:20,table:"ground_loot"}],
                spawn:[
                    [
                        {id:"oak_tree",count:40},
                        {id:"stone",count:30},
                        {id:"bush",count:20},
                        {id:"wood_crate",count:10},
                        {id:"barrel",count:8},

                        {id:"pig",count:10},
                        {id:"chicken",count:10}
                    ]
                ],
                terrain:{
                    base:FloorType.Water,
                    rivers:{
                        divisions:30,
                        spawn_floor:1,
                        expansion:12,
                        defs:[
                            {
                                rivers:[
                                    {sub_river_width:2,width:2,width_variation:1,sub_river_chance:0.5},
                                    {sub_river_width:1,width:3,width_variation:1,sub_river_chance:0.1},
                                ],
                                weight:10
                            },
                            {
                                rivers:[
                                    {sub_river_width:3,width:4,width_variation:1,sub_river_chance:0.9},
                                ],
                                weight:1
                            }
                        ]
                    },
                    floors:[
                        {
                            padding:15,
                            type:FloorType.Sand,
                            spacing:3,
                            variation:1.3,
                        },
                        {
                            padding:10,
                            type:FloorType.Grass,
                            spacing:3,
                            variation:1.3,
                        }
                    ]
                }
            }
        }),3)
    }
    override on_update(): void {
        super.on_update()
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
        this.netUpdate()
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
    privatesDirtysInter=0
    override on_stop():void{
        super.on_stop()
        if(this.replay)this.replay.stop()
        clearInterval(this.privatesDirtysInter)
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

        p.pvpEnabled=this._pvpEnabled
        p.interactionsEnabled=this._interactionsEnabled

        p.username=username

        const pos=this.map.getRandomPosition(p.hb,p.id,p.layer,{
            type:SpawnModeType.whitelist,
            list:[FloorType.Grass],
        },this.map.random)
        if(pos)p.position=pos
        p.manager.cells.updateObject(p)

        p.position=v2.new(100,100)

        if(connected){
            this.send_killfeed_message({
                type:KillFeedMessageType.join,
                playerId:p.id,
                playerName:p.name,
            })
            this.modeManager.on_player_join(p)
        }
        this.add_airdrop(v2.duplicate(p.position))
        return p
    }
    override on_run(): void {
        for(let i=0;i<9;i++){
            //this.add_bot()
        }
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
        }
        

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
        client.sendStream(this.map.map_packet_stream)

        if(Math.random()<=0.5){
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
    start(){
        if(this.started||!this.modeManager.startRules())return
        this.started=true
        this.modeManager.on_start()
        if(this.replay)this.replay.start()
        console.log(`Game ${this.id} Started`)
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
        const b=this.scene.objects.add_object(new PlayerBody(angle),layer,undefined,{owner_name:owner.name,owner,position:v2.duplicate(owner.position)}) as PlayerBody
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
