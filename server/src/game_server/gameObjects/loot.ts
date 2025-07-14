import { CircleHitbox2D, NullVec2, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { LootData } from "common/scripts/others/objectsEncode.ts";
import { CATEGORYS, GameConstants } from "common/scripts/others/constants.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Player } from "./player.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts"

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
        switch(this.item.item_type){
            case InventoryItemType.gun:{
                const r=user.inventory.give_gun(this.item.idString)
                if(r)this.destroy()
                break
            }
            case InventoryItemType.ammo:
            case InventoryItemType.healing:
            case InventoryItemType.equipament:
            case InventoryItemType.other:
            case InventoryItemType.melee:
            case InventoryItemType.accessorie:
        }
        //user.give_item(this.item,this.count)
        return
    }
    update(dt:number): void {
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        if(!v2.greater(this.velocity,NullVec2)){
            this.dirtyPart=true
        }
        const others:ServerGameObject[]=this.game.scene.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.LOOTS])
        for(const other of others){
            switch(other.stringType){
                case "loot":{
                    if(other.id===this.id)continue
                    const col=this.hb.overlapCollision(other.hb)
                    if(col){
                        this.velocity=v2.sub(this.velocity,v2.scale((col.dir.x===1&&col.dir.y===0)?v2.random(-1,1):col.dir,0.05))
                    }
                    break
                }
                case "obstacle":{
                    if(!(other as Obstacle).dead||(other as Obstacle).def.noCollision)break
                    const col=this.hb.overlapCollision(other.hb)
                    if(col){
                        this.position=v2.sub(this.position,v2.scale(col.dir,col.pen))
                        this.velocity=v2.sub(this.velocity,v2.scale(col.dir,0.1))
                    }
                    break
                }
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
    override getData(): LootData {
        return {
            position:this.position,
            full:{
                item:GameItems.keysString[this.item.idString]
            }
        }
    }
}