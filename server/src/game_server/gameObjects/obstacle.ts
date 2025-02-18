import { Angle, BaseGameObject2D, Vec2 } from "common/scripts/engine/mod.ts"
import { ObstacleDef } from "common/scripts/definitions/obstacles.ts";
import { ObstacleData } from "common/scripts/others/objectsEncode.ts";
import { DamageParams } from "../others/utils.ts";
import { random } from "common/scripts/engine/random.ts";

export class Obstacle extends BaseGameObject2D{
    objectType:string="obstacle"
    numberType: number=4

    def!:ObstacleDef
    _position!:Vec2

    health:number=0

    constructor(){
        super()
    }
    scale:number=1
    maxScale:number=1

    variation:number=1
    rotation:number=0

    update(): void {

    }
    create(args: {def:ObstacleDef,position:Vec2,rotation:number,variation?:number}): void {
        this.def=args.def
        if(this.def.hitbox){
            this.hb=this.def.hitbox.transform(args.position)
            this._position=this.hb.position
        }else{
            this._position=args.position
        }
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
    }
    getData(): ObstacleData {
        return {
            full:{
                definition:this.def.idNumber!,
                position:this._position,
                variation:this.variation,
                rotation:this.rotation
            },
            scale:this.scale
        }
    }
    reset_scale(){
        if(this.def.hitbox&&this.def.scale){
            const destroyScale = (this.def.scale.destroy ?? 1)*this.maxScale;
            this.scale=Math.max(this.health / this.def.health*(this.maxScale - destroyScale) + destroyScale,0);
            this.hb=this.def.hitbox.transform(this._position,this.scale)
            this._position=this.hb.position
        }
    }
    damage(params:DamageParams){
        this.health=Math.max(this.health-params.amount,0)
        if(this.health===0){
            this.destroy()
        }else{
            this.reset_scale()
        }
        this.dirtyPart=true
    }
}