import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Server,Cors, ClientsManager} from "../../engine/mod.ts"
import { Game, GameConfig } from "./game.ts"
import { ID, PacketsManager, random } from "common/scripts/engine/mod.ts";
import { Config } from "../../../configs/config.ts";
export class GameServer{
    server:Server
    games:Game[]
    game_handles:Record<ID,string>
    constructor(server:Server){
        this.server=server
        this.server.route("/api/get-game",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            const game=this.get_game()
            return Cors(new Response(`game/${game}`,{status:200}))
        })
        this.games=[]
        this.game_handles={}
        this.addGame(Config.game.config)
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
        if(this.games.length<Config.game.max_games){
            const g=this.addGame(config)
            return g.id
        }
        return -1
    }
    addGame(config?:GameConfig):Game{
        const id=this.games.length
        this.games.push(new Game(new ClientsManager(new PacketsManager()),id,config ?? Config.game.config))
        this.games[id].mainloop()
        const handler=(this.games[id].clients as ClientsManager).handler(()=>{
            let idC=random.id()
            while(this.games[id].scene.objects.exist({
                id:idC,
                category:CATEGORYS.PLAYERS
            })){
                idC=random.id()
            }
            return idC
        })
        this.server.route(`api/game/${id}/ws`,handler)
        this.game_handles[id]=`api/game/${id}`
        console.log(`Game ${id} Initialized`)
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
