import { Angle, Hitbox2D, LootTableItemRet, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { ObstacleDef } from "../../../../common/scripts/definitions/objects/obstacles.ts";
import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { DamageParams } from "../others/utils.ts";
import { random } from "common/scripts/engine/random.ts";
import { type Player } from "./player.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { LootTables } from "common/scripts/definitions/maps/base.ts";
import { Explosions } from "common/scripts/definitions/explosions.ts";

export class Obstacle extends ServerGameObject{
    stringType:string="obstacle"
    numberType: number=4

    def!:ObstacleDef
    spawnHitbox!:Hitbox2D

    health:number=0

    constructor(){
        super()
    }
    scale:number=1
    maxScale:number=1

    variation:number=1
    rotation:number=0

    dead:boolean=false

    loot:LootTableItemRet<GameItem>[]=[]

    update(_dt:number): void {

    }
    interact(_user: Player): void {
        return
    }
    
    create(args: {def:ObstacleDef,rotation:number,variation?:number}): void {
        this.def=args.def
        
        if(args.variation){
            this.variation=args.variation
        }else if(this.def.variations){
            this.variation=random.int(1,this.def.variations)
        }
        if(args.rotation){
            this.rotation=args.rotation
        }else if(this.def.rotationMode){
            this.rotation=Angle.random_rotation_modded(this.def.rotationMode)
        }
        this.health=this.def.health

        if(this.def.lootTable){
            this.loot=LootTables.get_loot(this.def.lootTable,{withammo:true})
        }

        if(this.def.scale?.min&&this.def.scale.max){
            this.maxScale=random.float(this.def.scale.min,this.def.scale.max)
            this.scale=this.maxScale
        }
    }
    set_position(position:Vec2){
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(position)
        }else{
            this.position=position
        }

        if(this.def.spawnHitbox){
            this.spawnHitbox=this.def.spawnHitbox.transform(position)
        }else{
            this.spawnHitbox=this.hb.clone()
        }
        this.reset_scale()
    }
    override getData(): ObstacleData {
        return {
            full:{
                definition:this.def.idNumber!,
                position:this.position,
                variation:this.variation,
                rotation:this.rotation
            },
            health:this.health/this.def.health,
            dead:this.dead,
            scale:this.scale
        }
    }
    reset_scale(){
        if(this.def.hitbox&&this.def.scale){
            const destroyScale = (this.def.scale.destroy ?? 1)*this.maxScale;
            this.scale=Math.max(this.health / this.def.health*(this.maxScale - destroyScale) + destroyScale,0)
            const pos=v2.duplicate(this.position)
            this.hb=this.def.hitbox.transform(pos,this.scale)
        }
    }
    damage(params:DamageParams){
        if(this.dead)return
        this.health=Math.max(this.health-params.amount,0)
        if(this.health===0){
            this.kill(params)
        }else{
            this.reset_scale()
        }
        this.dirtyPart=true
    }
    kill(params:DamageParams){
        if(this.dead)return
        if(this.def.onDestroyExplosion){
            this.game.add_explosion(this.hb.center(),Explosions.getFromString(this.def.onDestroyExplosion),params.owner,this.def)
        }
        for(const l of this.loot){
            this.game.add_loot(this.position,l.item,l.count)
        }

        this.dirtyPart=true
        this.dead=true
    }
}