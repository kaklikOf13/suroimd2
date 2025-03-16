import { BaseGameObject2D, CircleHitbox2D, NullVec2, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { ActionsType, CATEGORYS, GameConstants } from "common/scripts/others/constants.ts";
import { AmmoItem, GunItem, HealingItem, LItem } from "../inventory/inventory.ts";
import { Guns } from "common/scripts/definitions/guns.ts";
import { Client } from "../../engine/mod.ts";
import { GuiPacket } from "common/scripts/packets/gui_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { Obstacle } from "./obstacle.ts";
import { ActionsManager, InventoryCap } from "common/scripts/engine/inventory.ts";
import { BoostType, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { Ammos, AmmoType } from "common/scripts/definitions/ammo.ts";
import { Healings } from "common/scripts/definitions/healings.ts";
import { Armors, EquipamentDef } from "common/scripts/definitions/equipaments.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { Game } from "../others/game.ts"

export class Player extends BaseGameObject2D{
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
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.inventory=new InventoryCap<LItem>(undefined,100)

        this.inventory.add(new GunItem(Guns.getFromString("m870")),1)
        this.inventory.add(new GunItem(Guns.getFromString("spas12")),1)
        this.inventory.add(new GunItem(Guns.getFromString("ak47")),1)
        this.inventory.add(new GunItem(Guns.getFromString("kar98k")),1)
        this.inventory.add(new HealingItem(Healings.getFromString("lifecandy")),20)
        this.inventory.add(new HealingItem(Healings.getFromString("gauze")),10)
        this.inventory.add(new HealingItem(Healings.getFromString("medikit")),3)
        this.inventory.add(new HealingItem(Healings.getFromString("soda")),8)
        this.inventory.add(new HealingItem(Healings.getFromString("inhaler")),4)
        this.inventory.add(new HealingItem(Healings.getFromString("yellow_pills")),2)
        this.inventory.add(new HealingItem(Healings.getFromString("small_blue_potion")),8)
        this.inventory.add(new HealingItem(Healings.getFromString("blue_potion")),4)
        this.inventory.add(new HealingItem(Healings.getFromString("blue_pills")),2)
        this.inventory.add(new HealingItem(Healings.getFromString("small_purple_potion")),2)
        this.inventory.add(new AmmoItem(Ammos.getFromString("12g")),30)
        this.inventory.add(new AmmoItem(Ammos.getFromString("762mm")),120)

        this.actions=new ActionsManager(this)
        this.load_hand(0)

        this.vest=Armors.getFromString("soldier_vest")
        this.helmet=Armors.getFromString("soldier_helmet")
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

    dirtyPrivate=3
    dead=false
    hand:number=-1

    privateDirtys={
        inventory:true,
        hand:true,
        action:true
    }

    update(dt:number): void {
        //Movement
        let speed=1
        if(this.recoil){
            speed*=this.recoil.speed
            this.recoil.delay-=1/this.game.tps
            if(this.recoil.delay<=0)this.recoil=undefined
        }
        if(this.actions.current_action&&this.actions.current_action.type===ActionsType.Healing){
            speed*=this.using_healing_speed
        }
        switch(this.BoostType){
            case BoostType.Shield:
                break
            case BoostType.Adrenaline:
                speed+=this.boost/550
                this.boost=Math.max(this.boost-0.54*dt,0)
                this.health=Math.min(this.health+(this.boost*dt)/90,this.maxHealth)
                break
            case BoostType.Mana:
                this.boost=Numeric.lerp(this.boost,this.maxBoost,0.03*dt)
                break
        }
        if(this.handItem?.tags.includes("gun")){
            speed*=(this.handItem as GunItem).def.speedMult??1
        }
        this.position=v2.maxDecimal(v2.clamp2(v2.add(this.position,v2.scale(this.movement,speed*dt)),NullVec2,(this.game as Game).map.size),3)
        if(!v2.is(this.position,this.oldPosition)){
            this.dirtyPart=true
            this.oldPosition=this.position
        }

        //Hand Use
        if(this.using_item&&this.handItem){
            this.handItem.on_use(this,this.inventory.slots[this.hand-1])
        }
        //Update Inventory
        for(const s of this.inventory.slots){
            if(!s.item)continue
            s.item.update(this)
        }
        this.using_item_down=false

        if(this.dirtyPrivate<=0){
            this.dirtyPrivate=4
            this.update2()
        }else{
            this.dirtyPrivate--
        }

        //Collision
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            if((obj as BaseGameObject2D).id===this.id)continue
            switch((obj as BaseGameObject2D).stringType){
                case "obstacle":
                    if((obj as Obstacle).def.noCollision)break
                    if((obj as Obstacle).hb){
                        const ov=this.hb.overlapCollision((obj as Obstacle).hb)
                        if(ov.collided)this.position=v2.sub(this.position,v2.scale(ov.overlap,0.9))
                    }
                    break
            }
        }

        this.actions.update(dt)
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.movement=v2.scale(action.Movement,5)
        if(!this.using_item&&action.UsingItem){
            this.using_item_down=true
        }
        this.using_item=action.UsingItem
        this.rotation=action.angle
        this.load_hand(action.hand)
        if(action.Reloading&&this.handItem&&this.handItem.itemType===InventoryItemType.gun){
            (this.handItem as GunItem).reloading=true
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
    update2(){
        if(this.client){
            const guiPacket=new GuiPacket(this.health,this.maxHealth,this.boost,this.maxBoost,this.BoostType)
            guiPacket.inventory=[]
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(!s.item)continue
                if(i===this.hand-1)this.handL=ii+1
                guiPacket.inventory.push({count:s.quantity,idNumber:s.item!.def.idNumber!,type:s.item.itemType})
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
                        guiPacket.hand=this.handItem?{type:this.handItem.itemType,location:this.handL}:undefined
                        break
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
        if(this.dead)return
        let damage=params.amount
        let mod=1
        if(this.vest){
            mod-=this.vest.reduction
            damage-=this.vest.defence
        }
        if(this.helmet){
            mod-=this.helmet.reduction
            damage-=this.helmet.defence
        }
        damage=Math.max(damage*mod,0)
        if(this.BoostType===BoostType.Shield&&this.boost>0){
            this.boost=Math.max(this.boost-damage,0)
        }else{
            this.health=Math.max(this.health-damage,0)
            if(this.health===0){
                this.kill(params)
            }
        }
    }
    kill(_params:DamageParams){
        this.dead=true
        this.update2()
        if(this.client){
            setTimeout(this.client.disconnect.bind(this.client),500)
        }
    }
}