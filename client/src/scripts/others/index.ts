import { ResourcesManager, WebglRenderer} from "../engine/mod.ts"
import { Game} from "./game.ts"
import { ConfigCasters, ConfigDefaultActions, ConfigDefaultValues } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "../managers/guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, Client, IPLocation } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { GameConsole } from "../engine/console.ts";
import { MenuManager } from "../managers/menuManager.ts";
import { InputManager } from "../engine/keys.ts";
import { HideElement } from "../engine/utils.ts";
import { ConfigType } from "common/scripts/config/config.ts";
import { WorkerSocket } from "common/scripts/engine/server_offline/worker_socket.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement
    const inputs=new InputManager(100)
    inputs.bind(canvas)

    document.body.appendChild(canvas)
    const sounds=new SoundManager()
    sounds.volumes={
        "players":1,
        "music":1,
        "loot":1,
        "obstacles":1,
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
            this.game=new Game(inputs,menu_manager,sounds,GameSave,resources,renderer)
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

                worker.postMessage({
                    type: "start",
                    config: {
                        game: {
                            config: {
                                gameTps: 60,
                                netTps: 60
                            },
                            debug:{
                                deenable_lobby:true,
                                debug_menu:true
                            }
                        },
                        database: {
                            enabled: false,
                            statistic:true
                        },
                    } as ConfigType,
                    bots: 30,
                    ping: GameSave.get_variable("cv_game_ping"),
                });

                socket = new WorkerSocket(worker);

                const c = new Client(socket, PacketManager);
                c.onopen = this.game.connect.bind(this.game, c, GameSave.get_variable("cv_loadout_name"));
            }else{
                const reg=menu_manager.api_settings.regions[GameSave.get_variable("cv_game_region")]
                const ser=new IPLocation(reg.host,reg.port)
                const ghost=await((await fetch(`${ser.toString("http")}/api/get-game`)).text())
                socket=new WebSocket(ser.toString("ws") + "/api/" + ghost + "/ws") as unknown as BasicSocket
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
            HideElement(this.game.guiManager.content.gameOver)
            this.game.happening=false

            if(this.game_server){
                this.game_server.running=false
            }
        }

    }
    const app=new App()
})()