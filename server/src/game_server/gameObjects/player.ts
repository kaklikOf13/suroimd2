import { BaseGameObject2D, CircleHitbox2D, Client, NullVec2, Numeric, RectHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { ActionsType, CATEGORYS, GameConstants, GameOverPacket } from "common/scripts/others/constants.ts";
import { GInventory,GunItem,LItem} from "../inventory/inventory.ts";
import { DamageSplash, UpdatePacket } from "../../../../common/scripts/packets/update_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { ActionsManager } from "common/scripts/engine/inventory.ts";
import { BoostType, DamageReason, GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { Armors, type EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItems, Weapons } from "common/scripts/definitions/alldefs.ts";
import { type PlayerModifiers } from "common/scripts/others/constants.ts";
import { AccessoriesManager } from "../inventory/accesories.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Loot } from "./loot.ts";
import { MeleeDef, Melees } from "common/scripts/definitions/melees.ts";
import { Ammos } from "common/scripts/definitions/items/ammo.ts";

export class Player extends ServerGameObject{
    movement:Vec2
    oldPosition:Vec2
    stringType:string="player"
    numberType: number=1
    name:string="a"
    using_item:boolean=false
    using_item_down:boolean=false
    rotation:number=0
    recoil?:{speed:number,delay:number}

    health:number=100
    maxHealth:number=100

    boost:number=0
    maxBoost:number=100
    BoostType:BoostType=BoostType.Shield

    actions:ActionsManager<this>

    client?:Client

    inventory:GInventory

    default_melee:MeleeDef=Melees.getFromString("survival_knife")

    using_healing_speed:number=0.4

    vest?:EquipamentDef
    helmet?:EquipamentDef
    accessories:AccessoriesManager

    status={
        damage:0,
        kills:0
    }

    pvpEnabled:boolean=false
    interactionsEnabled:boolean=false
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.inventory=new GInventory(this)

        //this.inventory.give_item(this.default_melee as unknown as GameItem,1,false)

        //this.inventory.give_item(GameItems.valueString["cellphone"],1)

        this.actions=new ActionsManager(this)

        this.vest=Armors.getFromString("soldier_vest")
        //this.helmet=Armors.getFromString("soldier_helmet")

        this.accessories=new AccessoriesManager(this,3)
    }
    interaction_input:boolean=false
    interact(_user: Player): void {
        return
    }

    dead=false

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
        //Movement
        const gamemode=this.game.gamemode
        let speed=1*(this.recoil?this.recoil.speed:1)
                  * (this.actions.current_action&&this.actions.current_action.type===ActionsType.Healing?this.using_healing_speed:1)
                  * (this.inventory.currentWeaponDef?.speed_mod??1)
                  * this.modifiers.speed
        if(this.recoil){
            this.recoil.delay-=dt
            if(this.recoil.delay<=0)this.recoil=undefined
        }
        switch(this.BoostType){
            case BoostType.Shield:
                break
            case BoostType.Adrenaline:
                speed+=this.boost*gamemode.player.boosts.adrenaline.speed
                this.boost=Math.max(this.boost-gamemode.player.boosts.adrenaline.decay*dt,0)
                this.health=Math.min(this.health+(this.boost*dt)*gamemode.player.boosts.adrenaline.regen,this.maxHealth)
                break
            case BoostType.Mana:
                this.boost=Numeric.lerp(this.boost,this.maxBoost,gamemode.player.boosts.mana.regen*dt)
                break
            case BoostType.Addiction:{
                speed+=this.boost*gamemode.player.boosts.addiction.speed
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
        this.position=v2.maxDecimal(v2.clamp2(v2.add(this.position,v2.scale(this.movement,speed*dt)),NullVec2,this.game.map.size),3)
        if(!v2.is(this.position,this.oldPosition)){
            this.oldPosition=v2.duplicate(this.position)
            this.manager.cells.updateObject(this)
        }

        //Hand Use
        if(this.using_item&&this.inventory.currentWeapon&&(this.pvpEnabled||this.game.config.deenable_feast)){
            this.inventory.currentWeapon.on_use(this,this.inventory.currentWeapon as LItem)
        }
        //Update Inventory
        for(const s of this.inventory.slots){
            if(!s.item)continue
            s.item.update(this)
        }
        this.using_item_down=false

        //Collision
        //const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.LOOTS])
        const objs=[...Object.values(this.manager.objects[CATEGORYS.LOOTS].objects),...Object.values(this.manager.objects[CATEGORYS.OBSTACLES].objects)]
        let can_interact=this.interactionsEnabled
        for(const obj of objs){
            if((obj as BaseGameObject2D).id===this.id)continue
            switch((obj as BaseGameObject2D).stringType){
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
        this.interaction_input=false

        this.actions.update(dt)
        this.inventory.update()
        this.dirtyPart=true
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.movement=v2.scale(action.Movement,4.5)
        if(!this.using_item&&action.UsingItem){
            this.using_item_down=true
        }
        this.using_item=action.UsingItem
        this.rotation=action.angle
        this.interaction_input=action.interact
        if(action.hand>=0&&action.hand<3){
            this.inventory.set_current_weapon_index(action.hand)
        }
        if(action.Reloading&&this.inventory.currentWeapon&&this.inventory.currentWeapon.itemType===InventoryItemType.gun){
            (this.inventory.currentWeapon as GunItem).reloading=true
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
        this.inventory.set_weapon(2,"kar98k")
        this.inventory.set_current_weapon_index(1)
        this.inventory.weapons[1]!.ammo=this.inventory.weapons[1]!.def.reload?this.inventory.weapons[1]!.def.reload.capacity:Infinity
        this.inventory.weapons[2]!.ammo=this.inventory.weapons[2]!.def.reload?this.inventory.weapons[2]!.def.reload.capacity:Infinity
        this.inventory.give_item(Ammos.getFromString("762mm") as unknown as GameItem,320)
        this.inventory.give_item(Ammos.getFromString("556mm") as unknown as GameItem,320)
        this.inventory.give_item(Ammos.getFromString("9mm") as unknown as GameItem,400)
        this.inventory.give_item(Ammos.getFromString("12g") as unknown as GameItem,90)
    }
    override getData(): PlayerData {
        return {
            position:this.position,
            rotation:this.rotation,
            using_item:this.using_item,
            using_item_down:this.using_item_down,
            full:{
                name:this.name,
                vest:this.vest?this.vest.idNumber!+1:0,
                helmet:this.helmet?this.helmet.idNumber!+1:0,
                current_weapon:Weapons.keysString[this.inventory.currentWeapon?.def.idString??""]??-1
            }
        }
    }

    damageSplash?:DamageSplash

    splashDelay:number=0

    view_objects:ServerGameObject[]=[]

    camera_hb:RectHitbox2D=new RectHitbox2D(v2.new(0,0),v2.new(0,0))
    update2(){
        this.update_modifiers()
        if(this.client&&this.client.opened){
            const up=new UpdatePacket()
            up.gui.health=this.health
            up.gui.max_health=this.maxHealth
            up.gui.boost=this.boost
            up.gui.max_boost=this.maxBoost
            up.gui.boost_type=this.BoostType
            up.gui.inventory=[]
            if(this.splashDelay<=0){
                up.gui.damages=this.damageSplash
                this.damageSplash=undefined
            }else{
                this.splashDelay--
            }
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(!s.item)continue
                up.gui.inventory.push({count:s.quantity,idNumber:GameItems.keysString[s.item!.def.idString!],type:s.item.itemType})
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
            this.privateDirtys={
                inventory:false,
                weapons:false,
                current_weapon:false,
                action:false
            }

            if(this.actions.current_action){
                up.gui.action={delay:this.actions.current_delay,type:this.actions.current_action.type}
            }
            this.camera_hb.min.x=this.position.x-(25/2)
            this.camera_hb.min.y=this.position.y-(13/2)
            this.camera_hb.max.x=this.position.x+(25/2)
            this.camera_hb.max.y=this.position.y+(13/2)
            const objs=[
                ...Object.values(this.manager.objects[CATEGORYS.BULLETS].objects),
                ...Object.values(this.manager.objects[CATEGORYS.EXPLOSIONS].objects),
                ...Object.values(this.manager.objects[CATEGORYS.LOOTS].objects),
                ...Object.values(this.manager.objects[CATEGORYS.OBSTACLES].objects),
                ...Object.values(this.manager.objects[CATEGORYS.PLAYERS].objects),
                ...Object.values(this.manager.objects[CATEGORYS.PROJECTILES].objects),
            ]
            const o=this.game.scene.objects.encode_list(objs,undefined,this.view_objects)
            this.view_objects=o.last
            up.objects=o.strm
            this.client.emit(up)
        }
    }
    damage(params:DamageParams){
        if(this.dead||!this.pvpEnabled)return
        let damage=params.amount
        let mod=1
        if(params.owner&&params.owner instanceof Player){
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
        if(params.owner&&params.owner instanceof Player&&params.owner.id!==this.id){
            params.owner.status.damage+=params.amount
            if(!params.owner.damageSplash){
                params.owner.damageSplash={
                    count:0,
                    shield:false,
                    critical:false,
                    position:params.position
                }
                params.owner.splashDelay=2
            }
            if(params.critical){
                params.owner.damageSplash.critical=true
            }
            params.owner.damageSplash.count+=params.amount
        }
        if(this.BoostType===BoostType.Shield&&this.boost>0){
            this.boost=Math.max(this.boost-params.amount,0)
            if(params.owner&&params.owner instanceof Player){
                params.owner.damageSplash!.shield=true
            }
        }else{
            this.health=Math.max(this.health-params.amount,0)
        }
        if(this.health===0){
            this.kill(params)
        }
    }
    kill(params:DamageParams){
        this.dead=true
        this.update2()
        if(this.client){
            this.destroy()
        }
        this.inventory.drop_all();
        this.game.livingPlayers.splice(this.game.livingPlayers.indexOf(this),1);
        this.game.modeManager.on_player_die(this);

        if(params.owner&&params.owner instanceof Player){
            params.owner.status.kills++
        }

        this.game.addTimeout(()=>{
            this.send_game_over(false)
        },2)
    }
    send_game_over(win:boolean=false){
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
}