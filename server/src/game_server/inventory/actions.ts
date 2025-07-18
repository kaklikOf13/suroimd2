import { Action, type SlotCap } from "common/scripts/engine/inventory.ts";
import { type Player } from "../gameObjects/player.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type GunItem } from "./inventory.ts";
import { ActionsType } from "common/scripts/others/constants.ts";
import { HealingDef } from "common/scripts/definitions/healings.ts";

export class ReloadAction extends Action<Player>{
    delay:number
    item:GunItem
    alt_reload:boolean=false
    constructor(item:GunItem){
        super()
        if(item.def.reload?.reload_alt&&item.ammo===0){
            this.delay=item.def.reload.reload_alt.delay
            this.alt_reload=true
        }else{
            this.delay=item.def.reload?.delay??1
        }
        this.item=item
    }
    on_execute(user:Player){
        if(this.item.itemType!=InventoryItemType.gun)return
        const def=this.item.def
        const cap=this.item.def.reload!.capacity
        //user.inventory.consumeTagRemains(`ammo_${this.def.ammoType}`,this.reload_count);
        let consumed=0
        if(this.alt_reload){
            if(def.reload!.reload_alt!.shotsPerReload){
                consumed=def.reload!.reload_alt!.shotsPerReload
            }else{
                consumed=cap
            }
        }else{
            if(def.reload!.shotsPerReload){
                consumed=def.reload!.shotsPerReload
            }else{
                consumed=cap
            }
        }
        this.item.ammo+=user.inventory.consume_ammo(def.ammoType,consumed)
        user.privateDirtys.current_weapon=true
        user.privateDirtys.inventory=true
        user.current_animation=undefined
    }
    type: number=ActionsType.Reload
}
export class HealingAction extends Action<Player>{
    delay:number
    def:HealingDef
    slot:SlotCap
    
    type: number=ActionsType.Healing
    constructor(def:HealingDef,slot:SlotCap){
        super()
        this.delay=def.use_delay
        this.def=def
        this.slot=slot
    }
    on_execute(user:Player){
        if(!user.handItem||!this.slot||user.handItem.itemType!=InventoryItemType.healing||user.handItem.def.idNumber!==this.def.idNumber)return
        if(this.def.health){
            user.health=Math.min(user.health+this.def.health,user.maxHealth)
        }
        if(this.def.boost){
            if(this.def.boost_type!==undefined&&this.def.boost_type!==user.BoostType){
                user.BoostType=this.def.boost_type
                user.boost=this.def.boost
            }else{
                user.boost=Math.min(user.boost+this.def.boost,user.maxBoost)
            }
        }
        this.slot.quantity--
        user.update_hand()
        user.privateDirtys.hand=true
        user.privateDirtys.inventory=true
    }
}