import { Server,Cors} from "../../engine/mod.ts"
import { Game, GameConfig } from "./game.ts"
import { ID } from "common/scripts/engine/mod.ts";
export interface GameServerConfig{
    game:GameConfig
    max_games:number
}

export class GameServer{
    server:Server
    config:GameServerConfig
    games:Record<ID,Game>
    game_handles:Record<ID,string>
    constructor(server:Server,config:GameServerConfig){
        this.server=server
        this.config=config
        this.server.route("/api/get-game",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response("game/0",{status:200}))
        })
        this.games={}
        this.game_handles={}
        this.addGame(0,this.config.game)
    }
    addGame(id:ID,config?:GameConfig):Game{
        this.games[id]=new Game(id,config ?? this.config.game)
        this.games[id].mainloop()
        console.log(`Game ${id} Started`)
        const handler=this.games[id].clients.handler()
        this.server.route(`api/game/${id}/ws`,handler)
        this.game_handles[id]=`api/game/${id}`
        return this.games[id]
    }
    removeGame(id:ID){
        this.game_handles[id] ? this.server.remove_route(this.game_handles[id]) : null
    }
    run(){
        this.server.run()
    }
}
