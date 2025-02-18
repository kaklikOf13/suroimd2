import { LootData } from "common/scripts/others/objectsEncode.ts";
import { FormGameObject2D, Material2D, RGBA, WebglRenderer } from "../engine/mod.ts";
import { RectHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
export class Loot extends FormGameObject2D{
    material!:Material2D
    objectType:string="loot"
    numberType: number=2
    name:string=""
    create(_args: Record<string, void>): void {
        this.hb=new RectHitbox2D(v2.new(3,3),v2.new(GameConstants.loot.radius.ammo,GameConstants.loot.radius.ammo))
        this.material=(this.game.renderer as WebglRenderer).factorys2D.simple.create_material(RGBA.new(1,0,0))
    }
    update(): void {
        
    }
    constructor(){
        super()
    }
    updateData(data:LootData){
        this.position=data.position
    }
}