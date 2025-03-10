import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { FormGameObject2D, Material2D, RGBA, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Game } from "../others/game.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
export class Player extends FormGameObject2D{
    material!:Material2D
    objectType:string="player"
    numberType: number=1
    name:string=""
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef
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
            if(data.full.helmet>0){
                this.helmet=Armors.getFromNumber(data.full.helmet-1)
            }
            if(data.full.vest>0){
                this.vest=Armors.getFromNumber(data.full.vest-1)
            }
        }
        this.position=data.position
        if(this.id===(this.game as Game).activePlayer){
            (this.game as Game).update_camera()
            if(data.full){
                (this.game as Game).guiManager.update_equipaments()
            }
        }
    }
}