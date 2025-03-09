import { GuiPacket, HandData } from "common/scripts/packets/gui_packet.ts";
import { Game } from "./game.ts";
import { Definition } from "common/scripts/engine/definitions.ts";
import { ExtraType, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GunDef, Guns } from "common/scripts/definitions/guns.ts";
import { ActionsType, CATEGORYS } from "common/scripts/others/constants.ts";
import { DefaultEvents, Numeric } from "common/scripts/engine/mod.ts";
import { AmmoDef, Ammos } from "common/scripts/definitions/ammo.ts";
import { HealingDef, Healings } from "common/scripts/definitions/healings.ts";
import { Player } from "../gameObjects/player.ts";

export class GuiManager{
    game:Game
    content={
        health_bar_interior:document.querySelector("#health-bar") as HTMLDivElement,
        health_bar_animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        health_bar_amount:document.querySelector("#health-bar-amount") as HTMLSpanElement,

        extra_bar_interior:document.querySelector("#extra-bar") as HTMLDivElement,
        extra_bar_amount:document.querySelector("#extra-bar-amount") as HTMLSpanElement,

        hand_info_count:document.querySelector("#hand-info-count") as HTMLSpanElement,
        current_item_image:document.querySelector("#current-item-image") as HTMLImageElement,

        action_info_delay:document.querySelector("#action-info-delay") as HTMLSpanElement,
        action_info:document.querySelector("#action-info") as HTMLDivElement,

        inventory:document.querySelector("#inventory") as HTMLDivElement,

        helmet_slot:document.querySelector("#helmet-slot") as HTMLImageElement,
        vest_slot:document.querySelector("#vest-slot") as HTMLImageElement,
    }
    inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    hand:HandData
    handSelection?:HTMLDivElement
    action?:{delay:number,start:number,type:ActionsType}
    constructor(game:Game){
        this.game=game
        this.game.client.on("gui",(p:GuiPacket)=>{
            this.set_health(p.Health,p.MaxHealth)
            this.set_extra(p.Extra,p.MaxExtra,p.ExtraType)
            if(p.inventory){
                this.inventory.length=0
                for(const s of p.inventory){
                    let def:Definition
                    switch(s.type){
                        case InventoryItemType.gun:
                            def=Guns.getFromNumber(s.idNumber)
                            break
                        case InventoryItemType.ammo:
                            def=Ammos.getFromNumber(s.idNumber)
                            break
                        case InventoryItemType.healing:
                            def=Healings.getFromNumber(s.idNumber)
                            break
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
                if(p.action){
                    this.action={
                        delay:p.action.delay,
                        start:Date.now(),
                        type:p.action.type
                    }
                }else{
                    this.action=undefined
                }
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
            if(!this.hand){
                return
            }
            switch(this.hand.type){
                case InventoryItemType.gun:{
                    const def=(this.inventory[this.hand.location-1].def as GunDef)
                    this.content.current_item_image.src=`img/game/common/guns/normal/${def.idString}.svg`
                    this.content.current_item_image.style.width="70px"
                    this.content.current_item_image.style.height="70px"
                    this.content.current_item_image.style.opacity="100%"
                    this.content.current_item_image.style.transform="rotate(-30deg)"
                    this.content.hand_info_count.innerText=`${this.hand.ammo}/${this.hand.disponibility}`
                    break
                }
                case InventoryItemType.ammo:{
                    const def=(this.inventory[this.hand.location-1].def as AmmoDef)
                    this.content.current_item_image.src=`img/game/common/ammos/${def.idString}.svg`
                    this.content.current_item_image.style.width="40px"
                    this.content.current_item_image.style.height="40px"
                    this.content.current_item_image.style.opacity="100%"
                    this.content.current_item_image.style.transform="unset"
                    this.content.hand_info_count.innerText=`${this.inventory[this.hand.location-1].count}`
                    break
                }
                case InventoryItemType.healing:{
                    const def=(this.inventory[this.hand.location-1].def as HealingDef)
                    this.content.current_item_image.src=`img/game/common/healings/${def.idString}.svg`
                    this.content.current_item_image.style.width="40px"
                    this.content.current_item_image.style.height="40px"
                    this.content.current_item_image.style.opacity="100%"
                    this.content.current_item_image.style.transform="unset"
                    this.content.hand_info_count.innerText=`${this.inventory[this.hand.location-1].count}`
                    break
                }
            }
            this.handSelection=this.inventory_cache[this.hand.location-1]
            this.handSelection.classList.add("inventory-slot-selected")

        }else{
            this.handSelection=undefined
            this.content.current_item_image.style.opacity="0%"
        }
    }
    update_equipaments(){
        const player=this.game.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.game.activePlayer}) as Player
        if(!player)return
        if(player.helmet){
            this.content.helmet_slot.src=`img/game/common/equipaments/${player.helmet.idString}.svg`
        }else{
            this.content.helmet_slot.src="img/game/common/icons/helmet.svg"
        }
        if(player.vest){
            this.content.vest_slot.src=`img/game/common/equipaments/${player.vest.idString}.svg`
        }else{
            this.content.vest_slot.src="img/game/common/icons/vest.svg"
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
                    img.width=40
                    img.height=40
                    img.style.width = "40px"
                    img.style.height = "40px"
                    break
                case InventoryItemType.ammo:
                    img.src=`img/game/common/ammos/${s.def.idString}.svg`
                    img.style.width="25px"
                    img.style.height="25px"
                    img.width=25
                    img.height=25
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
                case InventoryItemType.healing:
                    img.src=`img/game/common/healings/${s.def.idString}.svg`
                    img.style.width="25px"
                    img.style.height="25px"
                    img.width=25
                    img.height=25
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
            }
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
            const w=(Date.now()-this.action.start)/1000
            this.content.action_info.style.opacity="100%"
            this.content.action_info_delay.innerText=`${Numeric.maxDecimals(this.action.delay-w,1)}s`
            if(w>this.action.delay){
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
    set_extra(extra:number,max_extra:number,extra_type:ExtraType){
        const p=extra/max_extra
        this.content.extra_bar_interior.style.width =`${p*100}%`
        this.content.extra_bar_amount.innerText=`${extra}/${max_extra}`
        this.content.extra_bar_interior.style.backgroundColor=ExtrasColors[extra_type]
    }
}
const ExtrasColors:Record<ExtraType,string>={
    [ExtraType.Adrenaline]:"#ff0",
    [ExtraType.Shield]:"#08f"
}