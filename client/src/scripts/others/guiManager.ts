import { GuiPacket } from "common/scripts/packets/gui_packet.ts";
import { Game } from "./game.ts";
import { Definition } from "common/scripts/engine/definitions.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { Guns } from "common/scripts/definitions/guns.ts";

export class GuiManager{
    game:Game
    healthBar={
        interior:document.querySelector("#health-bar") as HTMLDivElement,
        animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        amount:document.querySelector("#health-bar-amount") as HTMLSpanElement
    }
    inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    constructor(game:Game){
        this.game=game
        this.game.client.on("gui",(p:GuiPacket)=>{
            this.set_health(p.Health,p.MaxHealth)
            if(p.inventory){
                this.inventory.length=0
                for(const s of p.inventory){
                    let def:Definition
                    switch(s.type){
                        case InventoryItemType.gun:
                            def=Guns.getFromNumber(s.idNumber)
                            break
                        case InventoryItemType.ammo:
                        case InventoryItemType.healing:
                    }
                    this.inventory.push({count:s.count,def:def!,type:s.type})
                }
            }
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