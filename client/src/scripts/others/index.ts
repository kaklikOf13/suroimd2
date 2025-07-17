import { MousePosListener, KeyListener, ResourcesManager, WebglRenderer } from "../engine/mod.ts"
import { Game, getGame } from "./game.ts"
import { server } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "./guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
import { OfflineGameServer } from "./offline.ts";
import { BasicSocket, OfflineClientsManager, OfflineSocket } from "common/scripts/engine/mod.ts";
import { PacketManager } from "common/scripts/others/constants.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement

    document.body.appendChild(canvas)
    const sounds=new SoundManager()

    const renderer=new WebglRenderer(canvas,100)

    const resources=new ResourcesManager(renderer.gl,sounds)

    const offline=false

    let loaded=false
    let gs:OfflineGameServer|undefined
    if(offline){
        gs = new OfflineGameServer(new OfflineClientsManager(PacketManager),0,{
            deenable_feast:true,
            gameTps:60,
            maxPlayers:10,
            netTps:30
        })
        gs.mainloop()
    }
    
    const spg=await(await fetch("atlases/atlas-common-data.json")).json()
    for(const s of spg.high){
        await resources.load_spritesheet("",s)
    }
    resources.load_folder("/common.src").then(async()=>{
        const lister=()=>{
            setTimeout(()=>{
                if(app.game)return
                sounds.set_music(resources.get_audio("menu_music"))
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

    await resources.load_audio("menu_music",{src:"sounds/musics/menu_music.mp3",volume:1})

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
            const ip=`ws${server.toString()}/${await getGame("http"+server.toString())}`
            if(offline){
                const sockets=new OfflineSocket(undefined)
                const socketl:OfflineSocket=new OfflineSocket(sockets)
                sockets.output=socketl
                const g=new Game(KeyL,mouseML,sounds,resources,socketl,renderer)
                sounds.set_music(null)
                g.guiManager=new GuiManager(g)
                sockets.open()
                socketl.open()
                gs?.clients.activate_ws(sockets,0,"localhost")
                g.connect("")
                this.game=g
            }else{
                const socket=new WebSocket(ip)
                const g=new Game(KeyL,mouseML,sounds,resources,socket as BasicSocket,renderer)
                g.client.onopen=g.connect.bind(g,"")
                sounds.set_music(null)
                g.guiManager=new GuiManager(g)
                this.game=g
            }
            this.game.request_animation_frame=false
            this.game.mainloop()
            this.game.onstop=this.closeGame.bind(this)
        }
        closeGame(){
            this.game=undefined
            this.gameD.style.display="none"
            this.menuD.style.display="unset"
        }

    }
    const app=new App()
})()