import { PlayerAnimation, PlayerAnimationType, PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CircleHitbox2D, random, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { CATEGORYS, GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { WeaponDef,Weapons } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import { type Camera2D, Container2D, type Renderer, Sprite2D } from "../engine/mod.ts";
import { Debug } from "../others/config.ts";
import { Decal } from "./decal.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GunDef } from "common/scripts/definitions/items/guns.ts";
import { ABParticle2D } from "../engine/game.ts";
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
        muzzle_flash:new Sprite2D(),
    }

    current_weapon?:WeaponDef

    on_hitted(position:Vec2){
        if(Math.random()<=0.1){
            const d=new Decal()
            d.sprite.frame=this.game.resources.get_sprite(`blood_decal_${random.int(1,2)}`)
            d.sprite.scale=v2.random(0.7,1.4)
            d.sprite.rotation=random.rad()
            d.sprite.position=v2.duplicate(position)
            this.game.scene.objects.add_object(d,CATEGORYS.DECALS)
        }
    }

    current_animation?:PlayerAnimation

    set_current_weapon(def:WeaponDef){
        if(this.current_weapon===def)return
        this.current_weapon=def
        if(def?.arms){
            if(def.arms.left){
                this.sprites.left_arm.visible=true
                this.sprites.left_arm.position=v2.duplicate(def.arms.left.position)
                this.sprites.left_arm.rotation=def.arms.left.rotation
                this.sprites.left_arm.zIndex=def.arms.left.zIndex??1
            }else{
                this.sprites.left_arm.visible=false
            }
            if(def.arms.right){
                this.sprites.right_arm.visible=true
                this.sprites.right_arm.position=v2.duplicate(def.arms.right.position)
                this.sprites.right_arm.rotation=def.arms.right.rotation
                this.sprites.right_arm.zIndex=def.arms.right.zIndex??1
            }else{
                this.sprites.right_arm.visible=false
            }
        }else{
            this.sprites.left_arm.visible=false
            this.sprites.right_arm.visible=false
        }
        if(def?.image){
            this.sprites.weapon.frame=this.game.resources.get_sprite((def as unknown as GameItem).item_type===InventoryItemType.melee?def.idString:`${def.idString}_world`)
            this.sprites.weapon.visible=true
            this.sprites.weapon.position=v2.duplicate(def.image.position)
            this.sprites.weapon.rotation=def.image.rotation
            this.sprites.weapon.zIndex=def.image.zIndex??2
            this.sprites.weapon.hotspot=def.image.hotspot??v2.new(.5,.5)
        }else{
            this.sprites.weapon.visible=false
        }
        this.container.updateZIndex()
    }

    set_skin(skin:string){
        this.skin=skin

        this.sprites.body.frame=this.game.resources.get_sprite(skin+"_body")
        this.sprites.left_arm.frame=this.game.resources.get_sprite(skin+"_arm")
        this.sprites.right_arm.frame=this.game.resources.get_sprite(skin+"_arm")

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

        this.sprites.body.frames=[{delay:random.float(3.4,3.6),image:skin+"_body"},{delay:0.1,image:skin+"_body_1"}]

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
        this.sprites.muzzle_flash.visible=false
        this.sprites.muzzle_flash.hotspot=v2.new(0,.5)
        this.sprites.muzzle_flash.zIndex=10
        this.container.add_child(this.sprites.muzzle_flash)
    }
    play_animation(animation:PlayerAnimation){
        this.current_animation=animation
        this.sprites.muzzle_flash.visible=false
        switch(this.current_animation.type){
            case PlayerAnimationType.Shooting:{
                if((this.current_weapon as unknown as GameItem).item_type!==InventoryItemType.gun)break
                this.current_animation=animation
                const d=this.current_weapon as GunDef
                if(d.recoil){
                    const w=0.05
                    const dur=0.1
                    this.game.addTween({
                        target:this.sprites.weapon.position,
                        duration:dur,
                        to:v2.sub(this.sprites.weapon.position,v2.new(w,0)),
                        yoyo:true,
                        onComplete:()=>{
                            this.current_animation=undefined
                        }
                    })
                    this.game.addTween({
                        target:this.sprites.left_arm.position,
                        duration:dur,
                        to:v2.sub(this.sprites.left_arm.position,v2.new(w,0)),
                        yoyo:true,
                    })
                    this.game.addTween({
                        target:this.sprites.right_arm.position,
                        duration:dur,
                        to:v2.sub(this.sprites.right_arm.position,v2.new(w,0)),
                        yoyo:true,
                    })
                }
                if(d.muzzleFlash&&!this.sprites.muzzle_flash.visible){
                    this.sprites.muzzle_flash.frame=this.game.resources.get_sprite(d.muzzleFlash.sprite)
                    this.sprites.muzzle_flash.position=v2.new(d.lenght,0)
                    
                    this.sprites.muzzle_flash.visible=true
                    this.game.addTimeout(()=>{
                        this.sprites.muzzle_flash.visible=false
                    },d.muzzleFlash.duration)
                }
                if(d.caseParticle){
                    const p=new ABParticle2D({
                        direction:this.rotation+(3.141592/2),
                        life_time:0.4,
                        position:v2.add(
                            this.position,
                            v2.mult(v2.from_RadAngle(this.rotation),d.caseParticle.position)
                        ),
                        sprite:d.caseParticle.frame??"casing_"+d.ammoType,
                        speed:random.float(3,4),
                        angle:0,
                        scale:1,
                        to:{
                            angle:random.float(1,3),
                            scale:0.7
                        }
                    })
                    this.game.particles.add_particle(p)
                }
                break
            }
            case PlayerAnimationType.Reloading:
            case PlayerAnimationType.Healing:
        }
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
                this.sprites!.helmet.frame=this.game.resources.get_sprite(h.idString+"_world")
            }else{
                this.sprites.helmet.frame=undefined
            }
            if(data.full.vest>0){
                this.vest=Armors.getFromNumber(data.full.vest-1)
            }
            this.set_current_weapon(Weapons.valueNumber[data.full.current_weapon])
            if(data.full.animation){
                this.play_animation(data.full.animation!)
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