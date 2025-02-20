import { Action } from "common/scripts/engine/inventory.ts";
import { Player } from "../gameObjects/player.ts";
import { GunDef } from "common/scripts/definitions/guns.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type GunItem } from "./inventory.ts";
import { ActionsType } from "common/scripts/others/constants.ts";

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