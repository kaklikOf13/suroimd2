import { Config } from "../../configs/config.ts";
import { Server } from "../engine/mod.ts";
import { Cors } from "../engine/server.ts";
export class ApiServer{
    server:Server
    constructor(server:Server){
        this.server=server
        this.server.route("/get-regions",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response(JSON.stringify(Config.regions),{status:200}))
        })
    }
    run(){
        this.server.run()
    }
}