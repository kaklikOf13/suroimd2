import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { FormGameObject2D, Material2D, RGBA, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { Game } from "../others/game.ts";
export class Player extends FormGameObject2D{
    material!:Material2D
    objectType:string="player"
    numberType: number=1
    name:string=""
    create(_args: Record<string, void>): void {
      this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
      this.material=(this.game.renderer as WebglRenderer).factorys2D.simple.create_material(RGBA.new(1,0,0))
    }
    update(): void {
        
    }
    constructor(){
        super()
    }
    updateData(data:PlayerData){
        if(data.full){
            this.name=data.full.name
        }
        this.position=data.position
        if(this.id===(this.game as Game).activePlayer){
            (this.game as Game).update_camera()
        }
    }
}