import { Server } from "../engine/mod.ts";
export interface RegionConfig{
    host:string
    safe?:boolean
}
export interface ApiConfig{
  regions:Record<string,RegionConfig>
}
export interface GetRegionArgs{
    region:string
}
export class ApiServer{
    server:Server
    config:ApiConfig
    constructor(server:Server,config:ApiConfig){
        this.server=server
        this.config=config
        this.server.route("/get-region",async(req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            const params:GetRegionArgs=await req.json()
            const response=this.config.regions[params.region]
            return new Response(JSON.stringify(response),{status:200})
        })
    }
    run(){
        this.server.run()
    }
}