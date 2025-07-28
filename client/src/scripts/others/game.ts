import { ClientGame2D, type MousePosListener, type KeyListener, ResourcesManager, Key, KeyEvents, Renderer, ColorM, WebglRenderer, Grid2D} from "../engine/mod.ts"
import { ActionPacket, CATEGORYS, CATEGORYSL, GameConstants, PacketManager, zIndexes } from "common/scripts/others/constants.ts";
import { BasicSocket, CircleHitbox2D, Client, DefaultSignals, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { GuiManager } from "./guiManager.ts";
import { Explosion } from "../gameObjects/explosion.ts";
import { SoundManager } from "../engine/sounds.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { DamageSplash } from "../gameObjects/damageSplash.ts";
import { GameObject } from "./gameObject.ts";
import { Debug } from "./config.ts";
import { UpdatePacket } from "common/scripts/packets/update_packet.ts";
import { PlayerBody } from "../gameObjects/player_body.ts";
import { Decal } from "../gameObjects/decal.ts";
import {  KillFeedPacket } from "common/scripts/packets/killfeed_packet.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";
import { GameConsole } from "../engine/console.ts";
import { TerrainM } from "../gameObjects/terrain.ts";
import { MapPacket } from "common/scripts/packets/map_packet.ts";
import { Graphics2D } from "../engine/container.ts";
export class Game extends ClientGame2D<GameObject>{
  client:Client
  activePlayerId=0
  activePlayer?:Player

  action:ActionPacket=new ActionPacket()
  guiManager!:GuiManager

  can_act:boolean=true

  gameOver:boolean=false

  grid:Grid2D
  terrain:TerrainM=new TerrainM()
  
  terrain_gfx=new Graphics2D()

  constructor(keyl:KeyListener,mp:MousePosListener,sounds:SoundManager,consol:GameConsole,resources:ResourcesManager,socket:BasicSocket,renderer:Renderer,objects:Array<new ()=>GameObject>=[]){
    super(keyl,mp,consol,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplash,Decal,PlayerBody])
    for(const i of CATEGORYSL){
      this.scene.objects.add_category(i)
    }
    this.scene.objects.add_category(7)
    this.client=new Client(socket,PacketManager)
    this.client.on("update",(up:UpdatePacket)=>{
      this.guiManager.update_gui(up.gui)
      this.scene.objects.proccess_l(up.objects!,true)
    })
    this.client.on("killfeed",(kfp:KillFeedPacket)=>{
      this.guiManager.add_killfeed_message(kfp.message)
    })
    this.client.on("joined",(jp:JoinedPacket)=>{
      this.guiManager.process_joined_packet(jp)
    })
    this.client.on("map",(mp:MapPacket)=>{
      this.terrain.process_map(mp.map)
      this.terrain.draw(this.terrain_gfx,1)
    })
    this.scene.objects.encoders=ObjectsE;

    this.renderer.background=ColorM.hex("#000");

    if(Debug.hitbox){
      const hc=ColorM.hex("#ee000099")
      this.resources.load_material2D("hitbox_player",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_loot",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_bullet",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_obstacle",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_projectile",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
    }

    this.client.on(DefaultSignals.DISCONNECT,()=>{
      this.running=false
    })

    this.grid=new Grid2D()
    this.grid.width=0.04
    this.grid.grid_size=8
    this.grid.color.a=0.2
    this.camera.addObject(this.grid)
    this.grid.zIndex=zIndexes.Grid
    this.sounds.volumes={
      "players":0.45,
      "obstacles":0.7,
    }

    this.terrain_gfx.zIndex=zIndexes.Terrain
    this.camera.addObject(this.terrain_gfx)
  }
  add_damageSplash(position:Vec2,count:number,critical:boolean,shield:boolean){
    this.scene.objects.add_object(new DamageSplash(),7,undefined,{position,count,critical,shield})
  }
  override on_stop(): void {
    super.on_stop()
    if(!this.gameOver){
      this.scene.objects.clear()
      if(this.onstop)this.onstop(this)
    }
  }
  onstop?:(g:Game)=>void
  override on_render(_dt:number):void{
  }
  override on_run(): void {
    this.key.listener.on(KeyEvents.KeyDown,(k:Key)=>{
      if(!this.can_act)return
      switch(k){
        case Key.Number_1:
          this.action.hand=0
          break
        case Key.Number_2:
          this.action.hand=1
          break
        case Key.Number_3:
          this.action.hand=2
          break
        case Key.E:
          this.action.interact=true
      }
    })
  }
  override on_update(dt:number): void {
    super.on_update(dt)
    if(this.client.opened){
      if(this.can_act){
        if(this.key.keyPress(Key.A)){
          this.action.Movement.x=-1
        }else if(this.key.keyPress(Key.D)){
          this.action.Movement.x=1
        }else{
          this.action.Movement.x=0
        }
  
        if(this.key.keyPress(Key.W)){
          this.action.Movement.y=-1
        }else if(this.key.keyPress(Key.S)){
          this.action.Movement.y=1
        }else{
          this.action.Movement.y=0
        }
        this.action.UsingItem=this.key.keyPress(Key.Mouse_Left)
        this.action.Reloading=this.key.keyPress(Key.R)
      }
      this.client.emit(this.action)
      this.action.interact=false
      this.action.cellphoneAction=undefined
      this.action.hand=-1

      if(this.activePlayer){
        this.action.angle=v2.lookTo(v2.new(this.camera.width/2,this.camera.height/2),v2.dscale(this.mouse.position,this.camera.zoom));
        (this.activePlayer as Player).container.rotation=this.action.angle
      }
    }
    this.camera.zoom=0.27
    this.renderer.fullCanvas(this.camera)
    this.camera.resize()
    //0.14=l6 32x
    //0.27=l5 16x
    //0.35=l4 8x
    //0.53=l3 4x
    //0.63=l2 2x
    //0.78=l1 1x
    //1=l-1 0.5x
    //1.5=l-2 0.25x
    //1.75=l-3 0.1x
  }
  update_camera(){
    if(this.activePlayer)this.camera.position=this.activePlayer!.position
  }
  connect(playerName:string){
    if(!this.client.opened){
      console.log("not connected")
      return
    }
    this.client.emit(new JoinPacket(playerName))
    this.activePlayerId=this.client.ID
    console.log("Joined As:",this.activePlayer)
    
    this.guiManager.players_name={}
    this.guiManager.clear_killfeed()
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}