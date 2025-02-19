import {Client, ClientGame2D, type MousePosListener, type KeyListener, Renderer, DefaultSignals, ResourcesManager, Key, ClientGameObject2D, RGBA, Material2D, GridMaterialArgs, WebglRenderer} from "../engine/mod.ts"
import { ActionPacket, CATEGORYS, CATEGORYSL, PacketManager, zIndexes } from "common/scripts/others/constants.ts";
import { NullVec2, ObjectsPacket, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
export class Game extends ClientGame2D{
  client:Client
  activePlayer=0

  action:ActionPacket=new ActionPacket()
  grid:Material2D<GridMaterialArgs>
  constructor(ip:string,keyl:KeyListener,mp:MousePosListener,renderer:Renderer,resources:ResourcesManager,objects:Array<new ()=>ClientGameObject2D>=[]){
    super(keyl,mp,resources,renderer,[...objects,Player,Loot,Bullet,Obstacle])
    for(const i of CATEGORYSL){
      this.scene.objects.add_category(i)
    }
    this.client=new Client(new WebSocket(ip),PacketManager)
    this.client.on(DefaultSignals.OBJECTS,(obj:ObjectsPacket)=>{
      this.scene.objects.proccess(obj)
    })
    this.scene.objects.encoders=ObjectsE
    this.renderer.background=RGBA.new(50,160,30)

    this.client.on(DefaultSignals.DISCONNECT,()=>{
      this.scene.objects.clear()
    })

    this.grid=(this.renderer as WebglRenderer).factorys2D.grid.create_material({
      color:RGBA.new(0,0,0,90),
      gridSize:this.scene.objects.cells.cellSize,
      width:0.03
    })
  }
  actionDelay:number=3
  on_render():void{
    (this.renderer as WebglRenderer)._draw_vertices([
      -1000, -1000, 
      1000, -1000,
      -1000,  1000,
      -1000,  1000,
      1000, -1000,
      1000,  1000
    ],this.grid,{position:this.camera.position,scale:NullVec2,rotation:0,zIndex:zIndexes.Grid})
  }
  on_update(): void {
    super.on_update()
    if(this.client.opened){
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
      if(this.actionDelay<=0){
        this.client.emit(this.action)
        this.actionDelay=3
      }else{
        this.actionDelay--
      }

      if(this.key.keyPress(Key.Number_1)){
        this.action.hand=0
      }else if(this.key.keyPress(Key.Number_2)){
        this.action.hand=1
      }

      const activePlayer=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
      if(activePlayer){
        this.action.angle=v2.lookTo(activePlayer.position,this.mouse.camera_pos(this.camera))
      }

      this.action.Reloading=this.key.keyPress(Key.R)
    }
    this.camera.zoom=0.7
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