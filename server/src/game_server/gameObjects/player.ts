import { BaseGameObject2D, CircleHitbox2D, NullVec2, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { GunItem, LItem } from "../inventory/inventory.ts";
import { GunDef, Guns } from "common/scripts/definitions/guns.ts";

export class Player extends BaseGameObject2D{
    movement:Vec2
    oldPosition:Vec2
    objectType:string="player"
    numberType: number=1;
    name:string="a"
    handItem?:LItem
    using_item:boolean=false
    using_item_down:boolean=false
    rotation:number=0
    recoil?:{speed:number,delay:number}
    constructor(){
        super()
        this.movement=v2.new(0,0)
        this.oldPosition=this.position
        this.handItem=new GunItem(Guns.getFromString("m870"))
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
        this.handItem?.update(this)
        this.using_item_down=false
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.movement=v2.scale(action.Movement,0.05)
        if(!this.using_item&&action.UsingItem){
            this.using_item_down=true
        }
        this.using_item=action.UsingItem
        this.rotation=action.angle
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
}