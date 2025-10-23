import { Server,Cors} from "../../engine/mod.ts"
import { ID, SignalManager } from "common/scripts/engine/mod.ts"
import { type ConfigType, type GameConfig, type RegionDef } from "common/scripts/config/config.ts";
import { type WorkerMessage, WorkerMessages } from "./gameWorker.ts";
import { type GameData } from "./game.ts";
let worker_path: string;
if (import.meta.filename?.endsWith(".ts")) {
    worker_path = "./gameWorker.ts";
} else {
    worker_path = "./gameWorker.js";
}

export class GameContainer {
    data: GameData = {
        can_join: false,
        living_count: 0,
        running: false,
        started_time: 0,
        started:false
    };

    readonly id: number;
    readonly worker: Worker;
    signals: SignalManager = new SignalManager();
    server:GameServer

    address:string=""

    constructor(server:GameServer,id: number) {
        this.id = id;
        this.server=server

        const url = new URL(worker_path, import.meta.url).href;

        this.worker = new Worker(url, {
            name: "game_worker",
            type: "module"
        })

        this.worker.addEventListener("message", (e) => {
            const msg=e.data as WorkerMessage
            switch(msg.type){
                case WorkerMessages.SetData:
                    this.data=msg.data
                    break
            }
        })
        
        this.worker.postMessage({
            type:WorkerMessages.Begin,
            config:this.server.config,
            id:this.id,
            port:this.server.config.game.host.port+this.id+1
        } as WorkerMessage)

        this.address=`${this.server.self_region.ssh?"s":""}://${this.server.self_region.host}:${this.server.self_region.port+this.id+1}`
    }

    create(team_size:number) {
        this.worker.postMessage({
            type:WorkerMessages.NewGame,
            team_size:team_size
        } as WorkerMessage)
    }
}

export class GameServer{
    server:Server
    games:Map<number,GameContainer>=new Map()
    game_handles:Record<ID,string>
    config:ConfigType
    td:TextDecoder=new TextDecoder("utf-8")
    te:TextEncoder=new TextEncoder()

    self_region:RegionDef
    constructor(server:Server,config:ConfigType){
        this.server=server
        this.self_region=config.regions[config.this_region]
        this.server.route("/api/get-game",(_req:Request,_url:string[], _info: Deno.ServeHandlerInfo)=>{
            const game=this.get_game()
            const msg=game===undefined
            ?{
                status:1,
            }:{
                status:0,
                address:game.address
            }
            return Cors(new Response(JSON.stringify(msg),{status:200}))
        })
        this.server.route("/api/game-status",(_req:Request,url:string[], _info: Deno.ServeHandlerInfo)=>{
            return Cors(new Response(Deno.readFileSync(`database/games/game-${url[url.length-1]}`),{status:200}))
        })
        this.game_handles={}
        this.config=config
        this.addGame()
        Deno.mkdirSync("database/games",{recursive:true})
        Deno.mkdirSync("database/replays",{recursive:true})
    }
    get_game(config?:GameConfig):GameContainer|undefined{
        for(const g of this.games.values()){
            if(g.data.running&&g.data.can_join){
                return g
            }
        }
        return this.addGame()
        
    }
    addGame(id?:number):GameContainer|undefined{
        if(!id)id=this.games.size
        if(!this.games.get(id)){
            if(this.games.size<this.config.game.max_games){
                this.games.set(id,new GameContainer(this,id))
            }else{
                return undefined
            }
        }
        this.games.get(id)?.create(1)
        /*this.games[id].replay=new ServerReplayRecorder2D(this.games[id] as unknown as Game2D,ObjectsE)
        this.games[id].string_id=uuid.generate() as string
        this.games[id].mainloop()*/
        /*const handler=(this.games[id].clients as ClientsManager).handler_log(()=>{
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
        /*this.games[id].on_stop=()=>{
            Game.prototype.on_stop.call(this.games[id])
            if(this.config.database.enabled){
                const f=Deno.openSync(`database/games/game-${this.games[id].string_id}`,{write:true,create:true})
                const encoder = new TextEncoder();
                f.writeSync(encoder.encode(JSON.stringify({status:this.games[id].status,statistic:this.games[id].statistics})))
                f.close()
            }
            if(this.config.database.statistic){
                const src=this.config.database.files.statistic??`database/statistic.json`
                const f=Deno.openSync(src,{write:true,create:true,read:true})
                f.seekSync(0,Deno.SeekMode.Current)
                const stat = Deno.statSync(src)
                const size = stat.size
                const b = new Uint8Array(size)
                f.seekSync(0, Deno.SeekMode.Start)
                f.readSync(b)
                let js=undefined
                
                try {
                    js=JSON.parse(this.td.decode(b))
                } catch (error) {
                    console.error(error)
                    js=undefined
                }
                f.seekSync(0, Deno.SeekMode.Start)
                if(js===undefined){
                    f.writeSync(this.te.encode(JSON.stringify(this.games[id].statistics)))
                }else{
                    const gs=this.games[id].statistics!
                    for(const k of Object.keys(gs.items.dropped)){
                        js.items.dropped[k]=(js.items.dropped[k]??0)+gs.items.dropped[k]
                    }
                    for(const k of Object.keys(gs.items.kills)){
                        js.items.kills[k]=(js.items.kills[k]??0)+gs.items.kills[k]
                    }
                    for(const k of Object.keys(gs.loadout.uses)){
                        js.loadout.uses[k]=(js.loadout.uses[k]??0)+gs.loadout.uses[k]
                    }
                    js.player.players+=gs.player.players
                    js.player.disconnection+=gs.player.disconnection
                    f.writeSync(this.te.encode(JSON.stringify(js,undefined)))
                }
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
        }*/
        return this.games.get(id)
    }
    run(){
        this.server.run()
    }
}
