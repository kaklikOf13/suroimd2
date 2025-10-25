import { ResourcesManager, WebglRenderer} from "../engine/mod.ts"
import { Game} from "./game.ts"
import { ConfigCasters, ConfigDefaultActions, ConfigDefaultValues } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "../managers/guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, Client, IPLocation } from "common/scripts/engine/mod.ts";
import { GameConsole } from "../engine/console.ts";
import { MenuManager } from "../managers/menuManager.ts";
import { InputManager } from "../engine/keys.ts"
import { ConfigType } from "common/scripts/config/config.ts";
import { WorkerSocket } from "common/scripts/engine/server_offline/worker_socket.ts";
import { NewMDLanguageManager } from "./languages.ts";
import { PacketManager } from "common/scripts/packets/packet_manager.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement
    const inputs=new InputManager(100)
    inputs.bind(canvas)
    const sounds=new SoundManager()
    const tm=await NewMDLanguageManager("english","/languages")
    sounds.volumes={
        "players":1,
        "music":1,
        "loot":1,
        "obstacles":1,
        "explosions":1,
        "ambience":1
    }

    const renderer=new WebglRenderer(canvas)

    const resources=new ResourcesManager(renderer.gl,sounds)

    const GameSave=new GameConsole()
    GameSave.input_manager=inputs
    GameSave.default_actions=ConfigDefaultActions
    GameSave.casters=ConfigCasters
    GameSave.default_values=ConfigDefaultValues
    GameSave.init("suroimd2-config")

    const menu_manager=new MenuManager(GameSave,resources,sounds)
    menu_manager.start()

    const gui=new GuiManager()

    interface JoinConfig{
        offline:boolean
    }
    class App{
        game:Game

        elements={
            play_button_normal:document.querySelector("#btn-play-normal") as HTMLButtonElement,
            play_button_campaign:document.querySelector("#btn-play-campaign") as HTMLButtonElement
        }

        game_server?:OfflineGameServer

        constructor(){
            this.elements.play_button_normal.addEventListener("click",(_e)=>{
                this.playGame({offline:false})
            })
            this.elements.play_button_campaign.addEventListener("click",(_e)=>{
                this.playGame({offline:true})
            })
            this.game=new Game(inputs,menu_manager,sounds,GameSave,resources,tm,renderer)
            this.game.listners_init()
            this.game.init_gui(gui)
            this.game.onstop=this.closeGame.bind(this)
        }
        async playGame(join_config:JoinConfig){
            if(this.game.happening||!menu_manager.loaded)return
            let socket:BasicSocket
            if (join_config.offline) {
                const worker = new Worker(new URL("./worker_server.ts", import.meta.url), {
                    type: "module",
                });

                this.game.offline=true
                worker.postMessage({
                    type: "start",
                    config: {
                        game: {
                            options: {
                                gameTps: 60,
                                netTps: 30
                            },
                            debug:{
                                deenable_lobby:true,
                                debug_menu:true,
                            }
                        },
                        database: {
                            enabled: false,
                            statistic:false
                        },
                    } as ConfigType,
                    bots: 99,
                    ping: GameSave.get_variable("cv_game_ping"),
                });

                socket = new WorkerSocket(worker);

                const c = new Client(socket, PacketManager);
                c.onopen = this.game.connect.bind(this.game, c, GameSave.get_variable("cv_loadout_name"));
            }else{
                this.game.offline=false
                const reg=menu_manager.api_settings.regions[GameSave.get_variable("cv_game_region")]
                const ser=new IPLocation(reg.host,reg.port)
                const ghost=await((await fetch(`${ser.toString("http")}/api/get-game`)).json())
                if(ghost.status===0){
                    socket=new WebSocket(`ws${ghost.address}/api/ws`) as unknown as BasicSocket
                }
            }
            const c=new Client(socket!,PacketManager)
            c.onopen=this.game.connect.bind(this.game,c,GameSave.get_variable("cv_loadout_name"))

            this.game.running=true
            menu_manager.game_start()
        }
        closeGame(){
            menu_manager.update_account()
            this.game.scene.objects.clear()
            this.game.guiManager.clear()
            this.game.menuManager.game_end()
            this.game.client?.disconnect()
            this.game.happening=false
            this.game.running=false
            this.game.clock.stop()

            if(this.game_server){
                this.game_server.clock.stop()
                this.game_server.running=false
                this.game_server=undefined
            }
        }

    }
    const app=new App()
})()