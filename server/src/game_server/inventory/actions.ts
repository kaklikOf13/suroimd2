import { Action, SlotCap } from "common/scripts/engine/inventory.ts";
import { Player } from "../gameObjects/player.ts";
import { GunDef } from "common/scripts/definitions/guns.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type GunItem } from "./inventory.ts";
import { ActionsType } from "common/scripts/others/constants.ts";
import { HealingDef } from "common/scripts/definitions/healings.ts";

export class ReloadAction extends Action<Player>{
    delay:number
    def:GunDef
    reload_count:number
    constructor(reload_count:number,def:GunDef){
        super()
        this.reload_count=reload_count
        this.delay=def.reload.delay
        this.def=def
    }
    on_execute(user:Player){
        if(!user.handItem||user.handItem.itemType!=InventoryItemType.gun)return
        const consumed=user.inventory.consumeTagRemains(`ammo_${this.def.ammoType}`,this.reload_count);
        (user.handItem as GunItem).ammo+=consumed
        user.privateDirtys.hand=true
        user.privateDirtys.inventory=true
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
        if(!user.handItem||user.handItem.itemType!=InventoryItemType.healing)return
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
        user.inventory.update_infinity()
        user.privateDirtys.hand=true
        user.privateDirtys.inventory=true
    }
}