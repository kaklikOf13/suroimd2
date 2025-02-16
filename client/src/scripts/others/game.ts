import {Client, ClientGame2D, type MousePosListener, type KeyListener, Renderer, DefaultSignals, ResourcesManager, Key, ClientGameObject2D} from "../engine/mod.ts"
import { ActionPacket, CATEGORYSL, PacketManager } from "common/scripts/others/constants.ts";
import { ObjectsPacket } from "common/scripts/engine/mod.ts";
import { JoinPacket } from "common/scripts/packets/join_packet.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
import { Player } from "../gameObjects/player.ts";
export class Game extends ClientGame2D{
  client:Client
  constructor(ip:string,keyl:KeyListener,mp:MousePosListener,renderer:Renderer,resources:ResourcesManager,objects:Array<new ()=>ClientGameObject2D>=[]){
      super(keyl,mp,resources,renderer,[...objects,Player])
      for(const i of CATEGORYSL){
        this.scene.objects.add_category(i)
      }
      this.client=new Client(new WebSocket(ip),PacketManager)
      this.client.on(DefaultSignals.OBJECTS,(obj:ObjectsPacket)=>{
        this.scene.objects.proccess(obj)
      })
      this.clock_e=false
      this.scene.objects.encoders=ObjectsE
  }
  on_update(): void {
    super.on_update()
    if(this.client.opened){
      const a=new ActionPacket()
      if(this.key.keyPress(Key.A)){
          a.Movement.x=-1
      }else if(this.key.keyPress(Key.D)){
          a.Movement.x=1
      }else{
          a.Movement.x=0
      }

      if(this.key.keyPress(Key.W)){
          a.Movement.y=-1
      }else if(this.key.keyPress(Key.S)){
          a.Movement.y=1
      }else{
          a.Movement.y=0
      }
      this.client.emit(a)
    }
  }
  connect(playerName:string){
    this.client.on("connect",()=>{
      this.client.emit(new JoinPacket(playerName))
      //setTimeout(this.client.disconnect.bind(this.client),1000)
    })
  }
}
export async function getGame(server:string){
    return `api/${await(await fetch(`${server}/api/get-game`)).text()}/ws`
}