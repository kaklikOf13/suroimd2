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
        current_item_image:document.querySelector("#current-item-image") as HTMLImageElement,

        action_info_delay:document.querySelector("#action-info-delay") as HTMLSpanElement,
        action_info:document.querySelector("#action-info") as HTMLDivElement,

        inventory:document.querySelector("#inventory") as HTMLDivElement
    }
    inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    hand:HandData
    handSelection?:HTMLDivElement
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
                this.inventory_cache=this.inventory_reset()
            }
            if(p.dirty.hand){
                if(this.handSelection){
                    this.handSelection.classList.remove("inventory-slot-selected")
                }
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
        if(!this.hand){
            this.content.current_item_image.style.backgroundImage="none"
            return
        }
        if(this.hand.location>0){
            const def=(this.inventory[this.hand.location-1].def as GunDef)
            this.content.current_item_image.src=`img/game/common/guns/normal/${def.idString}.svg`
            this.content.current_item_image.width=70
            this.content.current_item_image.height=70
            this.content.current_item_image.style.opacity="100%"

            this.handSelection=this.inventory_cache[this.hand.location-1]
            this.handSelection.classList.add("inventory-slot-selected")

            this.content.hand_info_count.innerText=`${this.hand.ammo}/${def.reload.capacity}`
        }else{
            this.handSelection=undefined
            this.content.current_item_image.style.opacity="0%"
        }
    }
    inventory_cache:HTMLDivElement[]=[]
    inventory_reset():HTMLDivElement[]{
        const cache:HTMLDivElement[]=[]
        this.content.inventory.innerHTML=""
        let i=0
        const sMM=(slot:HTMLDivElement,i:number)=>{
            slot.addEventListener("mousedown",(e)=>{
                if(e.button!==0)return
                this.game.action.hand=i+1
                this.game.action.UsingItem=false
            })
        }
        for(const s of this.inventory){
            const slot = document.createElement("div")
            slot.classList.add("inventory-slot")

            if(this.hand&&this.hand.location===i){
                slot.classList.add("inventory-slot-selected")
            }

            const img = document.createElement("img")
            switch(s.type){
                case InventoryItemType.gun:
                    img.src=`img/game/common/guns/normal/${s.def.idString}.svg`
                    break
                case InventoryItemType.ammo:
                case InventoryItemType.healing:
            }
            img.style.width = "40px"
            img.style.height = "40px"
            slot.appendChild(img)
            this.content.inventory.appendChild(slot)
            cache.push(slot)
            sMM(slot,i)
            i++

        }
        return cache
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