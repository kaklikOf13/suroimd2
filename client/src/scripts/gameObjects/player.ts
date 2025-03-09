import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { FormGameObject2D, Material2D, WebglRenderer } from "../engine/mod.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Game } from "../others/game.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { ColorM } from "../engine/renderer.ts";
export class Player extends FormGameObject2D{
    material!:Material2D
    objectType:string="player"
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
            if(data.full.handItem===undefined){
                this.handDef=undefined
            }else{
                this.handDef=GameItems.valueNumber[data.full.handItem]
            }
        }
        this.position=data.position
        this.rotation=data.rotation

        //Shoot
        /*if(this.handDef){
            if(this.handDef.item_type===InventoryItemType.gun){
                const gd=(this.handDef as GunDef&GameItem)
                if(data.using_item_down&&gd.gasParticles){
                    const position=v2.add(
                        this.position,
                        v2.mult(v2.from_RadAngle(this.rotation),v2.new(gd.lenght,gd.lenght))
                    )
                    for(let i=0;i<gd.gasParticles.count;i++){
                        this.game.particles.add_particle(position,this.rotation,{angular_speed:random.float(-0.1,0.1),lifetime:1,speed:0.01}satisfies Particle2DLifetime1,Particles2DBase.life_timed1)
                    }
                }
            }
        }*/

        if(this.id===(this.game as Game).activePlayer){
            (this.game as Game).update_camera()
            if(data.full){
                (this.game as Game).guiManager.update_equipaments()
            }
        }
    }
}