import { PacketsManager,ConnectPacket, DisconnectPacket,Packet } from "../packets.ts";
import { ID } from "../utils.ts";
import { SignalManager } from "../utils.ts"
import { NetStream } from "../stream.ts"
import { BaseGameObject2D, DefaultEvents, DefaultEventsMap2D, Game2D } from "../game.ts";
export class BasicSocket{
    readyState = 1;
    binaryType = "";
    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSING = 2;
    readonly CLOSED = 3;

    send:((this:BasicSocket,_data: ArrayBuffer|Uint8Array) => void)|null=null;
    // deno-lint-ignore no-explicit-any
    onmessage:((this:BasicSocket,_ev: MessageEvent<any>) => void)|null=null;
    close:((this:BasicSocket,_code?: number, _reason?: string) => void)|null=(code?: number, reason?: string)=>{
        if(this.onclose)this.onclose(code,reason)
        this.readyState=3
    };
    onclose:((this:BasicSocket,_code?: number, _reason?: string) => void)|null=null;
    onerror:((this:BasicSocket,_error: Error) => void)|null=null;
    onopen:((this:BasicSocket) => void)|null=null;
}
export class OfflineSocket extends BasicSocket{
    output?:OfflineSocket
    constructor(output?:OfflineSocket,lag=10){
        super()
        this.output=output
        this.send=(s)=>{
            if(this.output)
            setTimeout(this.output?.message.bind(this.output,{
              data: s,
              lastEventId: "",
              origin: "",
              ports: [],
              source: null,
              // deno-lint-ignore no-explicit-any
              initMessageEvent: function (_type: string, _bubbles?: boolean | undefined, _cancelable?: boolean | undefined, _data?: any, _origin?: string | undefined, _lastEventId?: string | undefined, _source?: MessageEventSource | null | undefined, _ports?: MessagePort[] | undefined): void {
                throw new Error("Function not implemented.");
              },
              bubbles: false,
              cancelBubble: false,
              cancelable: false,
              composed: false,
              currentTarget: null,
              defaultPrevented: false,
              eventPhase: 0,
              isTrusted: false,
              returnValue: false,
              srcElement: null,
              target: null,
              timeStamp: 0,
              type: "",
              composedPath: function (): EventTarget[] {
                throw new Error("Function not implemented.");
              },
              initEvent: function (_type: string, _bubbles?: boolean | undefined, _cancelable?: boolean | undefined): void {
                throw new Error("Function not implemented.");
              },
              preventDefault: function (): void {
                throw new Error("Function not implemented.");
              },
              stopImmediatePropagation: function (): void {
                throw new Error("Function not implemented.");
              },
              stopPropagation: function (): void {
                throw new Error("Function not implemented.");
              },
              NONE: 0,
              CAPTURING_PHASE: 1,
              AT_TARGET: 2,
              BUBBLING_PHASE: 3
            }),lag)
        }
    }
    open(){
        if(this.onopen)this.onopen()
    }
    // deno-lint-ignore no-explicit-any
    message(ev: MessageEvent<any>){
        if(this.onmessage)this.onmessage(ev)
    }
}
export const DefaultSignals={
    CONNECT:"connect",
    DISCONNECT:"disconnect",
    OBJECTS:"objects"
}
export class Client{
    ws:BasicSocket
    protected manager:PacketsManager
    opened:boolean // Client Is Connected
    ID:ID=0 // Client ID Sysed With Server And Client
    IP:string // Clinet IP
    protected signals:SignalManager
    onopen?:()=>void
    constructor(websocket:BasicSocket,packet_manager:PacketsManager,ip:string=""){
        this.ws=websocket
        this.opened=false
        this.signals=new SignalManager
        this.manager=packet_manager
        this.ws.onopen=()=>{
            
        }
        this.ws.onclose=()=>{
            this.opened=false
            this.signals.emit(DefaultSignals.DISCONNECT,new DisconnectPacket(this.ID))
        }
        this.ws.onmessage=async(msg:MessageEvent<ArrayBuffer|Blob>)=>{
            try{
                if (msg.data instanceof ArrayBuffer){
                    const packet=this.manager.decode(new NetStream(msg.data))
                    this.signals.emit(packet.Name,packet)
                }else if(msg.data instanceof Blob){
                    const packet=this.manager.decode(new NetStream(await msg.data.arrayBuffer()))
                    this.signals.emit(packet.Name,packet)
                }
            }catch(error){
                console.error("decode Message Error:",error)
            }
        }
        this.IP=ip
        if(ip==""){
            this.on(DefaultSignals.CONNECT,(packet:ConnectPacket)=>{
                this.opened=true
                this.ID=packet.client_id
                if(this.onopen)this.onopen()
            })
        }
    }
    /**
     * Send A `Packet` To `Server/Client`
     * @param packet To Send
     */
    emit(packet:Packet):void{
        if (this.ws.readyState !== WebSocket.OPEN) return;
        if(this.ws.send)this.ws.send(this.manager.encode(packet,new NetStream(new ArrayBuffer(1024*10))).buffer as ArrayBuffer)
    }
    /**
     * On Recev A `Packet` From `Server/Client`
     * @param name Name Of `Packet`, you can change the Packet Name In Property `MyPacket.Name`(readonly)
     * @param callback Callback `(packet:MyPacket)=>void`
     */
    // deno-lint-ignore ban-types
    on(name:string,callback:Function){
        this.signals.on(name,callback)
    }
    sendStream(stream:NetStream){
        if (this.ws.readyState !== WebSocket.OPEN) return;
        if(this.ws.send)this.ws.send(stream.buffer as ArrayBuffer)
    }
    /**
     * Disconnect Websocket
     */
    disconnect():void{
        if(this.ws.close)this.ws.close()
    }
}
export class OfflineClientsManager{
    clients:Map<ID,Client>
    packets_manager:PacketsManager
    onconnection?:(client:Client,username:string)=>void
    constructor(packets:PacketsManager,onconnection?:(client:Client)=>void){
        this.clients=new Map()
        this.packets_manager=packets
        this.onconnection=onconnection
    }
    activate_ws(ws:BasicSocket,id:number,ip:string,username:string):ID{
        const client=new Client(ws,this.packets_manager,ip)
        client.ID=id
        client.on(DefaultSignals.DISCONNECT,(packet:DisconnectPacket)=>{
            this.clients.delete(packet.client_id)
        })
        this.clients.set(client.ID,client)
        client.opened=true
        if(this.onconnection)this.onconnection(client,username)
        client.emit(new ConnectPacket(client.ID))
        return client.ID
    }
    emit(packet: Packet) {
        for (const client of this.clients.values()) {
            try {
                client.emit(packet);
            } catch (error) {
                console.error("Error emitting packet to client:", error);
            }
        }
    }
    sendStream(stream:NetStream){
        for (const client of this.clients.values()) {
            client.sendStream(stream)
        }
    }
}

export abstract class ServerGame2D<DefaultGameObject extends BaseGameObject2D=BaseGameObject2D,Events extends DefaultEvents=DefaultEvents,EMap extends DefaultEventsMap2D=DefaultEventsMap2D> extends Game2D<DefaultGameObject,Events,EMap>{
    public clients:OfflineClientsManager
    public allowJoin:boolean
    public id:ID=1
    fps:number=0
    override destroy_queue: boolean=false;
    constructor(tps:number,id:ID,client:OfflineClientsManager,packetManager:PacketsManager,objects:Array<new()=>DefaultGameObject>){
        super(tps,objects)
        this.id=id
        this.allowJoin=true
        this.clients=client
        this.clients.packets_manager=packetManager
        this.clients.onconnection=this.handleConnections.bind(this)
        setTimeout(this.fpsShow.bind(this),1000)
    }
    fpsShow(){
        if(!this.running)return
        console.log(`TPS:${this.fps}/${this.tps}`)
        this.fps=0
        setTimeout(this.fpsShow.bind(this),1000)
    }
    override on_stop(): void {
      super.on_stop()
      for(const c of this.clients.clients.values()){
        c.disconnect()
      }
    }
    abstract handleConnections(client:Client,username:string):void
    update_delay:number=3
    override on_update(): void {
        this.scene.objects.apply_destroy_queue()
        this.fps++
    }
}
