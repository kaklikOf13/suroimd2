import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { Angle, CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import * as PIXI from "pixi.js"
export class Player extends GameObject{
    stringType:string="player"
    numberType: number=1
    name:string=""
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef

    rotation:number=0
    handDef?:GameItem

    sprites?:{
        body:PIXI.Sprite,
        left_arm:PIXI.Sprite,
        right_arm:PIXI.Sprite,
        helmet:PIXI.Sprite,
    }
    skin!:string

    set_skin(skin:string){
        if(this.sprites){
            this.sprites.body.destroy()
            this.sprites.left_arm.destroy()
            this.sprites.right_arm.destroy()
            this.sprites.helmet.destroy()
        }
        this.skin=skin
        this.sprites={
            body:new PIXI.Sprite(this.game.resources.get_sprite(skin+"_body").texture),
            left_arm:new PIXI.Sprite(this.game.resources.get_sprite(skin+"_arm").texture),
            right_arm:new PIXI.Sprite(this.game.resources.get_sprite(skin+"_arm").texture),
            helmet:new PIXI.Sprite()
        }
        this.container?.addChild(this.sprites.body)
        this.container?.addChild(this.sprites.left_arm)
        this.container?.addChild(this.sprites.right_arm)
        this.container?.addChild(this.sprites.helmet)

        this.sprites.body.anchor.set(0.5,0.5)
        this.sprites.helmet.anchor.set(0.5,0.5)

        this.sprites.left_arm.position._x=-23
        this.sprites.left_arm.position._y=-44
        this.sprites.right_arm.position._x=-23
        this.sprites.right_arm.position._y=44

        this.sprites.right_arm.anchor.set(0,0.5)
        this.sprites.left_arm.anchor.set(0,0.5)

        this.sprites.right_arm.rotation=Angle.deg2rad(-5)
        this.sprites.left_arm.rotation=Angle.deg2rad(5)
        this.sprites.body.zIndex=1

        this.sprites.helmet.zIndex=2
    }

    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
        this.container=new PIXI.Container()
        this.game.camera.addObject(this.container)
        this.set_skin("skin_default")
    }
    update(_dt:number): void {
        this.container!.position.set(this.position.x,this.position.y)
    }
    constructor(){
        super()
    }
    updateData(data:PlayerData){
        if(data.full){
            this.name=data.full.name
            if(data.full.helmet>0){
                this.helmet=Armors.getFromNumber(data.full.helmet-1)
                const h=this.helmet
                if(h.position){
                    this.sprites?.helmet.position.set(h.position.x,h.position.y)
                }else{
                    this.sprites?.helmet.position.set(0,0)
                }
                this.sprites!.helmet.visible=true
                this.sprites!.helmet.texture=this.game.resources.get_sprite(h.idString+"_world").texture
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

        this.container!.rotation=this.rotation

        this.manager.cells.updateObject(this)

        if(this.id===this.game.activePlayer){
            this.game.camera.position=v2.duplicate(this.position)
            if(data.full){
                this.game.guiManager.update_equipaments()
            }
        }
    }
}