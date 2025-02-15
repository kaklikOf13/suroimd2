import { ID,BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D,ObjectsPacket, PacketsManager } from "common/scripts/engine/mod.ts";
import { Client, ClientsManager } from "./websockets.ts";

export abstract class ServerGame2D<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D,Events extends DefaultEvents=DefaultEvents,EMap extends DefaultEventsMap2D=DefaultEventsMap2D> extends Game2D<DefaultGameObject,Events,EMap>{
    public clients:ClientsManager
    public allowJoin:boolean
    public id:ID=1
    constructor(tps:number,id:ID,packetManager:PacketsManager,objects:Record<string,new()=>DefaultGameObject>){
        super(tps,objects)
        this.id=id
        this.allowJoin=true
        this.clients=new ClientsManager(this._handle.bind(this))
        this.clients.packets_manager=packetManager
    }
    private _handle(client:Client) {
        this.handleConnections(client)
    }
    abstract handleConnections(client:Client):void
    update(): void {
        Game2D.prototype.update.call(this)
        this.clients.emit(new ObjectsPacket(this.scene.objects.stream))
    }
}