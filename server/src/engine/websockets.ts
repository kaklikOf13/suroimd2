
import { ConnectPacket, DisconnectPacket, PacketsManager,Packet, ID, random, NetStream } from "common/scripts/engine/mod.ts"
import { Client } from "../../../client/src/scripts/engine/client.ts"
import { DefaultSignals } from "./mod.ts";
export * from "../../../client/src/scripts/engine/client.ts"
export class ClientsManager{
    clients:Map<ID,Client>
    packets_manager:PacketsManager
    onconnection:(client:Client)=>void

    constructor(onconnection:(client:Client)=>void){
        this.clients=new Map()
        this.packets_manager=new PacketsManager()
        this.onconnection=onconnection
    }


    private activate_ws(ws:WebSocket,ip:string):ID{
        const client=new Client(ws,this.packets_manager,ip)
        while (this.clients.has(client.ID)){
            client.ID=random.id()
        }
        client.on(DefaultSignals.DISCONNECT,(packet:DisconnectPacket)=>{
            this.clients.delete(packet.client_id)
        })
        client.emit(new ConnectPacket(client.ID))
        this.clients.set(client.ID,client)
        this.onconnection(client)
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
    
    handler():(req:Request,url:string[],info:Deno.ServeHandlerInfo)=>Response|null{
        return (req:Request,url:string[],info:Deno.ServeHandlerInfo)=>{
            if(url.length>1&&url[url.length-1]!="index.html"){
                return null
            }

            const upgrade = req.headers.get("upgrade") || ""
            if (upgrade.toLowerCase() != "websocket") {
                return new Response("request isn't trying to upgrade to websocket.",{status:406})
            }
            
            const { socket, response } = Deno.upgradeWebSocket(req)
            socket.onopen = () => {this.activate_ws(socket,info.remoteAddr.hostname)}
            return response
        }
    }
}
//Definitions
export interface HostConfig{
    port:number,
    name?:string,
    https?:boolean,
    cert?:string,
    key?:string,
}