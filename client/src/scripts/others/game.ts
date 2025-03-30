import {Client, ClientGame2D, type MousePosListener, type KeyListener, Renderer, DefaultSignals, ResourcesManager, Key, ClientGameObject2D, Material2D, GridMaterialArgs, WebglRenderer, KeyEvents} from "../engine/mod.ts"
import { ActionPacket, CATEGORYS, CATEGORYSL, PacketManager, zIndexes } from "common/scripts/others/constants.ts";
import { NullVec2, ObjectsPacket, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { GuiManager } from "./guiManager.ts";
import { Explosion } from "../gameObjects/explosion.ts";
import { Debug } from "./config.ts";
import { SoundManager } from "../engine/sounds.ts";
import { ColorM } from "../engine/renderer.ts";
import { Projectile } from "../gameObjects/projectile.ts";
import { DamageSplash } from "../gameObjects/damageSplash.ts";

function gameLoadMaterials(game:Game){
  game.resources.load_material2D("gun_gas_particles",(game.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.rgba(0,0,0,0.4)))
}

export class Game extends ClientGame2D{
  client:Client
  activePlayer=0

  action:ActionPacket=new ActionPacket()
  grid:Material2D<GridMaterialArgs>
  guiManager!:GuiManager

  can_act:boolean=true

  gameOver:boolean=false

  constructor(ip:string,keyl:KeyListener,mp:MousePosListener,renderer:Renderer,sounds:SoundManager,resources:ResourcesManager,objects:Array<new ()=>ClientGameObject2D>=[]){
    super(keyl,mp,resources,sounds,renderer,[...objects,Player,Loot,Bullet,Obstacle,Explosion,Projectile,DamageSplash])
    for(const i of CATEGORYSL){
      this.scene.objects.add_category(i)
    }
    this.scene.objects.add_category(7)
    this.client=new Client(new WebSocket(ip),PacketManager)
    this.client.on(DefaultSignals.OBJECTS,(obj:ObjectsPacket)=>{
      this.scene.objects.proccess(obj)
    })
    this.scene.objects.encoders=ObjectsE
    this.renderer.background=ColorM.hex("#68ad49")

    this.client.on(DefaultSignals.DISCONNECT,()=>{
      this.running=false
    })

    this.grid=(this.renderer as WebglRenderer).factorys2D.grid.create_material({
      color:ColorM.rgba(0,0,0,90),
      gridSize:this.scene.objects.cells.cellSize,
      width:0.034
    })

    if(Debug.hitbox){
      this.resources.load_material2D("hitbox_bullet",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
      this.resources.load_material2D("hitbox_obstacle",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
      this.resources.load_material2D("hitbox_projectile",(this.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.black))
    }

    gameLoadMaterials(this)

    this.request_animation_frame=true
  }
  add_damageSplash(position:Vec2,count:number,critical:boolean,shield:boolean){
    this.scene.objects.add_object(new DamageSplash(),7,undefined,{position,count,critical,shield})
  }
  on_stop(): void {
    super.on_stop()
    if(!this.gameOver){
      this.scene.objects.clear()
      if(this.onstop)this.onstop(this)
    }
  }
  onstop?:(g:Game)=>void
  actionDelay:number=3
  on_render(_dt:number):void{
    (this.renderer as WebglRenderer)._draw_vertices([
      -1000, -1000, 
      1000, -1000,
      -1000,  1000,
      -1000,  1000,
      1000, -1000,
      1000,  1000
    ],this.grid,{position:this.camera.position,scale:NullVec2,rotation:0,zIndex:zIndexes.Grid})
  }
  old_hand=0
  on_run(): void {
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
  on_update(dt:number): void {
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
      if(this.actionDelay<=0){
        this.client.emit(this.action)
        this.action.interact=false
        this.action.cellphoneAction=undefined
        this.actionDelay=1
        this.old_hand=this.action.hand
      }else{
        this.actionDelay--
      }

      const activePlayer=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
      if(activePlayer){
        this.action.angle=v2.lookTo(activePlayer.position,this.mouse.camera_pos(this.camera))
      }
    }
    this.camera.zoom=1.3
    //3.40=64x
    //2.80=32x
    //2.30=16x
    //1.70=8x
    //1.30=4x
    //1.00=2x
    //0.85=1x
    this.renderer.fullCanvas(this.camera)
  }
  update_camera(){
    const p=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
    const cc=(this.renderer as WebglRenderer).cam2Dsize
    this.camera.position=v2.sub(p.position,v2.new(cc.x/2,cc.y/2))
  }
  connect(playerName:string){
    this.client.on("connect",()=>{
      this.client.emit(new JoinPacket(playerName))
      this.activePlayer=this.client.ID
    })
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}