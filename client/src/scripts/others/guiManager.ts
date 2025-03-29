import { GuiPacket, HandData } from "common/scripts/packets/gui_packet.ts";
import { Game } from "./game.ts";
import { Definition } from "common/scripts/engine/definitions.ts";
import { BoostType, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GunDef } from "common/scripts/definitions/guns.ts";
import { ActionsType, CATEGORYS } from "common/scripts/others/constants.ts";
import { DefaultEvents, Numeric } from "common/scripts/engine/mod.ts";
import { AmmoDef } from "common/scripts/definitions/ammo.ts";
import { HealingDef} from "common/scripts/definitions/healings.ts";
import { Player } from "../gameObjects/player.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { OtherDef } from "common/scripts/definitions/others.ts";
import { CellphoneActionType } from "common/scripts/packets/action_packet.ts";

export class GuiManager{
    game:Game
    content={
        health_bar_interior:document.querySelector("#health-bar") as HTMLDivElement,
        health_bar_animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        health_bar_amount:document.querySelector("#health-bar-amount") as HTMLSpanElement,

        _bar_interior:document.querySelector("#boost-bar") as HTMLDivElement,
        _bar_amount:document.querySelector("#boost-bar-amount") as HTMLSpanElement,

        hand_info_count:document.querySelector("#hand-info-count") as HTMLSpanElement,
        current_item_image:document.querySelector("#current-item-image") as HTMLImageElement,

        action_info_delay:document.querySelector("#action-info-delay") as HTMLSpanElement,
        action_info:document.querySelector("#action-info") as HTMLDivElement,

        inventory:document.querySelector("#inventory") as HTMLDivElement,

        helmet_slot:document.querySelector("#helmet-slot") as HTMLImageElement,
        vest_slot:document.querySelector("#vest-slot") as HTMLImageElement,

        cellphone_actions:document.querySelector("#cellphone-actions") as HTMLDivElement,
        cellphone_input_item_id:document.querySelector("#cellphone-insert-item-id") as HTMLInputElement,
        cellphone_input_item_count:document.querySelector("#cellphone-insert-item-count") as HTMLInputElement,
        cellphone_give_item:document.querySelector("#cellphone-give-item-button") as HTMLButtonElement
    }
    inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    hand:HandData
    handSelection?:HTMLDivElement
    action?:{delay:number,start:number,type:ActionsType}
    constructor(game:Game){
        this.game=game
        this.game.client.on("gui",(p:GuiPacket)=>{
            this.set_health(p.Health,p.MaxHealth)
            this.set_boost(p.Boost,p.MaxBoost,p.BoostType)

            if(p.damages){
                this.game.add_damageSplash(p.damages.position,p.damages.count,p.damages.critical,p.damages.shield)
            }
            if(p.inventory){
                this.inventory.length=0
                for(const s of p.inventory){
                    this.inventory.push({count:s.count,def:GameItems.valueNumber[s.idNumber],type:s.type})
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

        //Cellphone
        this.content.cellphone_actions.style.display="none"

        const deenable_act=()=>{
            this.game.can_act=false
        }
        const enable_act=()=>{
            this.game.can_act=true
        }

        this.content.cellphone_input_item_id.addEventListener("focus",deenable_act)
        this.content.cellphone_input_item_id.addEventListener("blur",enable_act)

        this.content.cellphone_input_item_count.addEventListener("focus",deenable_act)
        this.content.cellphone_input_item_count.addEventListener("blur",enable_act)

        this.content.cellphone_give_item.addEventListener("click",(_)=>{
            this.game.action.cellphoneAction={
                type:CellphoneActionType.GiveItem,
                item_id:GameItems.keysString[this.content.cellphone_input_item_id.value],
                count:parseInt(this.content.cellphone_input_item_count.value),
            }
        })
    }
    set_hand_item(){
        this.content.cellphone_actions.style.display="none"
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
                    this.content.current_item_image.src=this.game.resources.get_sprite(def.idString).path
                    this.content.hand_info_count.innerText=`${this.hand.ammo}/${this.hand.disponibility}`
                    break
                }
                case InventoryItemType.ammo:{
                    const def=(this.inventory[this.hand.location-1].def as AmmoDef)
                    this.content.current_item_image.src=this.game.resources.get_sprite(def.idString).path
                    break
                }
                case InventoryItemType.healing:{
                    const def=(this.inventory[this.hand.location-1].def as HealingDef)
                    this.content.current_item_image.src=this.game.resources.get_sprite(def.idString).path
                    break
                }
                case InventoryItemType.other:{
                    const def=(this.inventory[this.hand.location-1].def as OtherDef)
                    if(def.idString==="cellphone"){
                        this.content.cellphone_actions.style.display="unset"
                    }
                    break
                }
            }
            if(this.hand.type===InventoryItemType.gun){
                this.content.current_item_image.style.width="70px"
                this.content.current_item_image.style.height="70px"
                this.content.current_item_image.style.transform="rotate(-30deg)"
            }else{
                this.content.current_item_image.style.width="40px"
                this.content.current_item_image.style.height="40px"
                this.content.current_item_image.style.transform="unset"
                this.content.hand_info_count.innerText=`${this.inventory[this.hand.location-1].count}`
            }
            this.content.current_item_image.style.opacity="100%"
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
            this.content.helmet_slot.src=this.game.resources.get_sprite(player.helmet.idString).path
        }else{
            this.content.helmet_slot.src="img/game/common/icons/helmet.svg"
        }
        if(player.vest){
            this.content.vest_slot.src=this.game.resources.get_sprite(player.vest.idString).path
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
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width = "40px"
                    img.style.height = "40px"
                    break
                case InventoryItemType.ammo:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width="25px"
                    img.style.height="25px"
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
                case InventoryItemType.healing:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width="25px"
                    img.style.height="25px"
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
                case InventoryItemType.other:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width = "40px"
                    img.style.height = "40px"
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
            
            if(w<this.action.delay){
                this.content.action_info.style.opacity="100%"
                this.content.action_info_delay.innerText=`${Numeric.maxDecimals(this.action.delay-w,1)}s`
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
    set_boost(boost:number,max_boost:number,_type:BoostType){
        const p=boost/max_boost
        this.content._bar_interior.style.width =`${p*100}%`
        this.content._bar_amount.innerText=`${boost}/${max_boost}`
        this.content._bar_interior.style.backgroundColor=BoostsColors[_type]
    }
}
const BoostsColors:Record<BoostType,string>={
    [BoostType.Adrenaline]:"#ff0",
    [BoostType.Shield]:"#08f",
    [BoostType.Mana]:"#92a",
    [BoostType.Addiction]:"#e13"
}