import { BaseGameObject2D, CircleHitbox2D, NullVec2, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { ActionsType, CATEGORYS, GameConstants, GameOverPacket } from "common/scripts/others/constants.ts";
import { AmmoItem, GunItem, HealingItem, LItem, OtherItem} from "../inventory/inventory.ts";
import { GunDef } from "common/scripts/definitions/guns.ts";
import { Client } from "../../engine/mod.ts";
import { GuiPacket,DamageSplash } from "common/scripts/packets/gui_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { ActionsManager, InventoryCap } from "common/scripts/engine/inventory.ts";
import { BoostType, DamageReason, type GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { AmmoDef, AmmoType } from "common/scripts/definitions/ammo.ts";
import { Armors, type EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { type Game } from "../others/game.ts"
import { type OtherDef } from "common/scripts/definitions/others.ts";
import { type HealingDef } from "common/scripts/definitions/healings.ts";
import { type PlayerModifiers } from "common/scripts/others/constants.ts";
import { AccessoriesManager } from "../inventory/accesories.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Loot } from "./loot.ts";

export class Player extends ServerGameObject{
    movement:Vec2
    oldPosition:Vec2
    stringType:string="player"
    numberType: number=1
    name:string="a"
    handItem:LItem|null=null
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

    inventory:InventoryCap<LItem>

    melee:LItem|null=null

    using_healing_speed:number=0.4

    vest?:EquipamentDef
    helmet?:EquipamentDef
    accessories:AccessoriesManager

    status={
        damage:0,
        kills:0
    }

    pvpEnabled:boolean=false
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.inventory=new InventoryCap<LItem>(undefined,100)

        this.give_item(GameItems.valueString["cellphone"],1)

        this.actions=new ActionsManager(this)
        this.load_hand(1)

        this.vest=Armors.getFromString("soldier_vest")
        this.helmet=Armors.getFromString("soldier_helmet")

        this.accessories=new AccessoriesManager(this,3)
    }
    interaction_input:boolean=false
    interact(_user: Player): void {
        return
    }
    give_item(def:GameItem,count:number){
        switch(def.item_type){
            case InventoryItemType.gun:{
                const i=new GunItem(def as unknown as GunDef)
                i.ammo=0
                this.inventory.add(i,count)
                break
            }
            case InventoryItemType.ammo:
                this.inventory.add(new AmmoItem(def as unknown as AmmoDef),count)
                break
            case InventoryItemType.healing:
                this.inventory.add(new HealingItem(def as unknown as HealingDef),count)
                break
            case InventoryItemType.equipament:
                break
            case InventoryItemType.other:
                this.inventory.add(new OtherItem(def as unknown as OtherDef),count)
                break
        }
        this.privateDirtys.inventory=true
    }

    load_hand(h:number){
        if(this.hand==h)return
        if(this.handItem&&this.handItem.itemType===InventoryItemType.gun){
            (this.handItem as GunItem).reloading=false
        }
        if(h<1||h>this.inventory.slots.length){
            h=0
            this.hand=0
        }else{
            this.hand=h
        }
        if(this.hand>0&&this.hand<=this.inventory.slots.length){ 
            this.handItem=this.inventory.slots[this.hand-1].item
        }else{
            this.handItem=this.melee
        }
        this.recoil=undefined
        this.privateDirtys.hand=true
        this.privateDirtys.action=true
        this.actions.cancel()

        this.dirty=true
    }
    update_hand(){
        if(this.handItem&&(!this.inventory.slots[this.hand-1]||this.inventory.slots[this.hand-1].quantity<=0)){
            this.load_hand(this.hand)
        }
    }
    dead=false
    hand:number=-1

    modifiers:PlayerModifiers={
        boost:1,
        bullet_size:1,
        bullet_speed:1,
        damage:1,
        health:1,
        speed:1,
        critical_mult:1
    }

    privateDirtys={
        inventory:true,
        hand:true,
        action:true
    }

    update_modifiers(){
        this.modifiers.damage=this.modifiers.speed=this.modifiers.health=this.modifiers.boost=this.modifiers.bullet_speed=this.modifiers.bullet_size=this.modifiers.critical_mult=1
        const gamemode=(this.game as Game).gamemode
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
        const gamemode=(this.game as Game).gamemode
        let speed=1*(this.recoil?this.recoil.speed:1)
                  * (this.actions.current_action&&this.actions.current_action.type===ActionsType.Healing?this.using_healing_speed:1)
                  * (this.handItem?.tags.includes("gun")?(this.handItem as GunItem).def.speedMult??1:1)
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
        this.position=v2.maxDecimal(v2.clamp2(v2.add(this.position,v2.scale(this.movement,speed*dt)),NullVec2,(this.game as Game).map.size),3)
        if(!v2.is(this.position,this.oldPosition)){
            this.dirtyPart=true
            this.oldPosition=v2.duplicate(this.position)
            this.manager.cells.updateObject(this)
        }

        //Hand Use
        if(this.using_item&&this.handItem&&this.pvpEnabled){
            this.handItem.on_use(this,this.inventory.slots[this.hand-1])
        }
        //Update Inventory
        for(const s of this.inventory.slots){
            if(!s.item)continue
            s.item.update(this)
        }
        this.using_item_down=false

        //Collision
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.LOOTS])
        let can_interact=this.pvpEnabled
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
                        if(ov.collided)this.position=v2.sub(this.position,v2.scale(ov.overlap,0.9))
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
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.movement=v2.scale(action.Movement,4)
        if(!this.using_item&&action.UsingItem){
            this.using_item_down=true
        }
        this.using_item=action.UsingItem
        this.rotation=action.angle
        this.interaction_input=action.interact
        this.load_hand(action.hand)
        if(action.Reloading&&this.handItem&&this.handItem.itemType===InventoryItemType.gun){
            (this.handItem as GunItem).reloading=true
        }
        if(action.cellphoneAction){
            if(this.handItem&&this.handItem instanceof OtherItem){
                this.handItem.cellphone_action(this,action.cellphoneAction)
            }
        }
    }
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(3,3),GameConstants.player.playerRadius)
    }
    getData(): PlayerData {
        return {
            position:this.position,
            rotation:this.rotation,
            using_item:this.using_item,
            using_item_down:this.using_item_down,
            full:{
                name:this.name,
                vest:this.vest?this.vest.idNumber!+1:0,
                helmet:this.helmet?this.helmet.idNumber!+1:0,
                handItem:this.handItem?GameItems.keysString[this.handItem.def.idString]:undefined
            }
        }
    }
    handL=0
    ammoCount:Partial<Record<AmmoType,number>>={}

    damageSplash?:DamageSplash

    splashDelay:number=0
    update2(){
        this.update_modifiers()
        if(this.client){
            const guiPacket=new GuiPacket(this.health,this.maxHealth,this.boost,this.maxBoost,this.BoostType)
            guiPacket.inventory=[]
            if(this.splashDelay<=0){
                guiPacket.damages=this.damageSplash
                this.damageSplash=undefined
            }else{
                this.splashDelay--
            }
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(!s.item)continue
                if(i===this.hand-1)this.handL=ii+1
                guiPacket.inventory.push({count:s.quantity,idNumber:GameItems.keysString[s.item!.def.idString!],type:s.item.itemType})
                ii++
            }
            if(this.handItem){
                switch(this.handItem!.itemType){
                    case InventoryItemType.gun:
                        if(!this.ammoCount[(this.handItem as GunItem).def.ammoType]){
                            this.ammoCount[(this.handItem as GunItem).def.ammoType]=this.inventory.getCountTag(`ammo_${(this.handItem as GunItem).def.ammoType}`)
                            this.privateDirtys.hand=true
                        }
                        guiPacket.hand=this.handItem?{ammo:(this.handItem as GunItem).ammo,type:this.handItem.itemType,location:this.handL,disponibility:this.ammoCount[(this.handItem as GunItem).def.ammoType]!}:undefined
                        break
                    case InventoryItemType.ammo:
                    case InventoryItemType.other:
                    case InventoryItemType.equipament:
                    case InventoryItemType.healing:
                        guiPacket.hand=this.handItem?{type:this.handItem.itemType,location:this.handL}:undefined
                        break
                }
            }
            guiPacket.dirty=this.privateDirtys
            if(this.privateDirtys.inventory){
                this.ammoCount={}
            }
            this.privateDirtys={
                inventory:false,
                hand:false,
                action:false
            }

            if(this.actions.current_action){
                guiPacket.action={delay:this.actions.current_delay,type:this.actions.current_action.type}
            }
            this.client.emit(guiPacket)
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
    dropAll(){
        for(const s of this.inventory.slots){
            if(s.quantity>0&&s.item){
                (this.game as Game).add_loot(this.position,s.item.def as GameItem,s.quantity)
                s.quantity=0
                s.item=null
            }
        }
        this.inventory.update_infinity()
    }
    kill(params:DamageParams){
        this.dead=true
        this.update2()
        if(this.client){
            this.destroy()
        }
        this.dropAll();
        (this.game as Game).livingPlayers.splice((this.game as Game).livingPlayers.indexOf(this),1);
        (this.game as Game).modeManager.on_player_die(this);

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
    onDestroy(): void {
        const idx=(this.game as Game).livingPlayers.indexOf(this)
        if(idx!==-1){
            (this.game as Game).livingPlayers.splice(idx,1);
        }
    }
}