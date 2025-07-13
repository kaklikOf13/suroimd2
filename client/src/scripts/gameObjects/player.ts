import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import { Container2D, Sprite2D } from "../engine/mod.ts";
export class Player extends GameObject{
    stringType:string="player"
    numberType: number=1
    name:string=""
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef

    rotation:number=0
    handDef?:GameItem

    skin!:string
    container:Container2D=new Container2D()
    sprites={
        body:new Sprite2D(),
        helmet:new Sprite2D(),
        left_arm:new Sprite2D(),
        right_arm:new Sprite2D(),
    }

    set_skin(skin:string){
        this.skin=skin

        this.sprites.body.sprite=this.game.resources.get_sprite(skin+"_body")

        this.sprites.body.hotspot=v2.new(0.5,0.5)
        this.sprites.helmet.hotspot=v2.new(0.5,0.5)

        this.sprites.left_arm.position.x=-0.23
        this.sprites.left_arm.position.y=-0.44
        this.sprites.right_arm.position.x=-0.23
        this.sprites.right_arm.position.y=0.44

        this.sprites.left_arm.hotspot=v2.new(-0.5,-0.5)
        this.sprites.right_arm.hotspot=v2.new(-0.5,-0.5)

        this.sprites.body.zIndex=1
        this.sprites.helmet.zIndex=2

        /*


        this.sprites.right_arm.rotation=Angle.deg2rad(-5)
        this.sprites.left_arm.rotation=Angle.deg2rad(5)
        */
    }

    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
        this.set_skin("skin_default")
        this.game.camera.addObject(this.container)
    }
    update(_dt:number): void {
        this.container.position=this.position
    }
    override onDestroy(): void {
      this.container.destroy()
    }
    constructor(){
        super()
        this.container.add_child(this.sprites.body)
        this.container.zIndex=zIndexes.Players
        this.container.add_child(this.sprites.left_arm)
        this.container.add_child(this.sprites.right_arm)
        this.container.add_child(this.sprites.helmet)
    }
    override updateData(data:PlayerData){
        if(data.full){
            this.name=data.full.name
            if(data.full.helmet>0){
                this.helmet=Armors.getFromNumber(data.full.helmet-1)
                const h=this.helmet

                if(h.position){
                    this.sprites.helmet.position=v2.new(h.position.x,h.position.y)
                }else{
                    this.sprites.helmet.position=v2.new(0,0)
                }
                this.sprites!.helmet.sprite=this.game.resources.get_sprite(h.idString+"_world")
            }else{
                this.sprites.helmet.sprite=undefined
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

        this.container.rotation=this.rotation

        this.manager.cells.updateObject(this)

        if(this.id===this.game.activePlayer){
            this.game.update_camera()
            if(data.full){
                this.game.guiManager.update_equipaments()
            }
        }
    }
}