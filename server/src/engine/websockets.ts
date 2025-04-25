
import { random } from "common/scripts/engine/mod.ts"
import { OfflineClientsManager } from "common/scripts/engine/server_offline/offline_server.ts";
export class ClientsManager extends OfflineClientsManager{
    
    handler(IDGen?:()=>number):(req:Request,url:string[],info:Deno.ServeHandlerInfo)=>Response|null{
        if(!IDGen){
            IDGen=()=>{
                let id:number=random.id()
                while(this.clients.get(id)){
                    id=random.id()
                }
                return id
            }
        }
        return (req:Request,url:string[],info:Deno.ServeHandlerInfo)=>{
            if(url.length>1&&url[url.length-1]!="index.html"){
                return null
            }

            const upgrade = req.headers.get("upgrade") || ""
            if (upgrade.toLowerCase() != "websocket") {
                return new Response("request isn't trying to upgrade to websocket.",{status:406})
            }
            
            const { socket, response } = Deno.upgradeWebSocket(req)
            // deno-lint-ignore ban-ts-comment
            //@ts-ignore
            socket.onopen = () => {this.activate_ws(socket,IDGen(),info.remoteAddr.hostname)}
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