import { LootData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, RGBA } from "../engine/mod.ts";
import { RectHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
export class Loot extends FormGameObject2D{
    color:Color
    objectType:string="loot"
    numberType: number=2
    name:string=""
    create(_args: Record<string, void>): void {
        this.hb=new RectHitbox2D(v2.new(3,3),v2.new(GameConstants.loot.radius.ammo,GameConstants.loot.radius.ammo))
    }
    update(): void {
        
    }
    constructor(){
        super()
        this.color=RGBA.new(100,0,0)
    }
    updateData(data:LootData){
        this.position=data.position
    }
}