import {Client, ClientGame2D, type MousePosListener, type KeyListener, Renderer, DefaultSignals, ResourcesManager, Key, ClientGameObject2D, RGBA} from "../engine/mod.ts"
import { ActionPacket, CATEGORYS, CATEGORYSL, PacketManager } from "common/scripts/others/constants.ts";
import { ObjectsPacket, v2 } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
import { Loot } from "../gameObjects/loot.ts";
import { Bullet } from "../gameObjects/bullet.ts";
export class Game extends ClientGame2D{
  client:Client
  activePlayer=0

  action:ActionPacket=new ActionPacket()
  constructor(ip:string,keyl:KeyListener,mp:MousePosListener,renderer:Renderer,resources:ResourcesManager,objects:Array<new ()=>ClientGameObject2D>=[]){
      super(keyl,mp,resources,renderer,[...objects,Player,Loot,Bullet])
      for(const i of CATEGORYSL){
        this.scene.objects.add_category(i)
      }
      this.client=new Client(new WebSocket(ip),PacketManager)
      this.client.on(DefaultSignals.OBJECTS,(obj:ObjectsPacket)=>{
        this.scene.objects.proccess(obj)
      })
      this.clock_e=false
      this.scene.objects.encoders=ObjectsE
      this.renderer.background=RGBA.new(5,120,30)
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
      this.client.emit(this.action)
      const activePlayer=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
      if(activePlayer){
        this.action.angle=v2.lookTo(activePlayer.position,v2.add(this.mouse.position,this.camera.position))
      }
    }
    this.renderer.fullCanvas()
  }
  update_camera(){
    const p=this.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.activePlayer})
    this.camera.position=v2.sub(p.position,v2.new((this.renderer.canvas.width/this.renderer.meter_size)/2,(this.renderer.canvas.height/this.renderer.meter_size)/2))
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