import { CircleHitbox2D, NullVec2, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { LootData } from "common/scripts/others/objectsEncode.ts";
import { CATEGORYS, GameConstants } from "common/scripts/others/constants.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Player } from "./player.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";

export class Loot extends ServerGameObject{
    velocity:Vec2
    stringType:string="loot"
    numberType: number=2
    count:number=1
    item!:GameItem

    private loot_collisions:number[]=[]
    constructor(){
        super()
        this.velocity=v2.new(0,0)
        
    }
    interact(user: Player): void {
        this.destroy()
        user.give_item(this.item,this.count)
        return
    }
    update(dt:number): void {
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        this.loot_collisions=[]
        if(!v2.greater(this.velocity,NullVec2)){
            this.dirtyPart=true
        }
        const others:ServerGameObject[]=this.game.scene.cells.get_objects2(this.hb,CATEGORYS.LOOTS)
        for(const other of others){
            if(other.id===this.id||(other as Loot).loot_collisions.includes(this.id))continue
            const col=this.hb.overlapCollision(other.hb)
            if(col){
                (other as Loot).loot_collisions.push(this.id)
                this.velocity=v2.sub(this.velocity,v2.scale((col.dir.x===1&&col.dir.y===0)?v2.random(-1,1):col.dir,0.05))
            }
        }
        this.velocity=v2.scale(this.velocity,GameConstants.loot.velocityDecay)
    }
    create(args: {position:Vec2,item:GameItem,count:number}): void {
        this.hb=new CircleHitbox2D(v2.new(0,0),GameConstants.loot.radius.ammo)
        this.hb.translate(args.position)
        this.item=args.item
        this.count=args.count
    }
    getData(): LootData {
        return {
            position:this.position,
            full:{
            }
        }
    }
}