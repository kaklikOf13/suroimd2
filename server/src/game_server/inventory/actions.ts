import { Action, Slot } from "common/scripts/engine/inventory.ts";
import { type Player } from "../gameObjects/player.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type ConsumibleItem, type LItem, type GunItem } from "./inventory.ts";
import { ActionsType } from "common/scripts/others/constants.ts";

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
        if(consumed+this.item.ammo>this.item.def.reload!.capacity){
            consumed=this.item.def.reload!.capacity-this.item.ammo
        }
        this.item.ammo+=user.inventory.consume_ammo(def.ammoType,consumed)
        user.privateDirtys.current_weapon=true
        user.privateDirtys.inventory=true
        user.current_animation=undefined
    }
    type: number=ActionsType.Reload
}
export class ConsumingAction extends Action<Player>{
    delay:number
    item:ConsumibleItem
    type: number=ActionsType.Consuming
    constructor(item:ConsumibleItem){
        super()
        this.item=item
        this.delay=item.def.use_delay
    }
    on_execute(user:Player){
        const def=this.item.def
        if(def.health){
            user.health=Math.min(user.health+def.health,user.maxHealth*(def.max_heal??1))
        }
        if(def.boost){
            if(def.boost_type!==undefined&&def.boost_type!==user.BoostType){
                user.BoostType=def.boost_type
                user.boost=def.boost
            }else{
                user.boost=Math.min(user.boost+def.boost,user.maxBoost*(def.max_boost??1))
            }
        }
        if(def.parachute){
            user.parachute={
                value:def.parachute
            }
            user.seat?.clear_player()
        }
        this.item.inventory.consume(this.item,1)
        user.privateDirtys.inventory=true
    }
}