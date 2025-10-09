import { CircleHitbox2D, Client, NullVec2, Numeric, RectHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket, InputAction, InputActionType } from "common/scripts/packets/action_packet.ts"
import { PlayerAnimation, PlayerData } from "common/scripts/others/objectsEncode.ts";
import { ActionsType, GameConstants, GameOverPacket } from "common/scripts/others/constants.ts";
import { GInventory,GunItem,LItem} from "../player/inventory.ts";
import { DamageSplash, UpdatePacket } from "common/scripts/packets/update_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { ActionsManager } from "common/scripts/engine/inventory.ts";
import { DamageReason, GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type EquipamentDef } from "common/scripts/definitions/items/equipaments.ts";
import { DamageSourceDef, DamageSources, GameItems, Weapons } from "common/scripts/definitions/alldefs.ts";
import { type PlayerModifiers } from "common/scripts/others/constants.ts";
import { AccessoriesManager } from "../player/accesories.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Loot } from "./loot.ts";
import { Ammos } from "common/scripts/definitions/items/ammo.ts";
import { type Group, type Team } from "../others/teams.ts";
import { KillFeedMessageType } from "common/scripts/packets/killfeed_packet.ts";
import {SkinDef, Skins} from "common/scripts/definitions/loadout/skins.ts"
import { type VehicleSeat } from "./vehicle.ts";
import { Floors, FloorType } from "common/scripts/others/terrain.ts";
import { BoostDef, Boosts, BoostType } from "common/scripts/definitions/player/boosts.ts";
import { EffectInstance, Effects, SideEffect, SideEffectType } from "common/scripts/definitions/player/effects.ts";
import { BotAi } from "../player/simple_bot_ai.ts";
import { EmoteDef, Emotes } from "common/scripts/definitions/loadout/emotes.ts";
import { GunDef } from "common/scripts/definitions/items/guns.ts";
import { ProjectileDef } from "common/scripts/definitions/objects/projectiles.ts";
import { Explosions } from "common/scripts/definitions/objects/explosions.ts";

export class Player extends ServerGameObject{
    oldPosition:Vec2
    stringType:string="player"
    numberType: number=1
    name:string=""
    rotation:number=0
    recoil?:{speed:number,delay:number}

    skin:SkinDef=Skins.getFromString("default_skin")
    loadout={
        skin:"default_skin",
        badge:"stone_1_badge",
        emotes:{
            die:"emote_sad",
        }
    }
    parachute?:{
        value:number
    }
    seat?:VehicleSeat

    health:number=100
    maxHealth:number=100

    boost:number=0
    maxBoost:number=100
    boost_def:BoostDef=Boosts[BoostType.Null]

    actions:ActionsManager<this>

    client?:Client
    is_npc:boolean=false
    is_bot:boolean=false

    inventory:GInventory

    using_healing_speed:number=0.4

    vest?:EquipamentDef
    helmet?:EquipamentDef
    accessories:AccessoriesManager

    status={
        damage:0,
        kills:0,
        rank:0,
    }
    earned={
        coins:0,
        xp:0,
        score:0,
    }
    username:string=""
    
    current_animation?:PlayerAnimation

    pvpEnabled:boolean=false

    team?:Team
    teamId?:number

    group?:Group
    groupId?:number

    push_vorce:Vec2=v2.new(0,0)

    left_handed:boolean

    current_floor:FloorType=0

    boost_t:number=0

    friendly_fire:boolean=true
    alternative_vehicle_control:boolean=true

    input={
        movement:v2.new(0,0),
        rotation:0,
        using_item:false,
        using_item_down:false,
        interaction:false,
        reload:false,
        swamp_guns:false,
        attacking:false,

        aim_speed:0,

        actions:[] as InputAction[],

        emote:undefined as EmoteDef|undefined,
        is_mobile:false
    }

    projectile_holding?:{
        def:ProjectileDef
        time:number
    }

    ai?:BotAi
    constructor(){
        super()
        this.oldPosition=this.position
        this.inventory=new GInventory(this)

        this.actions=new ActionsManager(this)

        this.left_handed=false

        this.accessories=new AccessoriesManager(this,3)
    }
    interact(user: Player): void {
        if(!this.downed||user.teamId===undefined||(user.teamId!==this.teamId&&(user.groupId===undefined||user.groupId!==this.groupId)))return
        this.revive()
    }

    dead=false
    downed=false
    connected=false

    invensibility_time:number=0
    imortal:boolean=false

    downedBy?:Player
    downedBySource?:DamageSourceDef

    modifiers:PlayerModifiers={
        boost:1,
        bullet_size:1,
        bullet_speed:1,
        damage:1,
        health:1,
        speed:1,
        critical_mult:1,
        luck:1,
        mana_consume:1,
    }

    effects:Map<number,EffectInstance>=new Map()

    privateDirtys={
        inventory:true,
        weapons:true,
        current_weapon:true,
        action:true,
        oitems:true,
    }

    apply_modifiers(mods:Partial<PlayerModifiers>){
        this.modifiers.boost*=mods.boost??1
        this.modifiers.bullet_size*=mods.bullet_size??1
        this.modifiers.bullet_speed*=mods.bullet_speed??1
        this.modifiers.damage*=mods.damage??1
        this.modifiers.health*=mods.health??1
        this.modifiers.speed*=mods.speed??1
    }

    update_modifiers(){
        this.modifiers.damage=this.modifiers.speed=this.modifiers.mana_consume=this.modifiers.health=this.modifiers.boost=this.modifiers.bullet_speed=this.modifiers.bullet_size=this.modifiers.critical_mult=1
        const gamemode=this.game.gamemode
        if(this.boost_def.type===BoostType.Addiction){
            this.modifiers.damage+=(1-(this.boost/this.maxBoost))*gamemode.player.boosts.addiction.damage
        }

        for(const acc of this.accessories.slots){
            if(acc.item){
                this.apply_modifiers(acc.item.modifiers)
            }
        }

        for(const e of this.effects.values()){
            for(const sf of e.effect.side_effects){
                if(sf.type===SideEffectType.Modify){
                    this.apply_modifiers(sf.modify)
                }
            }
        }

        this.maxHealth=100*this.modifiers.health
        this.maxBoost=100*this.modifiers.boost

        this.health=Math.min(this.health,this.maxHealth)
    }
    side_effect(sf:SideEffect){
        switch(sf.type){
            case SideEffectType.AddEffect:{
                const def=Effects.getFromString(sf.effect)
                if(this.effects.has(def.idNumber!)){
                    this.effects.get(def.idNumber!)!.time+=sf.duration
                }else{
                    this.effects.set(def.idNumber!,{
                        effect:def,
                        tick_time:0,
                        time:sf.duration
                    })
                }
                break
            }
            case SideEffectType.Damage:
                this.piercingDamage({
                    amount:sf.amount,
                    critical:false,
                    position:this.position,
                    reason:DamageReason.SideEffect,
                })
                break
            case SideEffectType.Heal:
                if(sf.health){
                    this.health=Math.min(this.health+sf.health.amount,this.maxHealth*(sf.health.max??1))
                }
                if(sf.boost){
                    if(this.boost_def.type===sf.boost.def.type){
                        this.boost=Math.min(this.boost+sf.boost.amount,this.maxBoost*(sf.boost.max??1))
                    }else{
                        this.boost_def=sf.boost.def
                        this.boost=sf.boost.amount
                    }
                }
                if(sf.global){
                    if(this.health<this.maxHealth){
                        this.health=Math.min(this.health+sf.global.amount,this.maxHealth)
                    }else if(this.boost>0&&!sf.boost){
                        this.boost=Math.min(this.boost+sf.global.amount,this.maxBoost)
                    }else if(this.boost_def.type===sf.global.boost?.type){
                        this.boost=Math.min(this.boost+sf.global.amount,this.maxBoost)
                    }else if(sf.global.boost){
                        this.boost=Math.min(sf.global.amount,this.maxBoost)
                        this.boost_def=sf.global.boost
                    }
                }
                break
            case SideEffectType.Parachute:
                this.parachute={
                    value:1
                }
                this.seat?.clear_player()
                break
        }
    }

    throw_using_projectile(){
        if(!this.projectile_holding)return
        const proj=this.game.add_projectile(this.position,this.projectile_holding!.def,this,this.layer)
        proj.throw_projectile(this.rotation,(this.projectile_holding!.def.throw_max_speed??5)*this.input.aim_speed)
        proj.fuse_delay=this.projectile_holding.time
        this.projectile_holding=undefined
    }

    update(dt:number): void {
        if(this.dead)return
        //Movement
        const gamemode=this.game.gamemode
        let speed=1*(this.recoil?this.recoil.speed:1)
                  * (this.actions.current_action&&this.actions.current_action.type===ActionsType.Consuming?this.using_healing_speed:1)
                  * (this.inventory.currentWeaponDef?.speed_mod??1)
                  * this.modifiers.speed
                  * (this.downed?0.4:1)
                  * (this.parachute?1:((Floors[this.current_floor].speed_mult??1)))
                  * (this.projectile_holding?0.7:1)
        if(this.recoil){
            this.recoil.delay-=dt
            this.current_animation=undefined
            if(this.recoil.delay<=0)this.recoil=undefined
        }
        switch(this.boost_def.type){
            case BoostType.Shield:
                break
            case BoostType.Adrenaline:
                speed*=1+(gamemode.player.boosts.adrenaline.speed*(this.boost/this.maxBoost))
                this.boost=Math.max(this.boost-gamemode.player.boosts.adrenaline.decay*dt,0)
                this.health=Math.min(this.health+(this.boost*dt)*gamemode.player.boosts.adrenaline.regen,this.maxHealth)
                break
            case BoostType.Mana:
                this.boost=Numeric.lerp(this.boost,this.maxBoost,gamemode.player.boosts.mana.regen*dt)
                break
            case BoostType.Addiction:{
                speed*=1+(gamemode.player.boosts.addiction.speed*(this.boost/this.maxBoost))
                this.boost=Math.max(this.boost-gamemode.player.boosts.addiction.decay*dt,0)
                if(this.boost_t<=0){
                    this.boost_t=3
                    this.piercingDamage({
                        amount:((this.maxBoost/this.boost)*gamemode.player.boosts.addiction.abstinence)*100,
                        reason:DamageReason.Abstinence,
                        position:v2.duplicate(this.position),
                        critical:false,
                    })
                }else{
                    this.boost_t-=dt
                }
                break
            }
        }
        for(const e of this.effects.values()){
            e.tick_time-=dt
            e.time-=dt
            if(e.tick_time<=0){
                for(const sf of e.effect.side_effects){
                    this.side_effect(sf)
                }
                e.tick_time=2
            }
            if(e.time<0){
                this.effects.delete(e.effect.idNumber!)
            }
        }
        if(this.seat){
            if(this.seat.rotation!==undefined)this.rotation=this.seat.rotation
            if(this.seat.pillot)this.seat.vehicle.move(this.input.movement,this.input.reload,dt,this.alternative_vehicle_control)
        }else{
            this.position=v2.add(this.position,v2.add(v2.scale(this.input.movement,5*speed*dt),v2.scale(this.push_vorce,dt)))
            this.rotation=this.input.rotation
            if(this.parachute){
                speed*=1.7+(0.5+this.parachute.value)
                this.parachute.value-=dt*0.05
                if(this.parachute.value<=0){
                    this.parachute=undefined
                    this.dirty=true
                }
            }
        }
        if(!v2.is(this.position,this.oldPosition)){
            this.oldPosition=v2.duplicate(this.position)
            this.manager.cells.updateObject(this)
            this.push_vorce=v2.scale(this.push_vorce,1/(1+dt*4))
            this.game.map.clamp_hitbox(this.hb)
            this.current_floor=this.game.map.terrain.get_floor_type(this.position,this.layer,FloorType.Water)
        }

        
        //Hand Use
        if(this.downed){
            this.piercingDamage({
                amount:1*dt,
                critical:false,
                position:this.position,
                reason:DamageReason.Bleend,
                owner:this.downedBy,
                source:this.downedBySource
            })
        }else if(!this.parachute&&!this.seat){
            this.input.attacking=false
            if(this.input.using_item&&this.inventory.currentWeapon&&!this.projectile_holding&&(this.pvpEnabled||this.game.debug.deenable_lobby)){
                this.inventory.currentWeapon.on_fire(this,this.inventory.currentWeapon as LItem)
                this.input.attacking=this.inventory.currentWeapon.attacking()
            }

            if(this.projectile_holding){
                this.projectile_holding.time-=dt
                if(this.projectile_holding.time<=0){
                    if(this.projectile_holding.def.explosion)this.game.add_explosion(this.position,Explosions.getFromString(this.projectile_holding.def.explosion!),this,this.projectile_holding.def,this.layer)
                    this.projectile_holding=undefined
                }
                if(!this.input.using_item){
                    this.throw_using_projectile()
                }
            }
            
            //Update Inventory
            for(const s of this.inventory.slots){
                if(!s.item)continue
                s.item.update(this)
            }
            //Collision
            const objs=this.manager.cells.get_objects(this.hb,this.layer)
            let can_interact=this.game.debug.deenable_lobby||this.game.pvpEnabled
            for(const obj of objs){
                if(obj.id===this.id)continue
                switch(obj.stringType){
                    case "obstacle":
                        if((obj as Obstacle).def.noCollision)break
                        if((obj as Obstacle).hb&&!(obj as Obstacle).dead){
                            if(can_interact&&this.input.interaction&&(obj as Obstacle).hb.collidingWith(this.hb)){
                                (obj as Loot).interact(this)
                                can_interact=false
                            }
                            const ov=this.hb.overlapCollision((obj as Obstacle).hb)
                            if(ov){
                                this.position=v2.sub(this.position,v2.scale(ov.dir,ov.pen))
                            }
                        }
                        break
                    case "loot":
                        if(can_interact&&this.input.interaction&&this.hb.collidingWith((obj as Loot).hb)){
                            (obj as Loot).interact(this)
                            can_interact=false
                        }
                }
            }
        }
        this.update_input()
        this.input.using_item_down=false
        this.input.interaction=false
        this.invensibility_time-=dt

        this.actions.update(dt)
        this.inventory.update()
        this.dirtyPart=true

        if(this.game.deadzone.do_damage&&!this.game.deadzone.hitbox.pointInside(this.position)){
            this.piercingDamage({
                amount:this.game.deadzone.damageAt(this.position),
                critical:false,
                position:this.position,
                reason:DamageReason.DeadZone,
            })
        }
        
        if(this.ai)this.ai.AI(this,dt)
    }
    override net_update(): void {
        this.input.emote=undefined
    }
    update_input(){
        if(this.input.reload&&this.inventory.currentWeapon&&this.inventory.currentWeapon.itemType===InventoryItemType.gun){
            (this.inventory.currentWeapon as GunItem).reloading=true
            this.input.reload=false
        }
        if(this.input.interaction&&this.seat){
            this.position=v2.add(this.seat.position,v2.rotate_RadAngle(v2.new(0,-1),this.seat.vehicle.angle))
            this.seat.clear_player()
            this.input.interaction=false
        }
        if(this.input.swamp_guns){
            this.inventory.swamp_guns()
            this.input.swamp_guns=false
        }
        if(!this.downed&&!this.parachute){
            for(const a of this.input.actions){
                switch(a.type){
                    case InputActionType.drop:
                        if(a.drop>=0){
                            const drop=a.drop
                            switch(a.drop_kind){
                                case 1:
                                    this.inventory.drop_weapon(Numeric.clamp(drop,0,2) as (0|1|2))
                                    break
                                case 2:
                                    this.inventory.drop_ammo(drop)
                                    break
                                case 3:
                                    this.inventory.drop_slot(drop)
                                    break
                                case 4:
                                    this.inventory.drop_item(drop)
                                    break
                            }
                        }
                        break
                    case InputActionType.use_item:{
                        const item=this.inventory.slots[a.slot]?.item
                        if(item){
                            item.on_use(this,item)
                        }
                        break
                    }
                    case InputActionType.set_hand:
                        if(!(a.hand>=0&&a.hand<3))break
                        this.inventory.set_current_weapon_index(a.hand)
                        break
                    case InputActionType.emote:
                        this.input.emote=a.emote
                        break
                    case InputActionType.debug_give:
                        if(this.game.debug.debug_menu){
                            this.inventory.give_item(GameItems.valueString[a.item],a.count,true)
                        }
                        break
                    case InputActionType.debug_spawn:
                        if(this.game.debug.debug_menu){
                            const l=GameItems.valueString[a.item]
                            this.game.add_loot(this.position,l,a.count,this.layer)
                            if(l.item_type===InventoryItemType.gun){
                                this.game.add_loot(this.position,Ammos.getFromString((l as unknown as GunDef).ammoType) as unknown as GameItem,((l as unknown as GunDef).ammoSpawnAmount??0)*a.count)
                            }
                        }
                        break
                }
            }
            this.input.actions.length=0
        }
    }
    clear(){
        this.inventory.clear()
        this.boost=0
        this.boost_def=Boosts[BoostType.Null]
        this.dirty=true
    }
    process_action(action:ActionPacket){
        this.input.movement=v2.normalizeSafe(v2.clamp1(action.movement,-1,1),NullVec2)
        if(this.input.is_mobile){
            this.input.using_item_down=action.use_weapon
        }else if(!this.input.using_item&&action.use_weapon){
            this.input.using_item_down=true
        }
        this.input.rotation=action.angle
        this.input.interaction=action.interact
        this.input.using_item=action.use_weapon
        this.input.reload=action.reload
        this.input.actions=action.actions
        this.input.swamp_guns=action.swamp_guns
        this.input.aim_speed=action.aim_speed
    }
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.random(0,this.game.map.size.x),GameConstants.player.playerRadius)
        if(this.game.gamemode.player.respawn?.max_respawn){
            this.respawn_count=this.game.gamemode.player.respawn.max_respawn
        }
    }
    damagesSplash:DamageSplash[]=[]

    splashDelay:number=0

    view_objects:ServerGameObject[]=[]

    camera_hb:RectHitbox2D=new RectHitbox2D(v2.new(0,0),v2.new(0,0))
    update2(){
        this.update_modifiers()
        if(this.client&&this.client.opened&&!this.is_npc&&!this.is_bot){
            const up=new UpdatePacket()
            up.priv.health=this.health
            up.priv.max_health=this.maxHealth
            up.priv.boost=this.boost
            up.priv.max_boost=this.maxBoost
            up.priv.boost_type=this.boost_def.type
            up.priv.inventory=[]
            up.priv.planes=this.game.planes
            if(this.splashDelay<=0){
                up.priv.damages=this.damagesSplash
                this.damagesSplash=[]
            }else{
                this.splashDelay--
            }
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(s.item){
                    up.priv.inventory.push({count:s.quantity,idNumber:GameItems.keysString[s.item!.def.idString!],type:s.item.itemType})
                }else{
                    up.priv.inventory.push({count:0,idNumber:0,type:InventoryItemType.consumible})
                }
                ii++
            }
            up.priv.dirty=this.privateDirtys
            up.priv.weapons={
                melee:this.inventory.weapons[0]?.def,
                gun1:this.inventory.weapons[1]?.def,
                gun2:this.inventory.weapons[2]?.def,
            }
            if(this.inventory.currentWeapon&&this.inventory.currentWeapon.type==="gun"){
                up.priv.current_weapon={
                    slot:this.inventory.weaponIdx,
                    liquid:(this.inventory.currentWeapon as GunItem).liquid,
                    ammo:(this.inventory.currentWeapon as GunItem).ammo
                }
            }else{
                up.priv.current_weapon={
                    slot:this.inventory.weaponIdx,
                    liquid:false,
                    ammo:0
                }
            }
            if(this.privateDirtys.oitems){
                for(const a of Object.keys(this.inventory.oitems)){
                    up.priv.oitems[Ammos.getFromString(a).idNumber!]=this.inventory.oitems[a]
                }
            }
            this.privateDirtys={
                inventory:false,
                weapons:false,
                current_weapon:false,
                action:false,
                oitems:false
            }
            if(this.game.deadzone.dirty){
                up.priv.deadzone=this.game.deadzone.state
            }

            if(this.actions.current_action){
                up.priv.action={delay:this.actions.current_delay,type:this.actions.current_action.type}
            }
            const objs=this.get_objects()
            const o=this.game.scene.objects.encode_list(objs,this.view_objects)
            this.view_objects=o.last
            up.objects=o.strm
            this.client.emit(up)
        }
    }
    get_objects(){
        /*this.camera_hb.min.x=this.position.x-(37/2)
        this.camera_hb.min.y=this.position.y-(37/2)
        this.camera_hb.max.x=this.position.x+(37/2)
        this.camera_hb.max.y=this.position.y+(37/2)*/
        this.camera_hb.min.x=Math.floor((this.position.x-(37/2))/8)*8
        this.camera_hb.min.y=Math.floor((this.position.y-(37/2))/8)*8
        this.camera_hb.max.x=Math.floor((this.position.x+(37/2))/8)*8
        this.camera_hb.max.y=Math.floor((this.position.y+(37/2))/8)*8
        /*const objs=[
            ...Object.values(this.manager.objects[this.layer].objects),
        ]*/
        const objs=this.manager.cells.get_objects(this.camera_hb,this.layer)
        return objs
    }
    damage(params:DamageParams){
        if(this.dead||!this.pvpEnabled||this.parachute||this.imortal||this.invensibility_time>0)return
        let damage=params.amount
        let mod=1
        if(params.owner&&params.owner instanceof Player){
            const is_ally=this.game.modeManager.is_ally(this,params.owner)
            if(
                params.owner.id!==this.id&&
                (is_ally&&!(this.friendly_fire&&params.owner.friendly_fire))
            )return
            mod*=params.owner.modifiers.damage
        }
        if(this.vest){
            mod-=this.vest.reduction
            damage-=this.vest.defence
        }
        if(this.helmet){
            mod-=this.helmet.reduction
            damage-=this.helmet.defence
        }
        if(params.critical){
            mod+=this.modifiers.critical_mult-1
        }
        damage*=mod
        params.amount=damage
        this.piercingDamage(params)
    }
    piercingDamage(params: DamageParams) {
        const totalDamage = params.amount
        let shieldDamage = 0
        let healthDamage = 0

        const baseSplash: Omit<DamageSplash, "shield" | "shield_break" | "count"> = {
            critical: params.critical,
            position: params.position,
            taker: this.id,
            taker_layer: this.layer
        }

        const splashes: DamageSplash[] = []

        if (this.boost_def.type === BoostType.Shield && this.boost > 0) {
            shieldDamage = Math.min(this.boost, totalDamage)

            if (totalDamage >= this.boost * 2) {
                shieldDamage = this.boost
                healthDamage = totalDamage - shieldDamage
                this.boost = 0
            } else {
                this.boost -= shieldDamage
            }
            splashes.push({
                ...baseSplash,
                count: Math.ceil(totalDamage),
                shield: true,
                shield_break: this.boost === 0
            })

            if (this.boost === 0) {
                this.invensibility_time = 0.35
            }
        } else {
            healthDamage = Math.min(this.health, totalDamage)

            splashes.push({
                ...baseSplash,
                count: Math.ceil(totalDamage),
                shield: false,
                shield_break: false
            })
        }

        if (healthDamage > 0) {
            this.health = Math.max(this.health - healthDamage, 0)
        }

        if (params.owner && params.owner instanceof Player && params.owner.id !== this.id && params.reason !== DamageReason.Bleend) {
            params.owner.status.damage += (shieldDamage + healthDamage)

            for (const splash of splashes) {
                let ok = true
                for (const ds of params.owner.damagesSplash) {
                    if (ds.shield === splash.shield && ds.taker === splash.taker) {
                        ds.critical = ds.critical || splash.critical
                        if (ds.shield) {
                            ds.shield_break = ds.shield_break || splash.shield_break
                        }
                        ds.count += splash.count
                        ok = false
                        break
                    }
                }
                if (ok) {
                    params.owner.damagesSplash.push(splash)
                } else {
                    params.owner.splashDelay = 2
                }
            }
        }

        for (const s of splashes) {
            this.damagesSplash.push(s)
        }

        if (this.health === 0) {
            if (!this.downed && this.game.modeManager.can_down(this)) {
                this.down(params)
            } else {
                this.kill(params)
            }
        }
    }


    down(params:DamageParams){
        if(this.downed)return
        this.downed=true
        this.downedBy=params.owner
        this.downedBySource=params.source
        this.health=this.maxHealth
        this.boost=0

        if(params.owner&&params.owner instanceof Player){
            this.game.send_killfeed_message({
                killer:{
                    id:params.owner.id,
                    kills:params.owner.status.kills
                },
                victimId:this.id,
                type:KillFeedMessageType.down,
                used:DamageSources.keysString[params.source!.idString]
            })
        }

        this.push_vorce=v2.add(this.push_vorce,v2.scale(v2.from_RadAngle(v2.lookTo(params.position,this.position)),5))
    }
    revive(){
        if(!this.downed)return
        this.downed=false
        this.downedBy=undefined
        this.downedBySource=undefined
        this.health=this.maxHealth*0.3
        this.boost=0
    }
    respawn_count:number=0
    respawn():boolean{
        if(this.respawn_count<=0)return false
        if(this.game.gamemode.player.respawn?.max_respawn){
            this.respawn_count--
        }
        this.game.addTimeout(()=>{
            this.dead=false
            this.health=this.maxHealth
            this.boost=0
            this.manager.cells.registry(this)
            this.dirty=true
            if(this.game.gamemode.player.respawn?.insert_inventory){
                this.inventory.gift(this.game.gamemode.player.respawn.insert_inventory)
            }
        },2)
        return true
    }
    kill(params:DamageParams){
        if(this.dead)return
        this.dead=true
        if(this.loadout.emotes.die!==""){
            this.game.addTimeout(()=>this.input.emote=Emotes.getFromString(this.loadout.emotes.die),0.5)
        }
        this.update2()
        if(!this.is_npc){
            let killed_by:number=this.id
            if(this.game.modeManager.kill_leader&&this.game.modeManager.kill_leader===this){
                this.game.send_killfeed_message({
                    type:KillFeedMessageType.killleader_dead,
                    player:{
                        id:this.id,
                        kills:this.status.kills
                    }
                })
            }

            if(params.owner&&params.owner instanceof Player){
                if(params.owner.id!==this.id&&(params.owner.username===""||params.owner.username!==this.username||this.is_bot)&&!this.game.modeManager.is_ally(this,params.owner)){
                    params.owner.status.kills++
                    params.owner.earned.coins+=3
                    params.owner.earned.xp+=1
                    params.owner.earned.score+=5
                }
                killed_by=params.owner.id
                this.game.send_killfeed_message({
                    killer:{
                        id:params.owner.id,
                        kills:params.owner.status.kills
                    },
                    victimId:this.id,
                    type:KillFeedMessageType.kill,
                    used:DamageSources.keysString[params.source!.idString]
                })
                if((!this.game.modeManager.kill_leader&&params.owner.status.kills>=3)||(this.game.modeManager.kill_leader&&this.game.modeManager.kill_leader.status.kills<params.owner.status.kills)){
                    this.game.modeManager.kill_leader=params.owner
                    this.game.send_killfeed_message({
                        type:KillFeedMessageType.killleader_assigned,
                        player:{
                            id:params.owner.id,
                            kills:params.owner.status.kills
                        }
                    })
                }
                
                if(this.game.statistics){
                    this.game.statistics.items.kills[params.source!.idString]=(this.game.statistics.items.kills[params.source!.idString]??0)+1
                }
            }

            //Respawn
            if(!this.game.gamemode.player.respawn?.keep_inventory){
                this.inventory.drop_all()
            }
            let sg=true
            if(this.game.gamemode.player.respawn){
                sg=!this.respawn()
            }
            if(sg){
                this.game.livingPlayers.splice(this.game.livingPlayers.indexOf(this),1);
                this.send_game_over(false,killed_by)
            }

            this.game.modeManager.on_player_die(this)
        }else{
            this.inventory.drop_all()
        }

        this.game.add_player_body(this,v2.lookTo(params.position,this.position),this.layer)
        for(let i=0;i<3;i++){
            this.game.add_player_gore(this,undefined,this.layer)
        }
        this.dirty=true
        this.game.scene.cells.unregistry(this)
        this.status.rank=this.game.livingPlayers.length+1
    }
    send_game_over(win:boolean=false,eliminated_by:number=0){
        if(this.is_npc||!this.client||!this.client.opened||this.is_bot)return
        const p=new GameOverPacket()
        p.Kills=this.status.kills
        p.DamageDealth=this.status.damage
        p.Win=win
        p.Score=0
        p.Eliminator=eliminated_by
        this.client!.emit(p)
    }
    override onDestroy(): void {
        const idx=this.game.livingPlayers.indexOf(this)
        if(idx!==-1){
            this.game.livingPlayers.splice(idx,1);
        }
    }
    override getData(): PlayerData {
        return {
            position:this.position,
            rotation:this.rotation,
            dead:this.dead,
            left_handed:this.left_handed,
            parachute:this.parachute,
            driving:this.seat!==undefined,
            attacking:this.input.attacking,
            emote:this.input.emote,
            full:{
                vest:this.vest?this.vest.idNumber!+1:0,
                helmet:this.helmet?this.helmet.idNumber!+1:0,
                current_weapon:Weapons.keysString[this.inventory.currentWeapon?.def.idString??""]??-1,
                animation:this.current_animation,
                backpack:this.inventory.backpack.idNumber!,
                skin:this.skin.idNumber!
            }
        }
    }
}