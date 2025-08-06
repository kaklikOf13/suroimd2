import { BaseGameObject2D, CircleHitbox2D, Client, cloneDeep, NullVec2, Numeric, RectHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerAnimation, PlayerData } from "common/scripts/others/objectsEncode.ts";
import { ActionsType, GameConstants, GameOverPacket } from "common/scripts/others/constants.ts";
import { GInventory,GunItem,LItem} from "../inventory/inventory.ts";
import { DamageSplash, UpdatePacket } from "../../../../common/scripts/packets/update_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { ActionsManager } from "common/scripts/engine/inventory.ts";
import { BoostType, DamageReason, GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { Armors, type EquipamentDef } from "../../../../common/scripts/definitions/items/equipaments.ts";
import { DamageSourceDef, DamageSources, GameItems, Weapons } from "common/scripts/definitions/alldefs.ts";
import { type PlayerModifiers } from "common/scripts/others/constants.ts";
import { AccessoriesManager } from "../inventory/accesories.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Loot } from "./loot.ts";
import { Ammos } from "common/scripts/definitions/items/ammo.ts";
import { type Group, type Team } from "../others/teams.ts";
import { KillFeedMessageType } from "common/scripts/packets/killfeed_packet.ts";
import { Backpacks } from "common/scripts/definitions/items/backpacks.ts";
import {SkinDef, Skins} from "common/scripts/definitions/loadout/skins.ts"
import { type VehicleSeat } from "./vehicle.ts";
import { Vehicles } from "common/scripts/definitions/objects/vehicles.ts";

export class Player extends ServerGameObject{
    movement:Vec2
    oldPosition:Vec2
    stringType:string="player"
    numberType: number=1
    name:string=""
    using_item:boolean=false
    using_item_down:boolean=false
    rotation:number=0
    recoil?:{speed:number,delay:number}

    skin:SkinDef=Skins.getFromString("default_skin")
    loadout={
        skin:"default_skin"
    }
    parachute?:{
        value:number
    }
    seat?:VehicleSeat

    health:number=100
    maxHealth:number=100

    boost:number=0
    maxBoost:number=100
    BoostType:BoostType=BoostType.Null

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
    }
    username:string=""
    
    current_animation?:PlayerAnimation

    pvpEnabled:boolean=false
    interactionsEnabled:boolean=false

    team?:Team
    teamId?:number

    group?:Group
    groupId?:number

    push_vorce:Vec2=v2.new(0,0)

    left_handed:boolean
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.inventory=new GInventory(this)

        this.actions=new ActionsManager(this)

        this.left_handed=Math.random()<=.1

        this.accessories=new AccessoriesManager(this,3)
    }
    interaction_input:boolean=false
    reloading_input:boolean=false
    interact(user: Player): void {
        if(!this.downed||user.teamId===undefined||(user.teamId!==this.teamId&&(user.groupId===undefined||user.groupId!==this.groupId)))return
        this.revive()
    }

    dead=false
    downed=false

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

    privateDirtys={
        inventory:true,
        weapons:true,
        current_weapon:true,
        action:true,
        ammos:true,
    }

    update_modifiers(){
        this.modifiers.damage=this.modifiers.speed=this.modifiers.mana_consume=this.modifiers.health=this.modifiers.boost=this.modifiers.bullet_speed=this.modifiers.bullet_size=this.modifiers.critical_mult=1
        const gamemode=this.game.gamemode
        if(this.BoostType===BoostType.Addiction){
            this.modifiers.damage+=(1-(this.boost/this.maxBoost))*gamemode.player.boosts.addiction.damage
        }

        for(const acc of this.accessories.slots){
            if(acc.item){
                const mods=acc.item.modifiers
                this.modifiers.boost*=mods.boost??1
                this.modifiers.bullet_size*=mods.bullet_size??1
                this.modifiers.bullet_speed*=mods.bullet_speed??1
                this.modifiers.damage*=mods.damage??1
                this.modifiers.health*=mods.health??1
                this.modifiers.speed*=mods.speed??1
            }
        }

        this.maxHealth=100*this.modifiers.health
        this.maxBoost=100*this.modifiers.boost

        this.health=Math.min(this.health,this.maxHealth)
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
        if(this.recoil){
            this.recoil.delay-=dt
            this.current_animation=undefined
            if(this.recoil.delay<=0)this.recoil=undefined
        }
        switch(this.BoostType){
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
                this.piercingDamage({
                    amount:((this.maxBoost/this.boost)*gamemode.player.boosts.addiction.abstinence*dt)*50,
                    reason:DamageReason.Abstinence,
                    position:v2.duplicate(this.position),
                    critical:false,
                })
                break
            }
        }
        if(this.parachute){
            speed*=1.5+(0.25+this.parachute.value)
            this.parachute.value-=dt*0.05
            if(this.parachute.value<=0){
                this.parachute=undefined
                this.dirty=true
            }
        }
        if(this.seat){
            if(this.seat.rotation!==undefined)this.rotation=this.seat.rotation
            if(this.seat.pillot)this.seat.vehicle.move(this.movement,this.reloading_input,dt)
        }else{
            this.position=v2.add(this.position,v2.add(v2.scale(this.movement,5*speed*dt),v2.scale(this.push_vorce,dt)))
        }
        if(!v2.is(this.position,this.oldPosition)){
            this.oldPosition=v2.duplicate(this.position)
            this.manager.cells.updateObject(this)
            this.push_vorce=v2.scale(this.push_vorce,1/(1+dt*4))
            this.game.map.clamp_hitbox(this.hb)
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
            if(this.using_item&&this.inventory.currentWeapon&&(this.pvpEnabled||this.game.config.deenable_feast)){
                this.inventory.currentWeapon.on_use(this,this.inventory.currentWeapon as LItem)
            }
            
            //Update Inventory
            for(const s of this.inventory.slots){
                if(!s.item)continue
                s.item.update(this)
            }
            //Collision
            const objs=this.manager.cells.get_objects(this.hb,this.layer)
            let can_interact=this.interactionsEnabled
            for(const obj of objs){
                if(obj.id===this.id)continue
                switch(obj.stringType){
                    case "obstacle":
                        if((obj as Obstacle).def.noCollision)break
                        if((obj as Obstacle).hb&&!(obj as Obstacle).dead){
                            if(can_interact&&this.interaction_input&&(obj as Obstacle).def.interactDestroy&&(obj as Obstacle).hb.collidingWith(this.hb)){
                                (obj as Obstacle).kill({
                                    amount:(obj as Obstacle).health,
                                    position:this.position,
                                    reason:DamageReason.Player,
                                    owner:this,
                                    critical:false
                                })
                            }
                            const ov=this.hb.overlapCollision((obj as Obstacle).hb)
                            if(ov){
                                this.position=v2.sub(this.position,v2.scale(ov.dir,ov.pen))
                            }
                        }
                        break
                    case "loot":
                        if(can_interact&&this.interaction_input&&this.hb.collidingWith((obj as Loot).hb)){
                            (obj as Loot).interact(this)
                            can_interact=false
                        }
                }
            }
        }
        this.using_item_down=false
        this.interaction_input=false
        this.invensibility_time-=dt

        this.actions.update(dt)
        this.inventory.update()
        this.dirtyPart=true
    }
    process_action(action:ActionPacket){
        this.movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        if(!this.using_item&&action.UsingItem){
            this.using_item_down=true
        }
        this.using_item=action.UsingItem
        if(this.seat?.rotation===undefined)this.rotation=action.angle
        this.interaction_input=action.interact
        this.reloading_input=action.Reloading
        if(action.hand>=0&&action.hand<3){
            this.inventory.set_current_weapon_index(action.hand)
        }
        if(action.Reloading&&this.inventory.currentWeapon&&this.inventory.currentWeapon.itemType===InventoryItemType.gun){
            (this.inventory.currentWeapon as GunItem).reloading=true
        }
        if(!this.downed&&!this.parachute){
            if(action.interact){
                if(this.seat){
                    this.position=v2.add(this.seat.position,v2.rotate_RadAngle(v2.new(0,-1),this.seat.vehicle.angle))
                    this.seat.clear_player()
                    this.interaction_input=false
                }
            }
            if(action.use_slot!==-1){
                const item=this.inventory.slots[action.use_slot]?.item
                if(item){
                    item.on_use(this,item)
                }
            }
        }
        switch(action.drop_kind){
            case 1:
                this.inventory.drop_weapon(Numeric.clamp(action.drop,0,2) as (0|1|2))
                break
            case 2:
                this.inventory.drop_ammo(action.drop)
                break
            case 3:
                this.inventory.drop_slot(action.drop)
                break
        }
        /*
        if(action.cellphoneAction){
            if(this.handItem&&this.handItem instanceof OtherItem){
                this.handItem.cellphone_action(this,action.cellphoneAction)
            }
        }*/
    }
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.random(0,this.game.map.size.x),GameConstants.player.playerRadius)

        this.inventory.set_weapon(1,"spas12")
        this.inventory.set_weapon(2,"awp")
        this.inventory.set_current_weapon_index(1)
        this.inventory.weapons[1]!.ammo=this.inventory.weapons[1]!.def.reload?this.inventory.weapons[1]!.def.reload.capacity:Infinity
        this.inventory.weapons[2]!.ammo=this.inventory.weapons[2]!.def.reload?this.inventory.weapons[2]!.def.reload.capacity:Infinity
        this.inventory.set_backpack(Backpacks.getFromString("tactical_pack"))

        this.helmet=Armors.getFromString("tactical_helmet")
        this.vest=Armors.getFromString("tactical_vest")
        //
        /*this.inventory.give_item(Ammos.getFromString("762mm") as unknown as GameItem,100)
        this.inventory.give_item(Ammos.getFromString("556mm") as unknown as GameItem,100)
        this.inventory.give_item(Ammos.getFromString("9mm") as unknown as GameItem,120)
        this.inventory.give_item(Ammos.getFromString("12g") as unknown as GameItem,15)
        this.inventory.give_item(Ammos.getFromString("308sub") as unknown as GameItem,10)*/

        this.inventory.give_item(Ammos.getFromString("762mm") as unknown as GameItem,300)
        this.inventory.give_item(Ammos.getFromString("556mm") as unknown as GameItem,300)
        this.inventory.give_item(Ammos.getFromString("9mm") as unknown as GameItem,400)
        this.inventory.give_item(Ammos.getFromString("12g") as unknown as GameItem,90)
        this.inventory.give_item(Ammos.getFromString("308sub") as unknown as GameItem,40)

        /*this.inventory.give_item(Consumibles.getFromString("gauze") as unknown as GameItem,30)
        this.inventory.give_item(Consumibles.getFromString("soda") as unknown as GameItem,10)
        this.inventory.give_item(Consumibles.getFromString("blue_potion") as unknown as GameItem,5)*/
        /*const v=this.game.add_vehicle(v2.new(20,20),Vehicles.getFromString("bike"))
        v.seats[0].set_player(this)*/

        this.boost=100
        this.BoostType=BoostType.Shield
    }
    damagesSplash:DamageSplash[]=[]

    splashDelay:number=0

    view_objects:ServerGameObject[]=[]

    camera_hb:RectHitbox2D=new RectHitbox2D(v2.new(0,0),v2.new(0,0))
    update2(){
        this.update_modifiers()
        if(this.client&&this.client.opened&&!this.is_npc&&!this.is_bot){
            const up=new UpdatePacket()
            up.gui.health=this.health
            up.gui.max_health=this.maxHealth
            up.gui.boost=this.boost
            up.gui.max_boost=this.maxBoost
            up.gui.boost_type=this.BoostType
            up.gui.inventory=[]
            if(this.splashDelay<=0){
                up.gui.damages=this.damagesSplash
                this.damagesSplash=[]
            }else{
                this.splashDelay--
            }
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(s.item){
                    up.gui.inventory.push({count:s.quantity,idNumber:GameItems.keysString[s.item!.def.idString!],type:s.item.itemType})
                }else{
                    up.gui.inventory.push({count:0,idNumber:0,type:InventoryItemType.consumible})
                }
                ii++
            }
            up.gui.dirty=this.privateDirtys
            up.gui.weapons={
                melee:this.inventory.weapons[0]?.def,
                gun1:this.inventory.weapons[1]?.def,
                gun2:this.inventory.weapons[2]?.def,
            }
            up.gui.current_weapon={
                slot:this.inventory.weaponIdx,
                ammo:(this.inventory.currentWeapon&&this.inventory.currentWeapon.type==="gun")?(this.inventory.currentWeapon as GunItem).ammo:0
            }
            if(this.privateDirtys.ammos){
                for(const a of Object.keys(this.inventory.ammos)){
                    up.gui.ammos[Ammos.getFromString(a).idNumber!]=this.inventory.ammos[a]
                }
            }
            this.privateDirtys={
                inventory:false,
                weapons:false,
                current_weapon:false,
                action:false,
                ammos:false
            }

            if(this.actions.current_action){
                up.gui.action={delay:this.actions.current_delay,type:this.actions.current_action.type}
            }
            this.camera_hb.min.x=this.position.x-(30/2)
            this.camera_hb.min.y=this.position.y-(30/2)
            this.camera_hb.max.x=this.position.x+(30/2)
            this.camera_hb.max.y=this.position.y+(30/2)
            /*const objs=[
                ...Object.values(this.manager.objects[this.layer].objects),
            ]*/
            const objs=this.manager.cells.get_objects(this.camera_hb,this.layer)
            const o=this.game.scene.objects.encode_list(objs,2048*1024,this.view_objects)
            this.view_objects=o.last
            up.objects=o.strm
            this.client.emit(up)
        }
    }
    damage(params:DamageParams){
        if(this.dead||!this.pvpEnabled||this.parachute||this.imortal||this.invensibility_time>0)return
        let damage=params.amount
        let mod=1
        if(params.owner&&params.owner instanceof Player){
            if(params.owner.id!==this.id&&!this.is_npc&&((params.owner.teamId!==undefined&&params.owner.teamId===this.teamId)||(params.owner.groupId!==undefined&&params.owner.groupId===this.groupId)))return
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
        damage=Numeric.clamp(damage*mod,0,this.health)
        params.amount=damage
        this.piercingDamage(params)
    }
    piercingDamage(params:DamageParams){
        if(this.BoostType===BoostType.Shield&&this.boost>0){
            params.amount=Math.min(this.boost,params.amount)
        }else{
            params.amount=Math.min(this.health,params.amount)
        }
        let d:DamageSplash={
            count:Math.ceil(params.amount),
            shield:false,
            critical:params.critical,
            shield_break:false,
            position:params.position,
            taker:this.id,
            taker_layer:this.layer
        }
        
        if(this.BoostType===BoostType.Shield&&this.boost>0){
            this.boost=Math.max(this.boost-params.amount,0)
            if(params.owner&&params.owner instanceof Player){
                d.shield=true
                d.shield_break=this.boost===0
                if(this.boost===0){
                    this.invensibility_time=0.35
                }
            }
        }else{
            this.health=Math.max(this.health-params.amount,0)
        }
        if(params.owner&&params.owner instanceof Player&&params.owner.id!==this.id&&params.reason!==DamageReason.Bleend){
            params.owner.status.damage+=params.amount
            let ok=true
            for(const ds of params.owner.damagesSplash){
                if(ds.shield===d.shield&&ds.taker===d.taker){
                    ds.critical===d.critical||ds.critical
                    if(ds.shield){
                        ds.shield_break=ds.shield_break||this.boost===0
                    }
                    d=ds
                    ok=false
                    ds.count+=params.amount
                    break
               }
            }
            if(ok){
                params.owner.damagesSplash.push(d)
            }else{
                params.owner.splashDelay=2
            }
        }
        if(this.health===0){
            if(!this.downed&&this.game.modeManager.can_down(this)){
                this.down(params)
            }else{
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
    kill(params:DamageParams){
        if(this.dead)return
        this.dead=true
        this.update2()
        this.inventory.drop_all();
        if(!this.is_npc){
            this.game.livingPlayers.splice(this.game.livingPlayers.indexOf(this),1);
            this.game.modeManager.on_player_die(this);
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
                if(params.owner.id!==this.id&&(params.owner.username===""||params.owner.username!==this.username)){
                    params.owner.status.kills++
                    params.owner.earned.coins+=3
                    params.owner.earned.xp+=1
                }
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
            }
        }

        this.game.add_player_body(this,v2.lookTo(params.position,this.position))
        this.game.addTimeout(()=>{
            this.send_game_over(false)
        },2)
        this.dirty=true
        this.game.scene.cells.unregistry(this)
        this.status.rank=this.game.livingPlayers.length+1
    }
    send_game_over(win:boolean=false){
        if(this.is_npc||!this.client||!this.client.opened||this.is_bot)return
        const p=new GameOverPacket()
        p.Kills=this.status.kills
        p.DamageDealth=this.status.damage
        p.Win=win
        p.Score=0
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
            using_item:this.using_item,
            using_item_down:this.using_item_down,
            dead:this.dead,
            left_handed:this.left_handed,
            parachute:this.parachute,
            driving:this.seat!==undefined,
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