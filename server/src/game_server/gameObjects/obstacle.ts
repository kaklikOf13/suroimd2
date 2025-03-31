import { Angle, Hitbox2D, LootTableItemRet, Vec2 } from "common/scripts/engine/mod.ts"
import { ObstacleDef } from "common/scripts/definitions/obstacles.ts";
import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { DamageParams } from "../others/utils.ts";
import { random } from "common/scripts/engine/random.ts";
import { Explosions } from "common/scripts/definitions/explosions.ts";
import { Game } from "../others/game.ts";
import { type Player } from "./player.ts";
import { ServerGameObject } from "../others/gameObject.ts";
import { GameItem } from "common/scripts/definitions/utils.ts";
import { LootTables } from "common/scripts/definitions/maps/base.ts";

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
        this.reset_scale()

        if(this.def.lootTable){
            this.loot=LootTables.get_loot(this.def.lootTable,{withammo:true})
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
    }
    getData(): ObstacleData {
        return {
            full:{
                definition:this.def.idNumber!,
                position:this.position,
                variation:this.variation,
                rotation:this.rotation
            },
            dead:this.dead,
            scale:this.scale
        }
    }
    reset_scale(){
        if(this.def.hitbox&&this.def.scale){
            const destroyScale = (this.def.scale.destroy ?? 1)*this.maxScale;
            this.scale=Math.max(this.health / this.def.health*(this.maxScale - destroyScale) + destroyScale,0)
        }
    }
    damage(params:DamageParams){
        if(this.dead)return
        this.health=Math.max(this.health-params.amount,0)
        if(this.health===0){
            if(this.def.onDestroyExplosion){
                (this.game as Game).add_explosion(this.hb.center(),Explosions.getFromString(this.def.onDestroyExplosion),params.owner)
            }

            for(const l of this.loot){
                (this.game as Game).add_loot(this.position,l.item,l.count)
            }

            this.dirtyPart=true
            this.dead=true
        }else{
            this.reset_scale()
        }
        this.dirtyPart=true
    }
}