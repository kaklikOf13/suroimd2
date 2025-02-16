import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { Color, FormGameObject2D, RGBA } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { Game } from "../others/game.ts";
export class Player extends FormGameObject2D{
    color:Color
    objectType:string="player"
    numberType: number=1
    name:string=""
    create(_args: Record<string, void>): void {
      this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
    }
    update(): void {
        
    }
    constructor(){
        super()
        this.color=RGBA.new(0,0,0)
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