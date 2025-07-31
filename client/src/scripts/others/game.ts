import { ClientGame2D, type MousePosListener, type KeyListener, ResourcesManager, Key, KeyEvents, Renderer, ColorM, WebglRenderer, Grid2D} from "../engine/mod.ts"
import { ActionPacket, CATEGORYSL, PacketManager, zIndexes } from "common/scripts/others/constants.ts";
import { BasicSocket, Client, DefaultSignals, Vec2, v2 } from "common/scripts/engine/mod.ts";
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
import { Vehicle } from "../gameObjects/vehicle.ts";
import { Skins } from "common/scripts/definitions/loadout/skins.ts";
import { MouseEvents } from "../engine/keys.ts";
export class Game extends ClientGame2D<GameObject>{
  client?:Client
  activePlayerId=0
  activePlayer?:Player

  action:ActionPacket=new ActionPacket()
  guiManager!:GuiManager

  can_act:boolean=true

  gameOver:boolean=false

  grid:Grid2D
  terrain:TerrainM=new TerrainM()
  
  terrain_gfx=new Graphics2D()
  scope_zoom:number=0.78
  happening:boolean=false

  //0.14=l6 32x
  //0.27=l5 16x
  //0.35=l4 8x
  //0.53=l3 4x
  //0.63=l2 2x
  //0.78=l1 1x
  //1=l-1 0.5x
  //1.5=l-2 0.25x
  //1.75=l-3 0.1x

  constructor(keyl:KeyListener,mp:MousePosListener,sounds:SoundManager,consol:GameConsole,resources:ResourcesManager,renderer:Renderer,objects:Array<new ()=>GameObject>=[]){
    super(keyl,mp,consol,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplash,Decal,PlayerBody,Vehicle])
    for(const i of CATEGORYSL){
      this.scene.objects.add_category(i)
    }
    this.scene.objects.add_category(7)
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

    this.key.listener.on(KeyEvents.KeyUp,(k:Key)=>{
      switch(k){
        case Key.A:
        case Key.D:
          this.action.Movement.x=0
          break
        case Key.W:
        case Key.S:
          this.action.Movement.y=0
          break
        case Key.Mouse_Left:
          this.action.UsingItem=false
          break
      }
    })
    this.key.listener.on(KeyEvents.KeyDown,(k:Key)=>{
      if(!this.can_act)return
      switch(k){
        case Key.A:
          this.action.Movement.x=-1
          break
        case Key.D:
          this.action.Movement.x=1
          break
        case Key.W:
          this.action.Movement.y=-1
          break
        case Key.S:
          this.action.Movement.y=1
          break
        case Key.Number_1:
          this.action.hand=0
          break
        case Key.Number_2:
          this.action.hand=1
          break
        case Key.Number_3:
          this.action.hand=2
          break
        case Key.Number_4:
          this.action.use_slot=0
          break
        case Key.Number_5:
          this.action.use_slot=1
          break
        case Key.Number_6:
          this.action.use_slot=2
          break
        case Key.Number_7:
          this.action.use_slot=3
          break
        case Key.Number_8:
          this.action.use_slot=4
          break
        case Key.Number_9:
          this.action.use_slot=5
          break
        case Key.Number_0:
          this.action.use_slot=6
          break
        case Key.E:
          this.action.interact=true
          break
        case Key.Mouse_Left:
          this.action.UsingItem=this.action.use_slot===-1
          break
      }
    })
    this.mouse.listener.on(MouseEvents.MouseMove,()=>{
      if(this.activePlayer){
        this.action.angle=v2.lookTo(v2.new(this.camera.width/2,this.camera.height/2),v2.dscale(this.mouse.position,this.camera.zoom));
        if(!this.activePlayer.driving){
          (this.activePlayer as Player).container.rotation=this.action.angle
        }
      }
    })
  }
  add_damageSplash(position:Vec2,count:number,critical:boolean,shield:boolean){
    this.scene.objects.add_object(new DamageSplash(),7,undefined,{position,count,critical,shield})
  }
  override on_stop(): void {
    super.on_stop()
    if(!this.gameOver){
      if(this.onstop)this.onstop(this)
    }
  }
  onstop?:(g:Game)=>void
  clear(){
    this.scene.reset()
  }
  override on_render(_dt:number):void{
  }
  override on_run(): void {
    
  }
  override on_update(dt:number): void {
    super.on_update(dt)
    if(this.client&&this.client.opened){
      if(this.can_act){
        this.action.Reloading=this.key.keyPress(Key.R)
      }
      this.client.emit(this.action)
      this.action.interact=false
      this.action.cellphoneAction=undefined
      this.action.hand=-1
      this.action.use_slot=-1
      this.action.drop=-1
      this.action.drop_kind=0
    }
    this.renderer.fullCanvas(this.camera)
    this.camera.resize()
    this.camera.zoom=this.scope_zoom*(this.renderer.canvas.width/1920)
  }
  update_camera(){
    if(this.activePlayer)this.camera.position=this.activePlayer!.position
  }
  connect(client:Client,playerName:string){
    this.client=client
    this.client.on("update",(up:UpdatePacket)=>{
      this.guiManager.update_gui(up.gui)
      this.scene.objects.proccess_l(up.objects!,true)
    })
    this.client.on("killfeed",(kfp:KillFeedPacket)=>{
      this.guiManager.add_killfeed_message(kfp.message)
    })
    this.client.on("joined",(jp:JoinedPacket)=>{
      this.guiManager.process_joined_packet(jp)
      this.happening=true
    })
    this.client.on("map",(mp:MapPacket)=>{
      this.terrain.process_map(mp.map)
      this.terrain.draw(this.terrain_gfx,1)
    })
    this.client.on(DefaultSignals.DISCONNECT,()=>{
      this.running=false
    })
    if(!this.client.opened){
      console.log("not connected")
      return
    }
    this.activePlayer?.onDestroy()
    this.activePlayer=undefined
    const p=new JoinPacket(playerName)
    p.skin=Skins.getFromString(this.save.get_variable("cv_loadout_skin"))?.idNumber??0
    this.client.emit(p)
    this.activePlayerId=this.client.ID
    console.log("Joined As:",this.activePlayerId)
    
    this.guiManager.players_name={}
    this.guiManager.start()
    this.camera.zoom=this.scope_zoom*(this.renderer.canvas.width/300)
  }
  init_gui(gui:GuiManager){
    this.guiManager=gui
    this.guiManager.init(this)
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}