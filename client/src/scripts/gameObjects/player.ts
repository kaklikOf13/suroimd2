import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { WeaponDef,Weapons } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import { type Camera2D, Container2D, type Renderer, Sprite2D } from "../engine/mod.ts";
import { Debug } from "../others/config.ts";
export class Player extends GameObject{
    stringType:string="player"
    numberType: number=1
    name:string=""
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef

    rotation:number=0

    skin!:string
    container:Container2D=new Container2D()
    sprites={
        body:new Sprite2D(),
        helmet:new Sprite2D(),
        left_arm:new Sprite2D(),
        right_arm:new Sprite2D(),
        weapon:new Sprite2D(),
    }

    current_weapon?:WeaponDef

    set_current_weapon(def:WeaponDef){
        if(this.current_weapon===def)return
        this.current_weapon=def
        if(def?.arms){
            if(def.arms.left){
                this.sprites.left_arm.visible=true
                this.sprites.left_arm.position=v2.duplicate(def.arms.left.position)
                this.sprites.left_arm.rotation=def.arms.left.rotation
            }else{
                this.sprites.left_arm.visible=false
            }
            if(def.arms.right){
                this.sprites.right_arm.visible=true
                this.sprites.right_arm.position=v2.duplicate(def.arms.right.position)
                this.sprites.right_arm.rotation=def.arms.right.rotation
            }else{
                this.sprites.right_arm.visible=false
            }
        }else{
            this.sprites.left_arm.visible=false
            this.sprites.right_arm.visible=false
        }
        if(def?.image){
            this.sprites.weapon.sprite=this.game.resources.get_sprite(`${def.idString}_world`)
            this.sprites.weapon.visible=true
            this.sprites.weapon.position=v2.duplicate(def.image.position)
            this.sprites.weapon.rotation=def.image.rotation
        }else{
            this.sprites.weapon.visible=false
        }
    }

    set_skin(skin:string){
        this.skin=skin

        this.sprites.body.sprite=this.game.resources.get_sprite(skin+"_body")
        this.sprites.left_arm.sprite=this.game.resources.get_sprite(skin+"_arm")
        this.sprites.right_arm.sprite=this.game.resources.get_sprite(skin+"_arm")

        this.sprites.left_arm.zIndex=1
        this.sprites.right_arm.zIndex=1

        this.sprites.left_arm.visible=false
        this.sprites.right_arm.visible=false

        this.sprites.body.hotspot=v2.new(0.5,0.5)
        this.sprites.helmet.hotspot=v2.new(0.5,0.5)
        this.sprites.weapon.hotspot=v2.new(0.5,0.5)

        this.sprites.left_arm.hotspot=v2.new(0.9,0.5)
        this.sprites.right_arm.hotspot=v2.new(0.9,0.5)

        this.sprites.body.zIndex=3
        this.sprites.helmet.zIndex=4
        this.sprites.weapon.zIndex=2

        this.container.updateZIndex()

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
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
        if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_player"),camera.visual_position)
        }
    }
    constructor(){
        super()
        this.container.add_child(this.sprites.body)
        this.container.zIndex=zIndexes.Players
        this.container.add_child(this.sprites.left_arm)
        this.container.add_child(this.sprites.right_arm)
        this.container.add_child(this.sprites.helmet)
        this.container.add_child(this.sprites.weapon)
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
            this.set_current_weapon(Weapons.valueNumber[data.full.current_weapon])

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