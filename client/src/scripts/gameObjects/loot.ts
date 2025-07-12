import { LootData } from "common/scripts/others/objectsEncode.ts";
import { RectHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { GameObject } from "../others/gameObject.ts";
export class Loot extends GameObject{
    stringType:string="loot"
    numberType: number=2
    name:string=""
    create(_args: Record<string, void>): void {
        this.hb=RectHitbox2D.positioned(v2.new(3,3),v2.new(GameConstants.loot.radius.ammo,GameConstants.loot.radius.ammo))
    }
    update(_dt:number): void {
        
    }
    constructor(){
        super()
    }
    override updateData(data:LootData){
        this.position=data.position
    }
}