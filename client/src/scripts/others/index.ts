import { ResourcesManager, WebglRenderer} from "../engine/mod.ts"
import { Game} from "./game.ts"
import { api_server, ConfigCasters, ConfigDefaultActions, ConfigDefaultValues, offline } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "../managers/guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, Client, OfflineClientsManager, v2 } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { GameConsole } from "../engine/console.ts";
import { MenuManager } from "../managers/menuManager.ts";
import { RegionDef } from "common/scripts/definitions/utils.ts";
import { Server } from "../engine/mod.ts";
import { InputManager } from "../engine/keys.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement
    const inputs=new InputManager(100);
    inputs.bind(document.body,canvas)

    document.body.appendChild(canvas)
    const sounds=new SoundManager()

    const renderer=new WebglRenderer(canvas,100)

    const resources=new ResourcesManager(renderer.gl,sounds)

    const GameSave=new GameConsole()
    GameSave.input_manager=inputs
    GameSave.default_actions=ConfigDefaultActions
    GameSave.casters=ConfigCasters
    GameSave.default_values=ConfigDefaultValues
    GameSave.init("suroimd2-config")

    const menu_manager=new MenuManager(GameSave)
    menu_manager.start()


    let loaded=true
    let gs:OfflineGameServer|undefined

    let regions:Record<string,RegionDef>={}
    const gui=new GuiManager()

    if(offline){
        gs = new OfflineGameServer(new OfflineClientsManager(PacketManager),0,{
            deenable_feast:true,
            gameTps:100,
            maxPlayers:10,
            teamSize:1,
            netTps:30
        })
        gs.mainloop()
        gs.subscribe_db={
            "localhost":{
                skins:[1,2]
            }
        }
    }else{
        regions=await(await fetch(`http${api_server.toString()}/get-regions`)).json()
    }
    const current_region="local"
    
    const spg=await(await fetch("atlases/atlas-common-data.json")).json()
    for(const s of spg[GameSave.get_variable("cv_graphics_resolution")]){
        await resources.load_spritesheet("",s)
    }
    /*resources.load_folder("/common.src").then(()=>{
        const lister=()=>{
            setTimeout(()=>{
                if(app.game)return
                //sounds.set_music(resources.get_audio("menu_music"))
            },1000)
            loaded=true
            document.removeEventListener("mousedown",lister)
        }
        document.addEventListener("mousedown",lister)
    })*/

    //await resources.load_audio("menu_music",{src:"sounds/musics/menu_music.mp3",volume:1})

    class App{
        game:Game

        elements={
            play_button:document.querySelector("#btn-play") as HTMLButtonElement
        }

        constructor(){
            this.elements.play_button.addEventListener("click",(_e)=>{this.playGame()})
            this.game=new Game(inputs,sounds,GameSave,resources,renderer)
            this.game.listners_init()
            this.game.init_gui(gui)
            this.game.request_animation_frame=false
            this.game.onstop=this.closeGame.bind(this)
        }
        async playGame(){
            if(this.game.happening||!loaded)return
            let socket:BasicSocket
            if(offline){
                socket=gs?.clients.fake_connect(1) as BasicSocket
            }else{
                const ser=new Server(regions[current_region].host,regions[current_region].port)
                const ghost=await((await fetch(`http${ser.toString()}/api/get-game`)).text())
                socket=new WebSocket("ws"+ser.toString()+"/api/"+ghost+"/ws") as BasicSocket
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
            this.game.guiManager.content.gameOver.style.display="none"
            this.game.happening=false
        }

    }
    const app=new App()
})()