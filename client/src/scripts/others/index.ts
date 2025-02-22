import { WebglRenderer, MousePosListener, KeyListener, ResourcesManager } from "../engine/mod.ts"
import { Game, getGame } from "./game.ts"
import { server } from "./config.ts";
import "../../scss/main.scss"
import { GuiManager } from "./guiManager.ts";
(async() => {
    const canvas=document.querySelector("#game-canvas") as HTMLCanvasElement

    document.body.appendChild(canvas)
    const renderer=new WebglRenderer(canvas,100)
    const resources=new ResourcesManager(renderer.gl)
    resources.load_folders(["img/game/common"])
    const mouseML=new MousePosListener(renderer.meter_size)
    const KeyL=new KeyListener()
    mouseML.bind(canvas,canvas)
    KeyL.bind(document.body)

    const g=new Game(`ws${server.toString()}/${await getGame("http://localhost:8080")}`,KeyL,mouseML,renderer,resources)
    g.guiManager=new GuiManager(g)
    g.connect("kaklik")
    g.mainloop()
})()