import { ResourcesManager, WebglRenderer} from "../engine/mod.ts"
import { Game} from "./game.ts"
import {  ConfigCasters, ConfigDefaultActions, ConfigDefaultValues } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "../managers/guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, Client, IPLocation, OfflineClientsManager } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { GameConsole } from "../engine/console.ts";
import { MenuManager } from "../managers/menuManager.ts";
import { InputManager } from "../engine/keys.ts";
import { HideElement } from "../engine/utils.ts";
import { TreeBotAi } from "../../../../server/src/game_server/player/simple_bot_ai.ts";
(() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement
    const inputs=new InputManager(100);
    inputs.bind(document.body,canvas)

    document.body.appendChild(canvas)
    const sounds=new SoundManager()

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
    //await resources.load_audio("menu_music",{src:"sounds/musics/menu_music.mp3",volume:1})

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
            this.elements.play_button_normal.addEventListener("click",(_e)=>{this.playGame({offline:false})})
            this.elements.play_button_campaign.addEventListener("click",(_e)=>{this.playGame({offline:true})})
            this.game=new Game(inputs,sounds,GameSave,resources,renderer)
            this.game.listners_init()
            this.game.init_gui(gui)
            this.game.request_animation_frame=false
            this.game.onstop=this.closeGame.bind(this)
        }
        async playGame(join_config:JoinConfig){
            if(this.game.happening||!menu_manager.loaded)return
            let socket:BasicSocket
            if(join_config.offline){
                if(this.game_server){
                    this.game_server.running=false
                    this.game_server=undefined
                }
                this.game_server = new OfflineGameServer(new OfflineClientsManager(PacketManager),0,{
                    gameTps:100,
                    maxPlayers:10,
                    teamSize:1,
                    netTps:30,
                    deenable_lobby:true,
                },{
                    database:{
                        enabled:false
                    }
                })
                this.game_server.mainloop()
                for(let i=0;i<9;i++){
                    const bot=this.game_server.add_bot()
                    bot.ai=new TreeBotAi(bot,{
                        decision_update_rate:1,
                        reaction_time:0.3,
                        accuracy:0.5,
                        bravery:0.4,
                        teamwork:1,
                        like_regen:1
                    })
                }
                this.game_server.subscribe_db={
                    "localhost":{
                        skins:[1,2]
                    }
                }
                socket=this.game_server.clients.fake_connect(GameSave.get_variable("cv_game_ping")) as BasicSocket
            }else{
                const reg=menu_manager.regions[GameSave.get_variable("cv_game_region")]
                const ser=new IPLocation(reg.host,reg.port)
                const ghost=await((await fetch(`${ser.toString("http")}/api/get-game`)).text())
                socket=new WebSocket(ser.toString("ws") + "/api/" + ghost + "/ws") as unknown as BasicSocket
            }
            sounds.set_music(null)
            const c=new Client(socket!,PacketManager)
            c.onopen=this.game.connect.bind(this.game,c,GameSave.get_variable("cv_loadout_name"))

            this.game.running=true
            menu_manager.game_start()
            this.game.mainloop()
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