import { MousePosListener, KeyListener, ResourcesManager, WebglRenderer } from "../engine/mod.ts"
import { Game} from "./game.ts"
import { api_server, ConfigCasters, ConfigDefaultValues } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "./guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, OfflineClientsManager, OfflineSocket } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
import { GameConsole } from "../engine/console.ts";
import { MenuManager } from "./menuManager.ts";
import { RegionDef } from "common/scripts/definitions/utils.ts";
import { Server } from "../engine/mod.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement

    document.body.appendChild(canvas)
    const sounds=new SoundManager()

    const renderer=new WebglRenderer(canvas,100)

    const resources=new ResourcesManager(renderer.gl,sounds)

    const GameSave=new GameConsole()
    GameSave.casters=ConfigCasters
    GameSave.default_values=ConfigDefaultValues
    GameSave.init("suroimd2-config")

    const menu_manager=new MenuManager(GameSave)
    menu_manager.start()

    const offline=false

    let loaded=false
    let gs:OfflineGameServer|undefined

    let regions:Record<string,RegionDef>={}

    if(offline){
        gs = new OfflineGameServer(new OfflineClientsManager(PacketManager),0,{
            deenable_feast:true,
            gameTps:60,
            maxPlayers:10,
            teamSize:1,
            netTps:30
        })
        gs.mainloop()
    }else{
        regions=await(await fetch(`http${api_server.toString()}/get-regions`)).json()
    }
    const current_region="local"
    
    const spg=await(await fetch("atlases/atlas-common-data.json")).json()
    for(const s of spg[GameSave.get_variable("cv_graphics_resolution")]){
        await resources.load_spritesheet("",s)
    }
    resources.load_folder("/common.src").then(()=>{
        const lister=()=>{
            setTimeout(()=>{
                if(app.game)return
                //sounds.set_music(resources.get_audio("menu_music"))
            },1000)
            loaded=true
            document.removeEventListener("mousedown",lister)
        }
        document.addEventListener("mousedown",lister)
    })
    const mouseML=new MousePosListener(100)
    const KeyL=new KeyListener()
    mouseML.bind(document.body,canvas)
    KeyL.bind(document.body)

    //await resources.load_audio("menu_music",{src:"sounds/musics/menu_music.mp3",volume:1})

    class App{
        game?:Game
        menuD:HTMLDivElement=document.querySelector("#menu") as HTMLDivElement
        gameD:HTMLDivElement=document.querySelector("#game") as HTMLDivElement

        elements={
            play_button:document.querySelector("#btn-play") as HTMLButtonElement
        }

        constructor(){
            this.gameD.style.display="none"
            this.menuD.style.display="unset"

            this.elements.play_button.onclick=(_e)=>{this.playGame()}
        }
        async playGame(){
            if(this.game||!loaded)return
            this.gameD.style.display="unset"
            this.menuD.style.display="none"
            const ser=new Server(regions[current_region].host,regions[current_region].port)
            if(offline){
                const sockets=new OfflineSocket(undefined)
                const socketl:OfflineSocket=new OfflineSocket(sockets)
                sockets.output=socketl
                const g=new Game(KeyL,mouseML,sounds,GameSave,resources,socketl,renderer)
                sounds.set_music(null)
                g.guiManager=new GuiManager(g)
                sockets.open()
                socketl.open()
                gs?.clients.activate_ws(sockets,0,"localhost","aaa")
                g.connect(GameSave.get_variable("cv_loadout_name"))
                this.game=g
            }else{
                const ghost=await((await fetch(`http${ser.toString()}/api/get-game`)).text())
                const socket=new WebSocket("ws"+ser.toString()+"/api/"+ghost+"/ws")
                const g=new Game(KeyL,mouseML,sounds,GameSave,resources,socket as BasicSocket,renderer)
                g.client.onopen=g.connect.bind(g,GameSave.get_variable("cv_loadout_name"))
                sounds.set_music(null)
                g.guiManager=new GuiManager(g)
                this.game=g
            }
            this.game.request_animation_frame=false
            menu_manager.game_start()
            this.game.mainloop()
            this.game.onstop=this.closeGame.bind(this)
        }
        closeGame(){
            menu_manager.update_account()
            this.game=undefined
            this.gameD.style.display="none"
            this.menuD.style.display="unset"
        }

    }
    const app=new App()
})()