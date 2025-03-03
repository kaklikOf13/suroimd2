import { ID,BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D, PacketsManager } from "common/scripts/engine/mod.ts";
import { Client, ClientsManager } from "./websockets.ts";

export abstract class ServerGame2D<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D,Events extends DefaultEvents=DefaultEvents,EMap extends DefaultEventsMap2D=DefaultEventsMap2D> extends Game2D<DefaultGameObject,Events,EMap>{
    public clients:ClientsManager
    public allowJoin:boolean
    public id:ID=1
    fps:number=0
    destroy_queue: boolean=false;
    constructor(tps:number,id:ID,packetManager:PacketsManager,objects:Array<new()=>DefaultGameObject>){
        super(tps,objects)
        this.id=id
        this.allowJoin=true
        this.clients=new ClientsManager(this._handle.bind(this))
        this.clients.packets_manager=packetManager
        setTimeout(this.fpsShow.bind(this),1000)
    }
    fpsShow(){
        if(!this.running)return
        console.log(`TPS:${this.fps}/${this.tps}`)
        this.fps=0
        setTimeout(this.fpsShow.bind(this),1000)
    }
    private _handle(client:Client) {
        this.handleConnections(client)
    }
    abstract handleConnections(client:Client):void
    update_delay:number=3
    on_update(): void {
        this.clients.emit(this.scene.objects.encode())
        this.scene.objects.apply_destroy_queue()
        this.fps++
    }
}