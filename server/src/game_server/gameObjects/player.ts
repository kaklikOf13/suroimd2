import { BaseGameObject2D, CircleHitbox2D, NullVec2, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ActionPacket } from "common/scripts/packets/action_packet.ts"
import { PlayerData } from "common/scripts/others/objectsEncode.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { GunItem, LItem } from "../inventory/inventory.ts";

export class Player extends BaseGameObject2D{
    velocity:Vec2
    oldPosition:Vec2
    objectType:string="player"
    numberType: number=1;
    name:string="a"
    handItem?:LItem
    using_item:boolean=false

    rotation:number=0
    constructor(){
        super()
        this.velocity=v2.new(0,0)
        this.oldPosition=this.position
        this.handItem=new GunItem({
            bullet:{
                damage:10,
                radius:0.05,
                range:50,
                speed:0.3
            },
            fireDelay:0.1,
            bulletsCount:1,
            spread:1
        })
    }
    update(): void {
        this.position=v2.maxDecimal(v2.add(this.position,this.velocity),2)
        if(!v2.is(this.position,this.oldPosition)){
            this.dirtyPart=true
            this.oldPosition=this.position
        }
        if(this.using_item){
            this.handItem?.on_use(this)
        }
        this.handItem?.update(this)
    }
    process_action(action:ActionPacket){
        action.Movement=v2.normalizeSafe(v2.clamp1(action.Movement,-1,1),NullVec2)
        this.velocity=v2.scale(action.Movement,0.05)
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