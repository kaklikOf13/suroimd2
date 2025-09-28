import { ClientGame2D, ResourcesManager, Renderer, ColorM, InputManager} from "../engine/mod.ts"
import { ActionPacket, GameConstants, LayersL, zIndexes } from "common/scripts/others/constants.ts";
import { Angle, Client, DefaultSignals, KDate, Numeric, ParticlesEmitter2D, Vec2, random, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { GuiManager } from "../managers/guiManager.ts";
import { Explosion } from "../gameObjects/explosion.ts";
import { ManipulativeSoundInstance, SoundManager } from "../engine/sounds.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { DamageSplashOBJ } from "../gameObjects/damageSplash.ts";
import { GameObject } from "./gameObject.ts";
import { Debug } from "./config.ts";
import { type DamageSplash, PrivateUpdate, UpdatePacket } from "common/scripts/packets/update_packet.ts";
import { PlayerBody } from "../gameObjects/player_body.ts";
import { Decal } from "../gameObjects/decal.ts";
import {  KillFeedPacket } from "common/scripts/packets/killfeed_packet.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";
import { GameConsole } from "../engine/console.ts";
import { TerrainM } from "../gameObjects/terrain.ts";
import { MapPacket } from "common/scripts/packets/map_packet.ts";
import { Graphics2D, Lights2D, Sprite2D } from "../engine/container.ts";
import { Vehicle } from "../gameObjects/vehicle.ts";
import { Skins } from "common/scripts/definitions/loadout/skins.ts";
import { ActionEvent, AxisActionEvent, GamepadManagerEvent, Key, MouseEvents } from "../engine/keys.ts";
import { Creature } from "../gameObjects/creature.ts";
import { WebglRenderer } from "../engine/renderer.ts";
import { MinimapManager } from "../managers/miniMapManager.ts";
import { Plane } from "./planes.ts";
import { ClientParticle2D, isMobile, RainParticle2D } from "../engine/game.ts";
import { DeadZoneManager } from "../managers/deadZoneManager.ts";
import { Tween } from "svelte/motion";
import { ToggleElement } from "../engine/utils.ts";
import { type MenuManager } from "../managers/menuManager.ts";
import { InputActionType } from "common/scripts/packets/action_packet.ts";
import { TabManager } from "../managers/tabManager.ts";
export const gridSize=5
export class Game extends ClientGame2D<GameObject>{
  client?:Client
  activePlayerId=0
  activePlayer?:Player

  action:ActionPacket=new ActionPacket()
  guiManager!:GuiManager
  menuManager!:MenuManager

  can_act:boolean=true

  gameOver:boolean=false

  terrain:TerrainM=new TerrainM(this)
  
  terrain_gfx=new Graphics2D()
  grid_gfx=new Graphics2D()
  scope_zoom:number=0.53

  music:ManipulativeSoundInstance
  ambience:ManipulativeSoundInstance
  //0.14=l6 32x
  //0.27=l5 16x
  //0.35=l4 8x
  //0.53=l3 4x
  //0.63=l2 2x
  //0.78=l1 1x
  //1=l-1 0.5x
  //1.5=l-2 0.25x
  //1.75=l-3 0.1x
  //2=l-4 0.05x
  flying_position:number=0
  happening:boolean=false

  light_map=new Lights2D()

  minimap:MinimapManager=new MinimapManager(this)

  dead_zone:DeadZoneManager=new DeadZoneManager(this)

  tab:TabManager=new TabManager(this)

  fake_crosshair=new Sprite2D()

  fps:number=60
  frame_calc:number=0

  date:KDate={
    second:0,
    minute:0,
    day:10,
    hour:4,
    month:3,
    year:2000
  }

  listners_init(){
    this.input_manager.add_axis("movement",
      {
        keys:[Key.W],
        buttons:[]
      },
      {
        keys:[Key.S],
        buttons:[]
      },
      {
        keys:[Key.A],
        buttons:[]
      },
      {
        keys:[Key.D],
        buttons:[]
      }
    )
    this.input_manager.on("axis",(a:AxisActionEvent)=>{
      if(a.action==="movement"){
        this.action.movement=a.value
      }
    })
    this.input_manager.on("actiondown",(a:ActionEvent)=>{
      if(!this.can_act)return
      switch(a.action){
        case "fire":
          this.action.use_weapon=true
          break
        case "emote_wheel":
          this.guiManager.begin_emote_wheel(this.input_manager.mouse.position)
          break
        case "reload":
          this.action.reload=true
          break
        case "interact":
          this.action.interact=true
          if(this.activePlayer&&this.activePlayer.current_interaction&&this.activePlayer.current_interaction.stringType==="loot"&&(this.activePlayer.current_interaction as Loot).pickup_sound){
            this.sounds.play((this.activePlayer.current_interaction as Loot).pickup_sound!,{

            },"loot")
          }
          break
        case "swamp_guns":
          this.action.swamp_guns=true
          break
        case "weapon1":
          this.action.actions.push({type:InputActionType.set_hand,hand:0})
          break
        case "weapon2":
          this.action.actions.push({type:InputActionType.set_hand,hand:1})
          break
        case "weapon3":
          this.action.actions.push({type:InputActionType.set_hand,hand:2})
          break
        case "full_tab":
          this.tab.toggle_tab_full()
          break
        case "hide_tab":
          this.tab.toggle_tab_visibility()
          break
        case "use_item1":
          this.action.actions.push({type:InputActionType.use_item,slot:0})
          break
        case "use_item2":
          this.action.actions.push({type:InputActionType.use_item,slot:1})
          break
        case "use_item3":
          this.action.actions.push({type:InputActionType.use_item,slot:2})
          break
        case "use_item4":
          this.action.actions.push({type:InputActionType.use_item,slot:3})
          break
        case "use_item5":
          this.action.actions.push({type:InputActionType.use_item,slot:4})
          break
        case "use_item6":
          this.action.actions.push({type:InputActionType.use_item,slot:5})
          break
        case "use_item7":
          this.action.actions.push({type:InputActionType.use_item,slot:6})
          break
        case "previour_weapon":
          this.action.actions.push({type:InputActionType.set_hand,hand:this.guiManager.currentWeaponIDX-1})
          break
        case "next_weapon":
          this.action.actions.push({type:InputActionType.set_hand,hand:Numeric.loop(this.guiManager.currentWeaponIDX+1,-1,3)})
          break
        case "expanded_inventory":
          this.guiManager.set_all_inventory(!this.guiManager.all_inventory_enabled)
          break
        case "debug_menu":
          if(!this.menuManager.api_settings.debug.debug_menu)break
          ToggleElement(this.guiManager.content.debug_menu)
          break
      }
    })
    this.input_manager.on("actionup",(a:ActionEvent)=>{
      switch(a.action){
        case "fire":
          this.action.use_weapon=false
          break
        case "emote_wheel":
          this.guiManager.end_emote_wheel()
          break
      }
    })
    this.input_manager.mouse.listener.on(MouseEvents.MouseMove,()=>{
      if(!isMobile){
        this.fake_crosshair.visible=false
        this.set_lookTo_angle(v2.lookTo(v2.new(this.camera.width/2,this.camera.height/2),v2.dscale(this.input_manager.mouse.position,this.camera.zoom)))
      }
    })
    
    this.input_manager.gamepad.listener.on(GamepadManagerEvent.analogicmove,(e: { stick: string; axis: Vec2; })=>{
      if(e.stick==="left"){
        this.action.movement=e.axis
      }else if(e.stick==="right"){
        this.set_lookTo_angle(Math.atan2(e.axis.y,e.axis.x),true)
        this.fake_crosshair.visible=true
      }
    })
  }
  set_lookTo_angle(angle:number,aim_assist:boolean=false,aim_assist_help:number=0.2){
    if(!this.activePlayer)return
    if(aim_assist){
      for(const o of this.scene.objects.objects[this.activePlayer.layer].orden){
        const obj=this.scene.objects.objects[this.activePlayer.layer].objects[o]
        if(obj.id===this.activePlayerId||obj.stringType!=="player")continue
        const ang=v2.lookTo(this.activePlayer.position,obj.position)
        if(Math.abs(angle-ang)<=aim_assist_help){
          angle=ang
          break
        }
      }
    }
    this.action.angle=angle;
    if(this.save.get_variable("cv_game_client_rot")&&!this.activePlayer.driving){
      (this.activePlayer as Player).rotation=this.action.angle
    }
  }
  rain_particles_emitter:ParticlesEmitter2D<ClientParticle2D>
  constructor(input_manager:InputManager,menu:MenuManager,sounds:SoundManager,consol:GameConsole,resources:ResourcesManager,renderer:Renderer,objects:Array<new ()=>GameObject>=[]){
    super(input_manager,consol,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplashOBJ,Decal,PlayerBody,Vehicle,Creature])
    for(const i of LayersL){
      this.scene.objects.add_layer(i)
    }
    this.scene.objects.encoders=ObjectsE;

    this.renderer.background=ColorM.hex("#000");

    this.menuManager=menu

    if(Debug.hitbox){
      /*const hc=ColorM.hex("#ee000099")
      this.resources.load_material2D("hitbox_player",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_loot",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_bullet",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_obstacle",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))
      this.resources.load_material2D("hitbox_projectile",(this.renderer as WebglRenderer).factorys2D.simple.create_material(hc))*/
    }
    this.terrain_gfx.zIndex=zIndexes.Terrain
    this.camera.addObject(this.terrain_gfx)
    this.camera.addObject(this.grid_gfx)
    this.camera.addObject(this.light_map)
    this.camera.addObject(this.fake_crosshair)

    this.fake_crosshair.zIndex=zIndexes.DamageSplashs
    this.fake_crosshair.hotspot=v2.new(.5,.5)

    this.light_map.ambient=0.6
    this.light_map.zIndex=zIndexes.Lights
    this.grid_gfx.zIndex=zIndexes.Grid
    this.rain_particles_emitter=this.particles.add_emiter({
      delay:0.005,
      particle:()=>new RainParticle2D({
        frame:{
          main:{
            image:"raindrop_1",
          },
          wave:{
            image:"raindrop_2",
          }
        },
        zindex:{
          main:zIndexes.Rain1,
          wave:zIndexes.Rain2,
        },
        speed:25,
        lifetime:random.float(0.5,1.2),
        scale:{
          main:random.float(0.7,1.5)
        },
        position:v2.random2(v2.sub(this.camera.visual_position,v2.new(7,7)),v2.add(this.camera.visual_position,v2.new(this.camera.width,this.camera.height))),
        rotation:Angle.deg2rad(45),
      }),
      enabled:this.save.get_variable("cv_graphics_climate")
    })
    this.dead_zone.append()

    this.music=this.sounds.add_manipulative_si("music")
    this.ambience=this.sounds.add_manipulative_si("ambience")

    setInterval(()=>{
      this.fps=this.frame_calc
      this.frame_calc=0
    },1000)
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
    for(const p of this.planes.values()){
      p.free()
    }
    this.planes.clear()
  }
  override on_render(_dt:number):void{
    this.light_map.render(this.renderer as WebglRenderer,this.camera)
    this.minimap.draw()
  }
  override on_run(): void {
    
  }
  override on_update(dt:number): void {
    super.on_update(dt)
    this.dead_zone.tick(dt)
    this.date.second+=dt
    if(this.date.second>=1){
      this.date.second=0
      this.date.minute++
      if(this.date.minute>=60){
        this.date.minute=0
        this.date.hour+=1
      }
      this.tab.update_header(this.date)
    }
    if(this.client&&this.client.opened&&this.can_act){
      this.client.emit(this.action)
      this.action.actions.length=0
      this.action.interact=false
      this.action.reload=false
      this.action.swamp_guns=false
    }
    for(const p of this.planes.values()){
      p.update(dt)
    }
    this.renderer.fullCanvas()
    this.camera.zoom=(this.scope_zoom*Numeric.clamp(1-(0.5*this.flying_position),0.5,1))*(this.renderer.canvas.width/1920)
    if(!this.music.running){
      if(Math.random()<=0.0002){
        this.music.set(random.choose([
          this.resources.get_audio("game_normal_music_1"),
          this.resources.get_audio("game_normal_music_2"),
          this.resources.get_audio("game_normal_music_3"),
          this.resources.get_audio("game_normal_music_4")
        ]))
      }
    }

    /*
    Ambient
    */
   if(Math.random()<=0.003){
    this.bolt()
   }
   //FPS Show
   this.frame_calc++
  }
  update_camera(){
    if(this.activePlayer){
      this.camera.position=this.activePlayer!.position
      this.minimap.position=v2.duplicate(this.camera.position)
      this.minimap.update_grid(this.grid_gfx,gridSize,this.camera.position,v2.new(this.camera.width,this.camera.height),0.08)
      if(this.fake_crosshair.visible){
        this.fake_crosshair.position=v2.add(this.activePlayer.position,v2.scale(v2.from_RadAngle(this.activePlayer.rotation),2/this.camera.zoom))
        this.fake_crosshair.scale=v2.new(1/this.camera.zoom,1/this.camera.zoom)
      }
    }
  }
  planes:Map<number,Plane>=new Map()
  proccess_private(priv:PrivateUpdate){
    for(const p of priv.planes){
      if(!this.planes.has(p.id)){
        this.planes.set(p.id,new Plane(this))
      }
      const plane=this.planes.get(p.id)!
      plane.updateData(p)
    }
    if(priv.deadzone!==undefined)this.dead_zone.update_from_data(priv.deadzone)
  }
  bolt_tween?:Tween<Lights2D>
  bolt(){
    if(this.bolt_tween){
      //
    }else{
      this.sounds.play(this.resources.get_audio(`thunder_${random.int(1,3)}`),{

      },"ambience")
      this.bolt_tween=this.addTween({
        target: this.light_map,
        to: { ambient: 0 },
        duration: 0.1,
        yoyo: true,
        onComplete: () => {
          this.bolt_tween = undefined;
        },
      }) as unknown as Tween<Lights2D>
    }
  }
  connect(client:Client,playerName:string){
    this.client=client
    this.light_map.quality=this.save.get_variable("cv_graphics_lights")
    this.client.on("update",(up:UpdatePacket)=>{
      this.guiManager.update_gui(up.priv)
      this.proccess_private(up.priv)
      this.scene.objects.proccess_list(up.objects!,true)
    })
    this.client.on("killfeed",(kfp:KillFeedPacket)=>{
      this.guiManager.add_killfeed_message(kfp.message)
    })
    this.client.on("joined",(jp:JoinedPacket)=>{
      this.guiManager.start()
      this.ambience.set(this.resources.get_audio("storm_ambience"),true)
      this.guiManager.process_joined_packet(jp)
      this.happening=true
      this.mainloop()
    })
    this.client.on("map",(mp:MapPacket)=>{
      this.terrain.process_map(mp.map)
      this.terrain.draw(this.terrain_gfx,1)
      this.terrain.draw(this.minimap.terrain_gfx,1)
      this.minimap.init(mp.map)
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
    p.is_mobile=isMobile
    p.skin=Skins.getFromString(this.save.get_variable("cv_loadout_skin"))?.idNumber??0
    this.client.emit(p)
    this.activePlayerId=this.client.ID
    console.log("Joined As:",this.activePlayerId)

    this.fake_crosshair.frame=this.resources.get_sprite("crosshair_1")
    this.fake_crosshair.visible=false

    this.guiManager.players_name={}
    const zoom=this.scope_zoom*(this.renderer.canvas.width/300)
    if(this.scope_zoom!==this.camera.zoom){
      this.camera.zoom=zoom
    }
    this.renderer.fullCanvas()
  }
  init_gui(gui:GuiManager){
    this.guiManager=gui
    this.guiManager.init(this)
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}