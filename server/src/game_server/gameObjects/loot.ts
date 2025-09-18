import { CircleHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { LootData } from "common/scripts/others/objectsEncode.ts";
import { GameConstants } from "common/scripts/others/constants.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Player } from "./player.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { type Obstacle } from "./obstacle.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts"
import { EquipamentDef, EquipamentType } from "common/scripts/definitions/items/equipaments.ts";
import { BackpackDef } from "common/scripts/definitions/items/backpacks.ts";
import { SkinDef } from "common/scripts/definitions/loadout/skins.ts";
import { GunDef } from "common/scripts/definitions/items/guns.ts";

export class Loot extends ServerGameObject{
    velocity:Vec2
    stringType:string="loot"
    numberType: number=2
    count:number=1
    item!:GameItem
    real_radius=0

    constructor(){
        super()
        this.velocity=v2.new(0,0)
        
    }
    reduce_count(count:number){
        this.count-=count
        this.destroy()
        if(this.count>0){
            this.game.add_loot(this.position,this.item,this.count,this.layer)
        }
    }
    interact(user: Player): void {
        switch(this.item.item_type){
            case InventoryItemType.gun:{
                const r=user.inventory.give_gun(this.item as unknown as GunDef)
                if(r)this.reduce_count(1)
                break
            }
            case InventoryItemType.ammo:
            case InventoryItemType.consumible:{
                user.inventory.give_item(this.item,this.count)
                this.destroy()
                break
            }
            case InventoryItemType.equipament:{
                const d=this.item as unknown as EquipamentDef
                switch(d.type){
                    case EquipamentType.Helmet:
                        if(!user.helmet){
                            user.helmet=d
                            user.dirty=true
                            this.reduce_count(1)
                        }else if(user.helmet.level<d.level){
                            user.game.add_loot(user.position,user.helmet as unknown as GameItem,1)
                            user.helmet=d
                            user.dirty=true
                            this.reduce_count(1)
                        }
                        break
                    case EquipamentType.Vest:
                        if(!user.vest){
                            user.vest=d
                            user.dirty=true
                            this.reduce_count(1)
                        }else if(user.vest.level<d.level){
                            user.game.add_loot(user.position,user.vest as unknown as GameItem,1)
                            user.vest=d
                            user.dirty=true
                            this.reduce_count(1)
                        }
                        break
                }
                break
            }
            case InventoryItemType.backpack:{
                const d=this.item as unknown as BackpackDef
                if(user.inventory.backpack.level<d.level){
                    user.dirty=true
                    user.inventory.set_backpack(d)
                    this.reduce_count(1)
                }
                break
            }
            case InventoryItemType.other:
            case InventoryItemType.melee:
            case InventoryItemType.accessorie:
                break
            case InventoryItemType.scope:
                
                break
            case InventoryItemType.skin:
                if(user.skin.idString!==this.item.idString){
                    this.game.add_loot(this.position,user.skin as unknown as GameItem,1)
                    user.skin=this.item as unknown as SkinDef
                    user.dirty=true
                    this.reduce_count(1)
                }
                break
        }
        //user.give_item(this.item,this.count)
        return
    }
    oldPos:Vec2=v2.new(-1,-1)
    update(dt:number): void {
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        if(!v2.is(this.position,this.oldPos)){
            this.dirtyPart=true
            this.oldPos=v2.duplicate(this.position)
            this.game.map.clamp_hitbox(this.hb)
            this.manager.cells.updateObject(this)
        }
        const others=this.manager.cells.get_objects(this.hb,this.layer)
        for(const other of others){
            switch(other.stringType){
                case "loot":{
                    if(other.id===this.id)continue
                    const col=this.hb.overlapCollision(other.hb)
                    if(col){
                        this.velocity=v2.sub(this.velocity,v2.scale((col.dir.x===1&&col.dir.y===0)?v2.random(-1,1):col.dir,0.03))
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
        this.velocity=v2.scale(this.velocity,1/(1+dt*GameConstants.loot.velocityDecay))
    }
    push(speed:number,angle:number){
        this.velocity=v2.add(this.velocity,v2.scale(v2.from_RadAngle(angle),speed))
    }
    create(args: {position:Vec2,item:GameItem,count:number}): void {
        this.hb=new CircleHitbox2D(v2.new(0,0),0.3)
        this.hb.translate(args.position)
        this.item=args.item
        this.count=args.count
        switch(this.item.item_type){
            case InventoryItemType.gun:
                this.hb.radius=GameConstants.loot.radius.gun
                break
            case InventoryItemType.ammo:
                this.hb.radius=GameConstants.loot.radius.ammo
                break
            case InventoryItemType.consumible:
                this.hb.radius=GameConstants.loot.radius.consumible
                break
            case InventoryItemType.backpack:
            case InventoryItemType.equipament:
                this.hb.radius=GameConstants.loot.radius.equipament
                break
            case InventoryItemType.other:
            case InventoryItemType.melee:
            case InventoryItemType.accessorie:
            case InventoryItemType.skin:
                this.hb.radius=GameConstants.loot.radius.skin
                break
        }
        this.real_radius=this.hb.radius
    }
    override getData(): LootData {
        return {
            position:this.position,
            full:{
                item:GameItems.keysString[this.item.idString],
                count:this.count
            }
        }
    }
}