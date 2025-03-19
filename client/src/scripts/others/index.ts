import { WebglRenderer, MousePosListener, KeyListener, ResourcesManager } from "../engine/mod.ts"
import { Game, getGame } from "./game.ts"
import { server } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "./guiManager.ts";
import "../news/new.ts"
import { SoundManager } from "../engine/sounds.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement

    document.body.appendChild(canvas)
    const renderer=new WebglRenderer(canvas,100)
    const sounds=new SoundManager()
    const resources=new ResourcesManager(renderer.gl,sounds)

    let loaded=false

    resources.load_folder("/common.src").then(()=>{
        loaded=true
        setTimeout(()=>{
            if(app.game)return
            sounds.set_music(resources.get_audio("menu_music"))
        },1000)
    })
    const mouseML=new MousePosListener(renderer.meter_size)
    const KeyL=new KeyListener()
    mouseML.bind(canvas,canvas)
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
            if(this.game&&!loaded)return
            this.gameD.style.display="unset"
            this.menuD.style.display="none"
            const g=new Game(`ws${server.toString()}/${await getGame("http"+server.toString())}`,KeyL,mouseML,renderer,sounds,resources)
            sounds.set_music(null)
            g.guiManager=new GuiManager(g)
            g.connect("kaklik")
            this.game=g
            g.mainloop()
            g.onstop=this.closeGame.bind(this)
        }
        closeGame(_g:Game){
            this.game=undefined
            this.gameD.style.display="none"
            this.menuD.style.display="unset"
        }

    }
    const app=new App()
})()