import { ID, SignalManager, NetStream,ConnectPacket, DisconnectPacket,Packet, PacketsManager } from "common/scripts/engine/mod.ts"
export const DefaultSignals={
    CONNECT:"connect",
    DISCONNECT:"disconnect",
    OBJECTS:"objects"
}
export class Client{
    ws:WebSocket
    protected manager:PacketsManager
    opened:boolean // Client Is Connected
    ID:ID=0 // Client ID Sysed With Server And Client
    IP:string // Clinet IP
    protected signals:SignalManager
    constructor(websocket:WebSocket,packet_manager:PacketsManager,ip:string=""){
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
        this.ws.onmessage=async(msg)=>{
            if (msg.data instanceof ArrayBuffer){
                const packet=this.manager.decode(new NetStream(msg.data))
                this.signals.emit(packet.Name,packet)
            }else if(msg.data instanceof Blob){
                const packet=this.manager.decode(new NetStream(await msg.data.arrayBuffer()))
                this.signals.emit(packet.Name,packet)
            }
        }
        this.IP=ip
        if(ip==""){
            this.on(DefaultSignals.CONNECT,(packet:ConnectPacket)=>{
                this.opened=true
                this.ID=packet.client_id
            })
        }
    }
    /**
     * Send A `Packet` To `Server/Client`
     * @param packet To Send
     */
    emit(packet:Packet):void{
        if (this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(this.manager.encode(packet,new NetStream(new ArrayBuffer(1024*10))).buffer)
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
        this.ws.send(stream.buffer)
    }
    /**
     * Disconnect Websocket
     */
    disconnect():void{
        this.ws.close()
    }
}