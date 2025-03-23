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
    games:Game[]
    game_handles:Record<ID,string>
    constructor(server:Server,config:GameServerConfig){
        this.server=server
        this.config=config
        this.server.route("/api/get-game",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            const game=this.get_game()
            return Cors(new Response(`game/${game}`,{status:200}))
        })
        this.games=[]
        this.game_handles={}
        this.addGame(this.config.game)
    }
    get_game(config?:GameConfig):ID{
        for(const g of this.games){
            if(g.running&&g.modeManager.can_join()){
                return g.id
            }
        }
        for(let g=0;g<this.games.length;g++){
            if(!this.games[g].running){
                this.removeGame(g)
                g--
            }
        }
        if(this.games.length<this.config.max_games){
            const g=this.addGame(config)
            return g.id
        }
        return -1
    }
    addGame(config?:GameConfig):Game{
        const id=this.games.length
        this.games.push(new Game(id,config ?? this.config.game))
        this.games[id].mainloop()
        console.log(`Game ${id} Initialized`)
        const handler=this.games[id].clients.handler()
        this.server.route(`api/game/${id}/ws`,handler)
        this.game_handles[id]=`api/game/${id}`
        return this.games[id]
    }
    removeGame(id:ID){
        this.game_handles[id] ? this.server.remove_route(`api/game/${id}/ws`) : null
        delete this.game_handles[id]
        this.games.splice(id,1)
    }
    run(){
        this.server.run()
    }
}
