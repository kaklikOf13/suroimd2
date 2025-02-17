import { GuiPacket } from "common/scripts/packets/gui_packet.ts";
import { Game } from "./game.ts";

export class GuiManager{
    game:Game
    healthBar={
        interior:document.querySelector("#health-bar") as HTMLDivElement,
        animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        amount:document.querySelector("#health-bar-amount") as HTMLSpanElement
    }
    constructor(game:Game){
        this.game=game
        this.game.client.on("gui",(p:GuiPacket)=>{
            this.set_health(p.Health,p.MaxHealth)
        })
        this.set_health(100,100)
    }
    set_health(health:number,max_health:number){
        const p=health/max_health
        this.healthBar.interior.style.width =`${p*100}%`
        this.healthBar.animation.style.width=`${p*100}%`
        this.healthBar.amount.innerText=`${health}/${max_health}`
    }
}