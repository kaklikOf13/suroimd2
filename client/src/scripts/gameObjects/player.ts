import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { Material2D, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { ColorM } from "../engine/renderer.ts";
import { FormGameObject } from "../others/gameObject.ts";
export class Player extends FormGameObject{
    material!:Material2D
    stringType:string="player"
    numberType: number=1
    name:string=""
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef

    rotation:number=0
    handDef?:GameItem

    create(_args: Record<string, void>): void {
      this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
      this.material=(this.game.renderer as WebglRenderer).factorys2D.simple.create_material(ColorM.default.red)
    }
    update(_dt:number): void {
        
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
            if(data.full.handItem===undefined){
                this.handDef=undefined
            }else{
                this.handDef=GameItems.valueNumber[data.full.handItem]
            }
        }
        this.position=data.position
        this.rotation=data.rotation

        this.manager.cells.updateObject(this)

        if(this.id===this.game.activePlayer){
            this.game.update_camera()
            if(data.full){
                this.game.guiManager.update_equipaments()
            }
        }
    }
}