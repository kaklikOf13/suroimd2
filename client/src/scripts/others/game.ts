import { ClientGame2D, ResourcesManager, Renderer, ColorM, WebglRenderer, InputManager} from "../engine/mod.ts"
import { ActionPacket, GameConstants, LayersL, zIndexes } from "common/scripts/others/constants.ts";
import { Client, DefaultSignals, Numeric, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { GuiManager } from "../managers/guiManager.ts";
import { Explosion } from "../gameObjects/explosion.ts";
import { SoundManager } from "../engine/sounds.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { DamageSplashOBJ } from "../gameObjects/damageSplash.ts";
import { GameObject } from "./gameObject.ts";
import { Debug } from "./config.ts";
import { type DamageSplash, UpdatePacket } from "common/scripts/packets/update_packet.ts";
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
import { ActionEvent, GamepadManagerEvent, MouseEvents } from "../engine/keys.ts";
import { Creature } from "../gameObjects/creature.ts";
export class Game extends ClientGame2D<GameObject>{
  client?:Client
  activePlayerId=0
  activePlayer?:Player

  action:ActionPacket=new ActionPacket()
  guiManager!:GuiManager

  can_act:boolean=true

  gameOver:boolean=false

  terrain:TerrainM=new TerrainM()
  
  terrain_gfx=new Graphics2D()
  grid_gfx=new Graphics2D()
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

  listners_init(){
    this.input_manager.on("actiondown",(a:ActionEvent)=>{
      switch(a.action){
        case "fire":
          this.action.UsingItem=true
          break
        case "reload":
          this.action.Reloading=true
          break
        case "interact":
          this.action.interact=true
          break
        case "weapon1":
          this.action.hand=0
          break
        case "weapon2":
          this.action.hand=1
          break
        case "weapon3":
          this.action.hand=2
          break
        case "move_left":
          this.action.Movement.x=-1
          break
        case "move_right":
          this.action.Movement.x=1
          break
        case "move_up":
          this.action.Movement.y=-1
          break
        case "move_down":
          this.action.Movement.y=1
          break
        case "use_item1":
          this.action.use_slot=0
          break
        case "use_item2":
          this.action.use_slot=1
          break
        case "use_item3":
          this.action.use_slot=2
          break
        case "use_item4":
          this.action.use_slot=3
          break
        case "use_item5":
          this.action.use_slot=4
          break
        case "use_item6":
          this.action.use_slot=5
          break
        case "use_item7":
          this.action.use_slot=6
          break
        case "previour_weapon":
          this.action.hand=this.guiManager.currentWeaponIDX-1
          break
        case "next_weapon":
          this.action.hand=Numeric.loop(this.guiManager.currentWeaponIDX+1,-1,3)
          break
        case "expanded_inventory":
          this.guiManager.set_all_inventory(!this.guiManager.all_inventory_enabled)
          break
      }
    })
    this.input_manager.on("actionup",(a:ActionEvent)=>{
      switch(a.action){
        case "fire":
          this.action.UsingItem=false
          break
        case "move_left":
          this.action.Movement.x=this.action.Movement.x!==-1?this.action.Movement.x:0
          break
        case "move_right":
          this.action.Movement.x=this.action.Movement.x!==1?this.action.Movement.x:0
          break
        case "move_up":
          this.action.Movement.y=this.action.Movement.y!==-1?this.action.Movement.y:0
          break
        case "move_down":
          this.action.Movement.y=this.action.Movement.y!==1?this.action.Movement.y:0
          break
      }
    })
    this.input_manager.mouse.listener.on(MouseEvents.MouseMove,()=>{
      this.set_lookTo_angle(v2.lookTo(v2.new(this.camera.width/2,this.camera.height/2),v2.dscale(this.input_manager.mouse.position,this.camera.zoom)))
    })
    
    this.input_manager.gamepad.listener.on(GamepadManagerEvent.analogicmove,(e: { stick: string; axis: Vec2; })=>{
      if(e.stick==="left"){
        this.action.Movement=e.axis
      }else if(e.stick==="right"){
        this.set_lookTo_angle(Math.atan2(e.axis.y,e.axis.x))
      }
    })
  }
  set_lookTo_angle(angle:number){
    this.action.angle=angle;
    if(this.activePlayer&&!this.activePlayer.driving){
      (this.activePlayer as Player).container.rotation=this.action.angle
    }
  }
  constructor(input_manager:InputManager,sounds:SoundManager,consol:GameConsole,resources:ResourcesManager,renderer:Renderer,objects:Array<new ()=>GameObject>=[]){
    super(input_manager,consol,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplashOBJ,Decal,PlayerBody,Vehicle,Creature])
    for(const i of LayersL){
      this.scene.objects.add_layer(i)
    }
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
    this.terrain_gfx.zIndex=zIndexes.Terrain
    this.camera.addObject(this.terrain_gfx)
    this.camera.addObject(this.grid_gfx)
    this.grid_gfx.zIndex=zIndexes.Grid
  }
  add_damageSplash(d:DamageSplash){
    this.scene.objects.add_object(new DamageSplashOBJ(),7,undefined,d)
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
      this.client.emit(this.action)
      this.action.interact=false
      this.action.cellphoneAction=undefined
      this.action.Reloading=false
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
    if(this.activePlayer){
      this.camera.position=this.activePlayer!.position
      const gridSize=GameConstants.collision.chunckSize
      this.grid_gfx.clear()
      this.grid_gfx.fill_color(ColorM.hex("#0000001e"))
      this.grid_gfx.drawGrid(v2.sub(v2.floor(v2.dscale(v2.sub(this.camera.position,v2.new(this.camera.width/2,this.camera.height/2)),gridSize)),v2.new(1,1)),v2.ceil(v2.new(this.camera.width/gridSize+2,this.camera.height/gridSize+2)),gridSize,0.08)
    }
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
    this.renderer.fullCanvas(this.camera)
  }
  init_gui(gui:GuiManager){
    this.guiManager=gui
    this.guiManager.init(this)
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}