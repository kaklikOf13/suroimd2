import { GuiPacket, HandData } from "common/scripts/packets/gui_packet.ts";
import { Game } from "./game.ts";
import { Definition } from "common/scripts/engine/definitions.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GunDef, Guns } from "common/scripts/definitions/guns.ts";
import { ActionsType } from "common/scripts/others/constants.ts";
import { DefaultEvents, Numeric } from "common/scripts/engine/mod.ts";

export class GuiManager{
    game:Game
    content={
        health_bar_interior:document.querySelector("#health-bar") as HTMLDivElement,
        health_bar_animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        health_bar_amount:document.querySelector("#health-bar-amount") as HTMLSpanElement,

        hand_info_count:document.querySelector("#hand-info-count") as HTMLSpanElement,

        action_info_delay:document.querySelector("#action-info-delay") as HTMLSpanElement,
        action_info:document.querySelector("#action-info") as HTMLDivElement
    }
    inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    hand:HandData
    action?:{delay:number,type:ActionsType}
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
            if(p.dirty.hand){
                this.hand=p.hand
                this.set_hand_item()
            }
            if(p.dirty.action){
                this.action=p.action
            }
        })
        this.game.events.on(DefaultEvents.GameTick,this.update.bind(this))
        this.set_health(100,100)
    }
    set_hand_item(){
        if(!this.hand)return
        this.content.hand_info_count.innerText=`${this.hand.ammo}/${(this.inventory[this.hand.location].def as GunDef).reload.capacity}`
    }
    update(){
        if(this.action){
            this.content.action_info.style.opacity="100%"
            this.content.action_info_delay.innerText=`${Numeric.maxDecimals(this.action.delay,1)}s`
            this.action.delay-=1/this.game.tps
            if(this.action.delay<=0){
                this.action=undefined
            }
        }else{
            this.content.action_info.style.opacity="0%"
        }
    }
    set_health(health:number,max_health:number){
        const p=health/max_health
        this.content.health_bar_interior.style.width =`${p*100}%`
        this.content.health_bar_animation.style.width=`${p*100}%`
        this.content.health_bar_amount.innerText=`${health}/${max_health}`
    }
}