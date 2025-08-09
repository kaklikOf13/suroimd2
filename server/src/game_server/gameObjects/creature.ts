import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { type Player } from "./player.ts";
import { CreatureData } from "common/scripts/others/objectsEncode.ts";
import { type CreatureDef } from "../../../../common/scripts/definitions/objects/creatures.ts";
import { CreaturesUpdates, CreatureUFunc } from "../defs/creatures_extra.ts";
import { DamageParams } from "../others/utils.ts";
import { LootTableItemRet } from "common/scripts/engine/inventory.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { LootTables } from "common/scripts/definitions/maps/base.ts";
import { Obstacle } from "./obstacle.ts";

export class Creature extends ServerGameObject{
    stringType:string="creature"
    numberType: number=10

    update_func?:CreatureUFunc

    def!:CreatureDef
    state:number=0

    angle:number=0
    velocity:Vec2=v2.new(0,0)

    old_position=v2.new(-1,-1)
    old_rotation=0
    
    health:number=100
    dead:boolean=false

    loot:LootTableItemRet<GameItem>[]=[]

    constructor(){
        super()
    }
    kill(){
        if(this.dead)return
        this.dead=true
        this.dirty=true
        for(const l of this.loot){
            this.game.add_loot(this.position,l.item,l.count)
        }
    }
    damage(params:DamageParams){
        if(this.def.imortal)return
        this.health=Math.max(this.health-params.amount,0)
        if(this.health<=0){
            this.kill()
        }
    }

    update(dt:number): void {
        if(this.dead)return
        if(this.update_func)this.update_func(this,dt)
        if(!v2.is(this.old_position,this.position)||this.old_rotation!==this.angle){
            this.dirtyPart=true
            this.old_position=v2.duplicate(this.position)
            this.old_rotation=this.angle
            this.manager.cells.updateObject(this)
        }
        this.position=v2.add(this.position,v2.scale(this.velocity,dt))
        
        //Collision
        const objs=this.manager.cells.get_objects(this.hb,this.layer)
        for(const obj of objs){
            if(obj.id===this.id)continue
            switch(obj.stringType){
                case "obstacle":
                    if((obj as Obstacle).def.noCollision)break
                    if((obj as Obstacle).hb&&!(obj as Obstacle).dead){
                        const ov=this.hb.overlapCollision((obj as Obstacle).hb)
                        if(ov){
                            this.position=v2.sub(this.position,v2.scale(ov.dir,ov.pen))
                        }
                    }
                    break
            }
        }
        this.game.map.clamp_hitbox(this.hb)
    }
    override interact(_user: Player): void {
    }
    create(args: {position:Vec2,def:CreatureDef}): void {
        this.hb=args.def.hitbox.transform(args.position)
        this.def=args.def
        this.update_func=this.def.server_side.update?CreaturesUpdates[this.def.server_side.update](this.def.server_side.update_parameters,this):undefined
        this.health=this.def.health
        if(this.def.lootTable){
            this.loot=LootTables.get_loot(this.def.lootTable,{withammo:true})
        }
    }
    override getData(): CreatureData {
        return {
            position:this.position,
            angle:this.angle,
            state:this.state,
            full:{
                dead:this.dead,
                def:this.def.idNumber!
            }
        }
    }
}