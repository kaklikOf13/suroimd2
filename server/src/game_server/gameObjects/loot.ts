import { NullVec2, RectHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
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
    constructor(){
        super()
        this.velocity=v2.new(0,0)
        
    }
    interact(user: Player): void {
        this.destroy()
        user.give_item(this.item,this.count)
        return
    }
    update(_dt:number): void {
        this.position=v2.add(this.position,this.velocity)
        if(!v2.greater(this.velocity,NullVec2)){
            this.dirtyPart=true
        }
        const others:ServerGameObject[]=this.game.scene.cells.get_objects2(this.hb,CATEGORYS.LOOTS)
        for(const other of others){
            if(other.id===this.id)continue
            const col=this.hb.overlapCollision(other.hb)
            if(col.collided){
                this.velocity=v2.sub(this.velocity,v2.scale(col.overlap,0.0012));
                (other as Loot).velocity=v2.add((other as Loot).velocity,v2.scale(col.overlap,0.0012))
            }
        }
        this.velocity=v2.scale(this.velocity,GameConstants.loot.velocityDecay)
    }
    create(args: {position:Vec2,item:GameItem,count:number}): void {
        this.hb=new RectHitbox2D(v2.new(0,0),v2.new(GameConstants.loot.radius.ammo,GameConstants.loot.radius.ammo))
        this.hb.position=args.position
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