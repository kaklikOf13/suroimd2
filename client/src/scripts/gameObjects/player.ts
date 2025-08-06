import { PlayerAnimation, PlayerAnimationType, PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CircleHitbox2D, random, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "../../../../common/scripts/definitions/items/equipaments.ts";
import { WeaponDef,Weapons } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import { type Camera2D, Container2D, type Renderer, Sprite2D, type Tween } from "../engine/mod.ts";
import { Debug, GraphicsParticlesConfig } from "../others/config.ts";
import { Decal } from "./decal.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GunDef } from "common/scripts/definitions/items/guns.ts";
import { ABParticle2D } from "../engine/game.ts";
import { ColorM } from "../engine/renderer.ts";
import { SoundInstance } from "../engine/sounds.ts";
import { BackpackDef, Backpacks } from "common/scripts/definitions/items/backpacks.ts";
import {SkinDef, Skins} from "common/scripts/definitions/loadout/skins.ts"
import { DefaultFistRig } from "common/scripts/others/item.ts";
export class Player extends GameObject{
    stringType:string="player"
    numberType: number=1
    zIndex=zIndexes.Players

    vest?:EquipamentDef
    helmet?:EquipamentDef
    backpack?:BackpackDef

    rotation:number=0
    scale:number=1

    parachute:boolean=false

    skin!:string
    container:Container2D=new Container2D()
    sprites={
        body:new Sprite2D(),
        helmet:new Sprite2D(),
        backpack:new Sprite2D(),
        left_arm:new Sprite2D(),
        right_arm:new Sprite2D(),
        weapon:new Sprite2D(),
        muzzle_flash:new Sprite2D(),
        parachute:new Sprite2D(),
    }
    anims:{
        fire?:{
            left_arm?:Tween<Vec2>
            right_arm?:Tween<Vec2>
            weapon?:Tween<Vec2>
        }
    }={}
    sound_animation:{
        weapon:{
            reload?:SoundInstance
            switch?:SoundInstance
        }
    }={weapon:{}}

    current_weapon?:WeaponDef
    dead:boolean=false

    left_handed=false

    on_hitted(position:Vec2){
        if(Math.random()<=0.1){
            const d=new Decal()
            d.sprite.frame=this.game.resources.get_sprite(`blood_decal_${random.int(1,2)}`)
            d.sprite.scale=v2.random(0.7,1.4)
            d.sprite.rotation=random.rad()
            d.sprite.position=v2.duplicate(position)
            this.game.scene.objects.add_object(d,this.layer)
        }
    }

    current_animation?:PlayerAnimation
    driving:boolean=false
    set_driving(driving:boolean){
        if(this.driving||!driving){
            this.driving=driving
            return
        }
        this.set_current_weapon(undefined)
        this.driving=driving
        this.sprites.left_arm.visible=true
        this.sprites.right_arm.visible=true
        this.sprites.left_arm.position=v2.duplicate(DefaultFistRig.left!.position)
        this.sprites.right_arm.position=v2.duplicate(DefaultFistRig.right!.position)
        this.sprites.left_arm.rotation=DefaultFistRig.left!.rotation
        this.sprites.right_arm.rotation=DefaultFistRig.right!.rotation
        this.driving=true
    }

    set_current_weapon(def?:WeaponDef,force:boolean=false){
        if((this.current_weapon===def&&!force)||this.driving)return
        if(!def||this.parachute){
            this.current_weapon=undefined
            this.sprites.left_arm.visible=false
            this.sprites.right_arm.visible=false
            this.sprites.weapon.visible=false
            return
        }
        this.current_weapon=def
        if(def?.arms){
            if(def.arms.left){
                this.sprites.left_arm.visible=true
                this.sprites.left_arm.position=v2.duplicate(def.arms.left.position)
                this.sprites.left_arm.rotation=def.arms.left.rotation
                if(this.left_handed){
                    this.sprites.left_arm.position.y*=-1
                    this.sprites.left_arm.rotation*=-1
                }
                this.sprites.left_arm.zIndex=def.arms.left.zIndex??1
            }else{
                this.sprites.left_arm.visible=false
            }
            if(def.arms.right){
                this.sprites.right_arm.visible=true
                this.sprites.right_arm.position=v2.duplicate(def.arms.right.position)
                this.sprites.right_arm.rotation=def.arms.right.rotation
                if(this.left_handed){
                    this.sprites.right_arm.position.y*=-1
                    this.sprites.right_arm.rotation*=-1
                }
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
            if(this.left_handed&&def.image.left_handed_suport){
                this.sprites.weapon.position.y*=-1
                this.sprites.weapon.rotation*=-1
            }
            this.sprites.weapon.zIndex=def.image.zIndex??2
            this.sprites.weapon.hotspot=def.image.hotspot??v2.new(.5,.5)
        }else{
            this.sprites.weapon.visible=false
        }
        if(Math.random()<=0.5){
            const sound=this.game.resources.get_audio(`${def.idString}_switch`)
            if(sound){
                if(this.sound_animation.weapon.switch)this.sound_animation.weapon.switch.disconnect()
                this.sound_animation.weapon.switch=this.game.sounds.play(sound,{
                on_complete:()=>{
                    this.sound_animation.weapon.switch=undefined
                }
                },"players")
            }
        }
        this.current_animation=undefined
        this.container.updateZIndex()
    }

    set_skin(skin:SkinDef){
        if(this.skin==skin.idString)return
        this.skin=skin.idString

        const bf=skin.frame?.base??(skin.idString+"_body")
        this.sprites.body.frame=this.game.resources.get_sprite(bf)
        const arf=skin.frame?.arm??(skin.idString+"_arm")
        this.sprites.left_arm.frame=this.game.resources.get_sprite(arf)
        this.sprites.right_arm.frame=this.game.resources.get_sprite(arf)

        this.sprites.left_arm.zIndex=1
        this.sprites.right_arm.zIndex=1

        this.sprites.left_arm.visible=false
        this.sprites.right_arm.visible=false

        this.sprites.body.hotspot=v2.new(0.5,0.5)
        this.sprites.helmet.hotspot=v2.new(0.5,0.5)
        this.sprites.backpack.hotspot=v2.new(1,0.5)
        this.sprites.weapon.hotspot=v2.new(0.5,0.5)

        this.sprites.left_arm.hotspot=v2.new(0.9,0.5)
        this.sprites.right_arm.hotspot=v2.new(0.9,0.5)

        this.sprites.backpack.zIndex=3
        this.sprites.body.zIndex=4
        this.sprites.helmet.zIndex=5
        this.sprites.weapon.zIndex=2

        if(!skin.animation?.no){
            if(skin.animation?.frames){
                this.sprites.body.frames=[...skin.animation.frames]
            }else{
                this.sprites.body.frames=[{delay:random.float(3.4,3.6),image:bf},{delay:0.1,image:bf+"_1"}]
            }
        }

        this.container.updateZIndex()

        if(this.current_weapon)this.set_current_weapon(this.current_weapon!,true)
    }

    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.player.playerRadius)
        this.game.camera.addObject(this.container)
        this.sprites.parachute.frame=this.game.resources.get_sprite("parachute")
        this.set_skin(Skins.getFromString("default_skin"))
        if(this.game.activePlayerId===this.id){
            this.game.activePlayer=this
        }
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
        this.container.add_child(this.sprites.backpack)
        this.container.zIndex=zIndexes.Players
        this.container.add_child(this.sprites.left_arm)
        this.container.add_child(this.sprites.right_arm)
        this.container.add_child(this.sprites.helmet)
        this.container.add_child(this.sprites.weapon)
        this.container.add_child(this.sprites.parachute)
        this.sprites.muzzle_flash.visible=false
        this.sprites.muzzle_flash.hotspot=v2.new(0,.5)
        this.sprites.muzzle_flash.zIndex=6
        this.sprites.parachute.zIndex=7
        this.sprites.parachute.hotspot=v2.new(0.5,0.5)
        this.sprites.backpack.position=v2.new(-0.27,0)
        this.sprites.backpack.scale=v2.new(1.34,1.34)
        this.container.add_child(this.sprites.muzzle_flash)
    }
    play_animation(animation:PlayerAnimation){
        if(this.current_animation!==undefined)return
        this.current_animation=animation
        this.sprites.muzzle_flash.visible=false
        switch(this.current_animation.type){
            case PlayerAnimationType.Shooting:{
                if((this.current_weapon as unknown as GameItem).item_type!==InventoryItemType.gun){this.current_animation=undefined;break}
                const d=this.current_weapon as GunDef
                const dur=Math.min(d.fireDelay*0.9,0.1)
                if(d.recoil&&!this.anims.fire){
                    const w=0.05
                    this.anims.fire={
                        weapon:this.game.addTween({
                            target:this.sprites.weapon.position,
                            duration:dur,
                            to:v2.sub(this.sprites.weapon.position,v2.new(w,0)),
                            yoyo:true,
                            onComplete:()=>{
                                this.current_animation=undefined
                                this.anims.fire=undefined
                            }
                        }),
                        left_arm:this.game.addTween({
                            target:this.sprites.left_arm.position,
                            duration:dur,
                            to:v2.sub(this.sprites.left_arm.position,v2.new(w,0)),
                            yoyo:true,
                        }),
                        
                        right_arm:this.game.addTween({
                            target:this.sprites.right_arm.position,
                            duration:dur,
                            to:v2.sub(this.sprites.right_arm.position,v2.new(w,0)),
                            yoyo:true,
                        })
                    }
                }
                if(d.muzzleFlash&&!this.sprites.muzzle_flash.visible){
                    this.sprites.muzzle_flash.frame=this.game.resources.get_sprite(d.muzzleFlash.sprite)
                    this.sprites.muzzle_flash.position=v2.new(d.lenght,0)
                    
                    this.sprites.muzzle_flash.visible=true
                    this.game.addTimeout(()=>{
                        this.sprites.muzzle_flash.visible=false
                    },dur)
                }
                if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsParticlesConfig.Advanced){
                    if(d.caseParticle&&!d.caseParticle.at_begin){
                        const p=new ABParticle2D({
                            direction:this.rotation+(3.141592/2),
                            life_time:0.4,
                            position:v2.add(
                                this.position,
                                v2.mult(v2.from_RadAngle(this.rotation),d.caseParticle.position)
                            ),
                            frame:{
                                image:d.caseParticle.frame??"casing_"+d.ammoType,
                                hotspot:v2.new(.5,.5)
                            },
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
                    if(d.gasParticles){
                        for(let i=0;i<d.gasParticles.count;i++){
                            const p=new ABParticle2D({
                                direction:this.rotation+random.float(-d.gasParticles.direction_variation,d.gasParticles.direction_variation),
                                life_time:d.gasParticles.life_time,
                                position:v2.add(
                                    this.position,
                                    v2.mult(v2.from_RadAngle(this.rotation),v2.new(d.lenght,d.lenght))
                                ),
                                
                                frame:{
                                    image:"gas_smoke_particle",
                                    hotspot:v2.new(.5,.5)
                                },
                                speed:random.float(d.gasParticles.speed.min,d.gasParticles.speed.max),
                                scale:0.03,
                                tint:ColorM.hex("#fff5"),
                                to:{
                                tint:ColorM.hex("#fff0"),
                                    scale:random.float(d.gasParticles.size.min,d.gasParticles.size.max)
                                }
                            })
                            this.game.particles.add_particle(p)
                        }
                }
                }
                const sound=this.game.resources.get_audio(`${d.idString}_fire`)
                if(sound){
                    this.game.sounds.play(sound,{},"players")
                }
                break
            }
            case PlayerAnimationType.Reloading:{
                if((this.current_weapon as unknown as GameItem).item_type!==InventoryItemType.gun){this.current_animation=undefined;break}
                const d=this.current_weapon as GunDef
                
                const sound=this.game.resources.get_audio((d.reload?.reload_alt&&this.current_animation.alt_reload)?`${d.idString}_reload_alt`:`${d.idString}_reload`)
                if(sound){
                    if(this.sound_animation.weapon.reload)this.sound_animation.weapon.reload.stop()
                    this.sound_animation.weapon.reload=this.game.sounds.play(sound,{on_complete:()=>{
                        this.current_animation=undefined
                        this.sound_animation.weapon.reload=undefined
                    }},"players")
                }
                break
            }
            case PlayerAnimationType.Healing:
        }
    }
    set_helmet(helmet:number){
        if(this.helmet&&helmet-1===this.helmet.idNumber!)return
        if(helmet>0){
            this.helmet=Armors.getFromNumber(helmet-1)
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
    }
    set_backpack(backpack:number){
        if(this.backpack&&backpack===this.backpack.idNumber!)return
        this.backpack=Backpacks.getFromNumber(backpack)
        if(this.backpack.no_world_image){
            this.sprites.backpack.frame=undefined
        }else{
            this.sprites!.backpack.frame=this.game.resources.get_sprite(this.backpack.idString+"_world")
        }
    }
    broke_shield(){
        for(let p=0;p<14;p++){
            const a=random.rad()
            this.game.particles.add_particle(new ABParticle2D({
                direction:random.rad(),
                life_time:0.5+(Math.random()*0.5),
                position:this.position,
                speed:7,
                scale:random.float(2,3),
                frame:{
                    image:"shield_part"
                },
                angle:a,
                tint:ColorM.rgba(255,255,255,255),
                to:{
                tint:ColorM.rgba(255,255,255,0),
                    scale:0.3,
                    angle:random.float(-10,10),
                    speed:5,
                }
            }))
        }
        
        this.game.particles.add_particle(new ABParticle2D({
            direction:0,
            life_time:0.4,
            position:this.position,
            speed:0,
            scale:0.1,
            frame:{
                image:"shockwave",
                hotspot:v2.new(.5,.5)
            },
            tint:ColorM.rgba(255,255,255,255),
            to:{
            tint:ColorM.rgba(255,255,255,0),
                scale:10,
            }
        }))
    }
    override updateData(data:PlayerData){
        if(data.dead&&!this.dead){
            this.dead=data.dead
            this.container.destroy()
        }
        this.left_handed=data.left_handed
        if(data.parachute){
            this.set_current_weapon(undefined)
            this.sprites.parachute.visible=true
            const s=this.scale+(1*data.parachute.value)
            this.container.scale=v2.new(s,s)
            this.parachute=true
            this.container.zIndex=zIndexes.ParachutePlayers+(0.9*data.parachute.value)
        }else{
            this.sprites.parachute.visible=false
            this.parachute=false
            this.container.zIndex=zIndexes.Players
        }
        if(data.full){
            this.set_helmet(data.full.helmet)
            this.set_backpack(data.full.backpack)
            this.set_skin(Skins.getFromNumber(data.full.skin))
            if(data.full.vest>0){
                this.vest=Armors.getFromNumber(data.full.vest-1)
            }

            this.set_current_weapon(Weapons.valueNumber[data.full.current_weapon])
            if(data.full.animation){
                this.play_animation(data.full.animation!)
            }else{
                this.current_animation=undefined
            }
        }
        this.set_driving(data.driving)
        this.position=data.position
        this.rotation=data.rotation

        this.container.rotation=this.rotation

        this.manager.cells.updateObject(this)

        if(this.id===this.game.activePlayerId){
            this.game.update_camera()
            this.sprites.parachute.tint=ColorM.rgba(255,255,255,100)
            if(data.full){
                this.game.guiManager.update_equipaments()
            }
            if(data.parachute){
                this.game.camera.zoom=this.game.scope_zoom-(0.5*data.parachute.value)
            }
            this.game.guiManager.update_hint({
                driving:this.driving,
                gun:!this.driving&&((this.current_weapon&&(this.current_weapon as unknown as GameItem).item_type===InventoryItemType.gun)??false)
            })
        }
    }
}