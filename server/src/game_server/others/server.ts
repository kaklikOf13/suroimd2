import { Server,Cors, ClientsManager} from "../../engine/mod.ts"
import { Game } from "./game.ts"
import { Game2D, ID, PacketsManager, random } from "common/scripts/engine/mod.ts";
import { v1 as uuid } from "https://deno.land/std@0.224.0/uuid/mod.ts"
import { Layers } from "common/scripts/others/constants.ts";
import { ConfigType, GameConfig } from "common/scripts/config/config.ts";
import { ServerReplayRecorder2D } from "../../engine/replay.ts";
import { ObjectsE } from "common/scripts/others/objectsEncode.ts";
export class GameServer{
    server:Server
    games:Game[]
    game_handles:Record<ID,string>
    config:ConfigType
    constructor(server:Server,config:ConfigType){
        this.server=server
        this.server.route("/api/get-game",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            const game=this.get_game()
            return Cors(new Response(`game/${game}`,{status:200}))
        })
        this.server.route("/api/game-status",(_req:Request,url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response(Deno.readFileSync(`database/games/game-${url[url.length-1]}`),{status:200}))
        })
        this.games=[]
        this.game_handles={}
        this.config=config
        this.addGame()
        Deno.mkdirSync("database/games",{recursive:true})
        Deno.mkdirSync("database/replays",{recursive:true})
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
        if(this.games.length<this.config.game.max_games){
            const g=this.addGame()
            return g.id
        }
        return -1
    }
    addGame():Game{
        const id=this.games.length
        this.games.push(new Game(new ClientsManager(new PacketsManager()),id,this.config))
        this.games[id].replay=new ServerReplayRecorder2D(this.games[id] as unknown as Game2D,ObjectsE)
        this.games[id].string_id=uuid.generate() as string
        this.games[id].mainloop()
        const handler=(this.games[id].clients as ClientsManager).handler_log(()=>{
            let idC=random.id()
            while(this.games[id].scene.objects.exist(
                idC,
                Layers.Normal
            )){
                idC=random.id()
            }
            return idC
        })
        this.server.route(`api/game/${id}/ws`,handler)
        this.game_handles[id]=`api/game/${id}`
        this.games[id].on_stop=()=>{
            Game.prototype.on_stop.call(this.games[id])
            if(this.config.database.enabled){
                const f=Deno.openSync(`database/games/game-${this.games[id].string_id}`,{write:true,create:true})
                const encoder = new TextEncoder();
                f.writeSync(encoder.encode(JSON.stringify(this.games[id].status)))
                f.close()
            }
            (this.games[id].replay! as ServerReplayRecorder2D).save_replay(`database/replays/game-${this.games[id].string_id}.repl`)
            const ln:string[]=[]
            for(const p of this.games[id].players){
                if(ln.includes(p.username))continue
                if(p.earned.coins>0||p.earned.xp>0||p.earned.score>0){
                    ln.push(p.username)
                }
                fetch(`${this.config.api.global}/internal/update-user`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": this.config.database.api_key
                    },
                    body: JSON.stringify({
                        name: p.username,
                        coins: p.earned.coins,
                        xp: p.earned.coins,
                        score: p.earned.score,
                    })
                });
            }
        }
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
