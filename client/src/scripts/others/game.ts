import { ClientGame2D, type MousePosListener, type KeyListener, ResourcesManager, Key, KeyEvents, Renderer, ColorM, GridMaterialArgs, Material2D, WebglRenderer} from "../engine/mod.ts"
import { ActionPacket, CATEGORYS, CATEGORYSL, PacketManager, zIndexes } from "common/scripts/others/constants.ts";
import { BasicSocket, Client, DefaultSignals, NullVec2, ObjectsPacket, Vec2, v2 } from "common/scripts/engine/mod.ts";
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
export class Game extends ClientGame2D<GameObject>{
  client:Client
  activePlayer=0

  action:ActionPacket=new ActionPacket()
  guiManager!:GuiManager

  can_act:boolean=true

  gameOver:boolean=false

  grid:Material2D<GridMaterialArgs>

  constructor(keyl:KeyListener,mp:MousePosListener,sounds:SoundManager,resources:ResourcesManager,socket:BasicSocket,renderer:Renderer,objects:Array<new ()=>GameObject>=[]){
    super(keyl,mp,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplash])
    for(const i of CATEGORYSL){
      this.scene.objects.add_category(i)
    }
    this.scene.objects.add_category(7)
    this.client=new Client(socket,PacketManager)
    this.client.on(DefaultSignals.OBJECTS,(obj:ObjectsPacket)=>{
      this.scene.objects.proccess(obj)
    })
    this.scene.objects.encoders=ObjectsE;

    this.renderer.background=ColorM.hex("#68ad49");

    this.grid=(this.renderer as WebglRenderer).factorys2D.grid.create_material({
      color:ColorM.rgba(0,0,0,90),
      gridSize:this.scene.objects.cells.cellSize,
      width:0.034
    })

    if(Debug.hitbox){
      this.resources.load_material2D("hitbox_player",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
      this.resources.load_material2D("hitbox_bullet",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
      this.resources.load_material2D("hitbox_obstacle",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
      this.resources.load_material2D("hitbox_projectile",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
    }

    this.client.on(DefaultSignals.DISCONNECT,()=>{
      this.running=false
    })
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
  old_hand=0
  override on_render(_dt:number):void{
    (this.renderer as WebglRenderer)._draw_vertices([
      -1000, -1000, 
      1000, -1000,
      -1000,  1000,
      -1000,  1000,
      1000, -1000,
      1000,  1000
    ],this.grid,{position:this.camera.position,scale:NullVec2,rotation:0,zIndex:zIndexes.Grid})
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
        case Key.Number_4:
          this.action.hand=3
          break
        case Key.Number_5:
          this.action.hand=4
          break
        case Key.Number_6:
          this.action.hand=5
          break
        case Key.Number_7:
          this.action.hand=6
          break
        case Key.Number_8:
          this.action.hand=7
          break
        case Key.Number_9:
          this.action.hand=8
          break
        case Key.Number_0:
          this.action.hand=9
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
        this.action.UsingItem=this.action.hand===this.old_hand&&this.key.keyPress(Key.Mouse_Left)
        this.action.Reloading=this.key.keyPress(Key.R)
      }
      this.client.emit(this.action)
      this.action.interact=false
      this.action.cellphoneAction=undefined
      this.old_hand=this.action.hand

      const activePlayer=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
      if(activePlayer){
        this.action.angle=v2.lookTo(activePlayer.position,this.mouse.camera_pos(this.camera))
      }
    }
    this.camera.zoom=1
    this.renderer.fullCanvas(this.camera)
    //0.09=l6 32x
    //0.15=l5 16x
    //0.28=l4 8x
    //0.44=l3 4x
    //0.58=l2 2x
    //0.70=l1 1x
  }
  update_camera(){
    const p=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
    const cc=(this.renderer as WebglRenderer).cam2Dsize
    this.camera.position=v2.sub(p.position,v2.new(cc.x/2,cc.y/2))
  }
  connect(playerName:string){
    if(!this.client.opened){
      console.log("not connected")
      return
    }
    this.client.emit(new JoinPacket(playerName))
    this.activePlayer=this.client.ID
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}