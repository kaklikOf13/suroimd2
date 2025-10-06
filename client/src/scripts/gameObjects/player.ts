import { PlayerAnimation, PlayerAnimationType, PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CircleHitbox2D, KeyFrameSpriteDef, model2d, random, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { Armors, EquipamentDef } from "../../../../common/scripts/definitions/items/equipaments.ts";
import { WeaponDef,Weapons } from "common/scripts/definitions/alldefs.ts";
import { GameObject } from "../others/gameObject.ts";
import { AnimatedContainer2D, type Camera2D, Light2D, type Renderer, Sprite2D, type Tween } from "../engine/mod.ts";
import { GraphicsDConfig } from "../others/config.ts";
import { Decal } from "./decal.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { DualAdditional, GunDef, Guns } from "common/scripts/definitions/items/guns.ts";
import { ABParticle2D, ClientGame2D, type ClientParticle2D } from "../engine/game.ts";
import { ColorM } from "../engine/renderer.ts";
import { SoundInstance } from "../engine/sounds.ts";
import { BackpackDef, Backpacks } from "common/scripts/definitions/items/backpacks.ts";
import {SkinDef, Skins} from "common/scripts/definitions/loadout/skins.ts"
import { DefaultFistRig } from "common/scripts/others/item.ts";
import { Consumibles } from "common/scripts/definitions/items/consumibles.ts";
import { ParticlesEmitter2D} from "common/scripts/engine/particles.ts";
import { Boosts } from "common/scripts/definitions/player/boosts.ts";
import { ease, Numeric } from "common/scripts/engine/utils.ts";
import { type Loot } from "./loot.ts";
import { type Obstacle } from "./obstacle.ts";
import { EmoteDef } from "common/scripts/definitions/loadout/emotes.ts";
import { Container2D } from "../engine/container_2d.ts";
import { MeleeDef, Melees } from "common/scripts/definitions/items/melees.ts";
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
    container!:AnimatedContainer2D
    sprites!:{
        body:Sprite2D,
        mounth:Sprite2D,
        helmet:Sprite2D,
        backpack:Sprite2D,
        left_arm:Sprite2D,
        right_arm:Sprite2D,
        weapon:Sprite2D,
        weapon2:Sprite2D,
        muzzle_flash:Sprite2D,
        parachute:Sprite2D,

        emote_container:Container2D,
        emote_bg:Sprite2D,
        emote_sprite:Sprite2D
    }
    anims:{
        fire?:{
            left_arm?:Tween<Vec2>
            right_arm?:Tween<Vec2>
            weapon?:Tween<Vec2>
        },
        muzzle_flash_light?:Light2D
        consumible_particle:string
        consumible_particles?:ParticlesEmitter2D<ClientParticle2D>
        mount_anims:KeyFrameSpriteDef[]
        mount_open:string
        emote?:Tween<Vec2>
    }={consumible_particle:"healing_particle",mount_anims:[],mount_open:""}
    sound_animation:{
        animation?:SoundInstance
        weapon:{
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

    set_current_weapon(def?:WeaponDef,force:boolean=false,reset:boolean=true){
        if((this.current_weapon===def||this.driving)&&!force)return
        if(reset)this.reset_anim()
        this.sprites.weapon2.visible=false
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
            this.sprites.weapon.visible=true
            this.sprites.weapon.scale=v2.new(1,1)
            this.sprites.weapon.position=v2.duplicate(def.image.position)
            this.sprites.weapon.rotation=def.image.rotation
            if(this.left_handed&&def.image.left_handed_suport){
                this.sprites.weapon.position.y*=-1
                this.sprites.weapon.rotation*=-1
            }
            this.sprites.weapon.zIndex=def.image.zIndex??2
            this.sprites.weapon.hotspot=def.image.hotspot??v2.new(.5,.5)
            if((def as GunDef).dual_from&&(def as unknown as GameItem).item_type===InventoryItemType.gun){
                const df=Guns.getFromString((def as GunDef).dual_from!)
                this.sprites.weapon2.visible=true
                this.sprites.weapon2.scale=v2.new(1,1)
                this.sprites.weapon2.position=v2.duplicate(def.image.position)
                this.sprites.weapon2.rotation=def.image.rotation
                this.sprites.weapon2.zIndex=def.image.zIndex??2
                this.sprites.weapon2.hotspot=def.image.hotspot??v2.new(.5,.5)
                this.sprites.weapon.position.y+=(def as GunDef&DualAdditional).dual_offset!

                this.sprites.left_arm.visible=true
                this.sprites.right_arm.visible=true
                this.sprites.left_arm.position=v2.new(DefaultFistRig.left!.position.x,-(def as GunDef&DualAdditional).dual_offset!)
                this.sprites.right_arm.position=v2.new(DefaultFistRig.right!.position.x,(def as GunDef&DualAdditional).dual_offset!)
                this.sprites.left_arm.rotation=0
                this.sprites.right_arm.rotation=0

                this.sprites.weapon2.position.y-=(def as GunDef&DualAdditional).dual_offset!
                this.sprites.weapon.frame=this.game.resources.get_sprite(`${df.idString}_world`)
                this.sprites.weapon2.frame=this.game.resources.get_sprite(`${df.idString}_world`)
            }else{
                this.sprites.weapon.frame=this.game.resources.get_sprite((def as unknown as GameItem).item_type===InventoryItemType.melee?def.idString:`${def.idString}_world`)
            }
        }else{
            this.sprites.weapon.visible=false
        }
        if(!force){
            const sound=this.game.resources.get_audio(`${def.idString}_switch`)
            if(this.sound_animation.weapon.switch)this.sound_animation.weapon.switch.stop()
            if(sound){
                this.sound_animation.weapon.switch=this.game.sounds.play(sound,{
                    on_complete:()=>{
                        this.sound_animation.weapon.switch=undefined
                    },
                    volume:0.4,
                    position:this.position,
                    delay:400,
                    max_distance:5
                },"players")
            }
        }
        this.container.updateZIndex()
    }
    set_skin(skin:SkinDef){
        if(this.skin==skin.idString)return
        this.skin=skin.idString

        const bf=skin.frame?.base??(skin.idString+"_body")
        this.sprites.body.frame=this.game.resources.get_sprite(bf)
        const arf=skin.frame?.arm??(skin.idString+"_arm")
        this.sprites.left_arm.frame=
        this.sprites.right_arm.frame=this.game.resources.get_sprite(arf)

        this.sprites.left_arm.zIndex=1
        this.sprites.right_arm.zIndex=1

        this.sprites.left_arm.visible=false
        this.sprites.right_arm.visible=false

        this.sprites.body.hotspot=v2.new(0.5,0.5)
        this.sprites.helmet.hotspot=v2.new(0.5,0.5)
        this.sprites.backpack.hotspot=v2.new(1,0.5)
        this.sprites.weapon.hotspot=v2.new(0.5,0.5)

        this.sprites.left_arm.hotspot=v2.new(1,0.5)
        this.sprites.right_arm.hotspot=v2.new(1,0.5)

        this.sprites.weapon.zIndex=2

        const ms1=skin.frame?.mount?.normal??"player_mounth_1_1"
        const ms2=skin.frame?.mount?.closed??"player_mounth_1_2"
        this.anims.mount_open=ms2
        this.sprites.mounth.frame=this.game.resources.get_sprite(ms1)
        this.anims.mount_anims.length=0
        if(!skin.animation?.no_auto_talk){
            this.anims.mount_anims.push({delay:random.float(8,14),image:ms1})
            const c=random.int(10,20)
            for(let i=0;i<c;i++){
                this.anims.mount_anims.push(
                    {delay:0.15,image:ms1},
                    {delay:0.15,image:ms2}
                )
            }
            this.anims.mount_anims.push({delay:random.float(1,5),image:ms1})
        }
        this.sprites.mounth.frames=this.anims.mount_anims
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
        this.container=new AnimatedContainer2D(this.game as unknown as ClientGame2D)
        //#region AA
        this.sprites={
            body:this.container.add_animated_sprite("body",{scale:1.333333,zIndex:4}),
            mounth:this.container.add_animated_sprite("mounth",{hotspot:v2.new(0.3,0.5),scale:1.4,position:v2.new(0.3,0),zIndex:4}),
            backpack:this.container.add_sprite("backpack",{position:v2.new(-0.27,0),scale:1.34,zIndex:3}),
            helmet:this.container.add_sprite("helmet",{zIndex:5}),
            left_arm:this.container.add_sprite("left_arm"),
            right_arm:this.container.add_sprite("right_arm"),
            muzzle_flash:this.container.add_sprite("muzzle_flash",{visible:false,zIndex:6,hotspot:v2.new(0,.5)}),
            parachute:this.container.add_sprite("parachute",{zIndex:7,hotspot:v2.new(0.5,0.5)}),
            weapon:this.container.add_sprite("weapon"),
            weapon2:this.container.add_sprite("weapon2"),

            emote_container:new Container2D(),
            emote_bg:new Sprite2D(),
            emote_sprite:new Sprite2D()
        }
        this.anims.consumible_particles=this.game.particles.add_emiter({
            delay:0.5,
            particle:()=>new ABParticle2D({
                direction:-3.141592/2,
                frame:{
                    image:this.anims.consumible_particle,
                },
                life_time:random.float(2,3),
                position:v2.add(this.position,v2.new(random.float((this.hb as CircleHitbox2D).radius*-0.8,(this.hb as CircleHitbox2D).radius*0.8),0)),
                speed:1,
                scale:2,
                to:{
                    tint:{r:1,g:1,b:1,a:0}
                }
            }),
            enabled:false
        })
        this.container.zIndex=zIndexes.Players
        this.container.add_child(this.sprites.muzzle_flash)
        //#endregion
        this.game.camera.addObject(this.container)
        this.sprites.parachute.frame=this.game.resources.get_sprite("parachute")
        this.set_skin(Skins.getFromString("default_skin"))
        if(this.game.activePlayerId===this.id){
            this.game.activePlayer=this
        }

        this.sprites.emote_container.sync_rotation=false
        this.container.add_child(this.sprites.emote_container)
        this.sprites.emote_container.position=v2.new(0,-1.5)
        this.sprites.emote_container.add_child(this.sprites.emote_bg)
        this.sprites.emote_container.add_child(this.sprites.emote_sprite)
        this.sprites.emote_container.visible=false
        this.sprites.emote_bg.set_frame({
            image:"emote_background",
            hotspot:v2.new(.5,.5),
            scale:1.5
        },this.game.resources)
        this.sprites.emote_sprite.transform_frame({
            hotspot:v2.new(.5,.5),
            scale:2.6
        })
    }
    current_interaction?:Loot|Obstacle|undefined
    update(dt:number): void {
        this.attacking-=dt
        if(this.dest_pos){
            this.position=v2.lerp(this.position,this.dest_pos,this.game.inter_global)
        }
        if(this.dest_rot){
            this.rotation=Numeric.lerp_rad(this.rotation,this.dest_rot!,this.game.inter_global)
        }
        this.container.position=this.position
        this.container.rotation=this.rotation
        this.manager.cells.updateObject(this)
        const objs=this.manager.cells.get_objects(this.hb,this.layer)
        this.current_interaction=undefined
        if(this.emote_time<2.5){
            this.emote_time+=dt
        }else{
            this.anims.emote=this.game.addTween({
                target:this.sprites.emote_container.scale,
                duration:0.8,
                to:{
                    x:0,
                    y:0
                },
                onComplete:()=>{
                    if(this.emote_time<2.5)return
                    this.sprites.emote_container.visible=false
                    this.anims.emote=undefined
                },
                ease:ease.circOut
            })
        }
        if(this.game.activePlayerId===this.id){
            this.game.guiManager.state.loot=false
            this.game.guiManager.state.interact=false
            this.game.guiManager.state.information_box_message=""
            for(const o of objs){
                if(this.hb.collidingWith(o.hb)){
                    switch(o.stringType){
                        case "loot":{
                            this.game.guiManager.state.loot=true
                            this.game.guiManager.state.information_box_message=`Take ${(o as Loot).item.idString}${(o as Loot).count>1?`(${(o as Loot).count})`:""}`
                            break
                        }
                        case "obstacle":{
                            if((o as Obstacle).def.interactDestroy&&!(o as Obstacle).dead){
                                this.game.guiManager.state.interact=true
                                this.game.guiManager.state.information_box_message=`Break`
                            }
                            break
                        }
                    }
                }
                if(this.game.guiManager.state.loot||this.game.guiManager.state.interact){
                    this.current_interaction=o
                    break
                }
            }
        }
    }
    override onDestroy(): void {
        this.anims.consumible_particles!.destroyed=true
        this.container.destroy()
    }
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
        /*if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_player"),camera.visual_position)
        }*/
    }
    constructor(){
        super()
    }
    reset_anim(){
        this.sprites.muzzle_flash.visible=false
        this.current_animation=undefined
        if(this.sound_animation.animation)this.sound_animation.animation.stop()
        if(!this.sprites.mounth.frames&&this.anims.mount_anims){
            this.sprites.mounth.frames=this.anims.mount_anims
            this.sprites.mounth.current_delay=1000
        }
        this.sound_animation.animation=undefined
        this.anims.consumible_particles!.enabled=false
        this.attacking=0
        this.container.stop_all_animations()
    }
    emote_time:number=0
    add_emote(emote:EmoteDef){
        this.game.sounds.play(this.game.resources.get_audio("emote_play"),{},"players")
        this.sprites.emote_container.visible=true
        this.emote_time=0
        this.sprites.emote_sprite.frame=this.game.resources.get_sprite(emote.idString)
        this.sprites.emote_container.scale=v2.new(0,0)
        if(this.anims.emote)this.anims.emote.kill()
        this.game.addTween({
            target:this.sprites.emote_container.scale,
            duration:0.9,
            to:{
                x:1,
                y:1
            },
            ease:ease.elasticOut
        })
    }
    play_animation(animation:PlayerAnimation){
        if(this.current_animation!==undefined)return
        this.reset_anim()
        this.current_animation=animation
        switch(this.current_animation.type){
            case PlayerAnimationType.Reloading:{
                if((this.current_weapon as unknown as GameItem).item_type!==InventoryItemType.gun){this.current_animation=undefined;break}
                const d=this.current_weapon as GunDef
                
                const sound=this.game.resources.get_audio((d.reload?.reload_alt&&this.current_animation.alt_reload)?`${d.idString}_reload_alt`:`${d.idString}_reload`)
                if(sound){
                    if(this.sound_animation.animation)this.sound_animation.animation.stop()
                    this.sound_animation.animation=this.game.sounds.play(sound,{
                        on_complete:()=>{
                            this.reset_anim()
                        },
                        position:this.position,
                        max_distance:5,
                        volume:0.4
                    },"players")
                }
                this.attacking=0.5
                break
            }
            case PlayerAnimationType.Consuming:{
                const def=Consumibles.getFromNumber(this.current_animation.item)
                const sound=this.game.resources.get_audio((def.sounds?.using)??`using_${def.idString}`)
                if(sound){
                    if(def.drink){
                        this.sprites.mounth.frames=undefined
                        this.sprites.mounth.frame=this.game.resources.get_sprite(this.anims.mount_open)
                    }
                    this.sound_animation.animation=this.game.sounds.play(sound,{
                        position:this.position,
                        max_distance:5,
                        volume:0.7,
                        on_complete:()=>{
                            this.set_current_weapon(this.current_weapon,true)
                        }
                    },"players")
                }
                if(def.frame?.using_particle){
                    this.anims.consumible_particle=def.frame.using_particle
                }if(def.boost_type){
                    this.anims.consumible_particle=`boost_${Boosts[def.boost_type].name}_particle`
                }else{
                    this.anims.consumible_particle="healing_particle"
                }
                this.anims.consumible_particles!.enabled=true
                if(def.animation){
                    this.container.play_animation(def.animation,()=>{
                        this.current_animation=undefined
                        this.set_current_weapon.bind(this,this.current_weapon,true,!sound)
                    })
                }
                break
            }
            case PlayerAnimationType.Melee:{
                const def=this.current_weapon as MeleeDef
                if(def.animation){
                    this.container.play_animation(def.animation,()=>{
                        this.current_animation=undefined
                    })
                }
                break
            }
        }
    }
    attacking=0
    attack(){
        if(this.attacking>0)return
        if((this.current_weapon as unknown as GameItem).item_type!==InventoryItemType.gun){
            this.current_animation=undefined
            return
        }
        const d=this.current_weapon as GunDef
        const dur=Math.min(d.fireDelay*0.9,0.1)
        this.attacking=d.fireDelay+0.2
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
            if(this.anims.muzzle_flash_light)this.anims.muzzle_flash_light.destroyed=true
            this.anims.muzzle_flash_light=this.game.light_map.addLight(this.sprites.muzzle_flash._real_position,model2d.circle(1),ColorM.hex("#ff0"))
            this.sprites.muzzle_flash.position=v2.new(d.lenght,0)
            
            this.sprites.muzzle_flash.visible=true
            this.game.addTimeout(()=>{
                this.anims.muzzle_flash_light!.destroyed=true
                this.sprites.muzzle_flash.visible=false
            },dur)
        }
        if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsDConfig.Advanced){
            if(d.caseParticle&&!d.caseParticle.at_begin){
                const p=new ABParticle2D({
                    direction:this.rotation+(3.141592/2),
                    life_time:0.4,
                    position:v2.add(
                        this.position,
                        v2.rotate_RadAngle(d.caseParticle.position,this.rotation)
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
        const sound=this.game.resources.get_audio(`${d.dual_from??d.idString}_fire`)
        if(sound){
            this.game.sounds.play(sound,{
                volume:0.4,
                position:this.position,
                max_distance:7
            },"players")
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
        if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsDConfig.Advanced){
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
        }
        if(this.game.save.get_variable("cv_graphics_particles")>=GraphicsDConfig.Normal){
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
        const sound=this.game.resources.get_audio(`shield_break`)
        if(sound){
            this.game.sounds.play(sound,{
                volume:0.4,
                position:this.position,
                max_distance:7
            },"players")
        }
    }
    dest_pos?:Vec2
    dest_rot?:number
    override updateData(data:PlayerData){
        if(data.emote){
            this.add_emote(data.emote)
        }
        if(data.dead&&!this.dead){
            this.dead=data.dead
            this.container.destroy()
        }
        if(data.attacking){
            this.attack()
        }
        this.left_handed=data.left_handed
        if(data.parachute&&!data.driving){
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
            this.position=data.position
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
        if(this.game.save.get_variable("cv_game_interpolation")){
            this.dest_pos=data.position
            if(!(this.id===this.game.activePlayerId&&this.game.save.get_variable("cv_game_client_rot"))){
                this.dest_rot=data.rotation
            }
        }else{
            this.position=data.position
            if(!(this.id===this.game.activePlayerId&&this.game.save.get_variable("cv_game_client_rot"))){
                this.rotation=data.rotation
            }
        }
            
        if(this.id===this.game.activePlayerId){
            this.game.update_camera()
            this.game.sounds.listener_position=this.position
            this.sprites.parachute.tint=ColorM.rgba(255,255,255,100)
            if(data.full){
                this.game.guiManager.update_equipaments()
            }
            this.game.guiManager.state.driving=this.driving
            this.game.guiManager.state.gun=!this.driving&&this.current_weapon!==undefined&&Guns.exist(this.current_weapon.idString)
        }
    }
}