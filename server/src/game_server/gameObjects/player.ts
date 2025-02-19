import { BaseGameObject2D, CircleHitbox2D, NullVec2, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { CATEGORYS, GameConstants } from "common/scripts/others/constants.ts";
import { GunItem, LItem } from "../inventory/inventory.ts";
import { Guns } from "common/scripts/definitions/guns.ts";
import { Client } from "../../engine/mod.ts";
import { GuiPacket } from "common/scripts/packets/gui_packet.ts";
import { DamageParams } from "../others/utils.ts";
import { Obstacle } from "./obstacle.ts";
import { ActionsManager, InventoryCap } from "common/scripts/engine/inventory.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";

export class Player extends BaseGameObject2D{
    movement:Vec2
    oldPosition:Vec2
    objectType:string="player"
    numberType: number=1;
    name:string="a"
    handItem:LItem|null=null
    using_item:boolean=false
    using_item_down:boolean=false
    rotation:number=0
    recoil?:{speed:number,delay:number}

    health:number=100
    maxHealth:number=100

    actions:ActionsManager<this>

    client?:Client

    inventory:InventoryCap<LItem>
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.inventory=new InventoryCap<LItem>(undefined,20)
        this.inventory.add(new GunItem(Guns.getFromString("m870")),1)
        this.inventory.add(new GunItem(Guns.getFromString("ak47")),1)
        this.actions=new ActionsManager(this)
        this.load_hand(0)
    }

    load_hand(h:number){
        if(this.hand==h)return
        this.hand=h
        this.handItem=this.inventory.slots[h].item
        this.recoil=undefined
        this.privateDirtys.hand=true
        this.actions.cancel()
    }

    dirtyPrivate=3
    dead=false
    hand:number=-1

    privateDirtys={
        inventory:true,
        hand:true,
        action:true
    }

    update(): void {
        let speed=1
        if(this.recoil){
            speed*=this.recoil.speed
            this.recoil.delay-=1/this.game.tps
            if(this.recoil.delay<=0)this.recoil=undefined
        }
        if(this.handItem?.tags.includes("gun")){
            speed*=(this.handItem as GunItem).def.speedMult??1
        }
        this.position=v2.maxDecimal(v2.add(this.position,v2.scale(this.movement,speed)),3)
        if(!v2.is(this.position,this.oldPosition)){
            this.dirtyPart=true
            this.oldPosition=this.position
        }
        if(this.using_item){
            this.handItem?.on_use(this)
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

        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            if((obj as BaseGameObject2D).id===this.id)continue
            switch((obj as BaseGameObject2D).objectType){
                case "obstacle":
                    if((obj as Obstacle).def.noCollision)break
                    if((obj as Obstacle).hb){
                        const ov=this.hb.overlapCollision((obj as Obstacle).hb)
                        if(ov.collided)this.position=v2.sub(this.position,v2.scale(ov.overlap,0.9))
                    }
                    break
            }
        }

        this.actions.update(1/this.game.tps)
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.movement=v2.scale(action.Movement,0.1)
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
            full:{
                name:this.name
            }
        }
    }
    handL=0
    update2(){
        if(this.client){
            const guiPacket=new GuiPacket(this.health,this.maxHealth)
            guiPacket.inventory=[]
            let ii=0
            for(let i=0;i<this.inventory.slots.length;i++){
                const s=this.inventory.slots[i]
                if(!s.item)continue
                if(i===this.hand)this.handL=ii
                guiPacket.inventory.push({count:s.quantity,idNumber:s.item!.def.idNumber!,type:s.item.itemType})
                ii++
            }
            
            guiPacket.hand=this.handItem?{ammo:(this.handItem as GunItem).ammo,type:this.handItem.itemType,location:this.handL}:undefined
            guiPacket.dirty=this.privateDirtys
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
        this.health=Math.max(this.health-params.amount,0)
        if(this.health===0){
            this.kill(params)
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