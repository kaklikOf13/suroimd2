import { BaseGameObject2D, CircleHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { BulletDef } from "common/scripts/definitions/utils.ts";

export class Bullet extends BaseGameObject2D{
    velocity:Vec2
    objectType:string="bullet"
    numberType: number=3
    defs!:BulletDef
    initialPosition!:Vec2
    maxDistance:number=0
    constructor(){
        super()
        this.velocity=v2.new(0,0)
    }
    update(): void {
        if(v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.destroyed=true
        }
        this.position=v2.add(this.position,this.velocity)
    }
    create(args: {defs:BulletDef,position:Vec2}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(v2.duplicate(args.position),this.defs.radius)
        this.initialPosition=v2.duplicate(this.hb.position)
        this.maxDistance=this.defs.range/3.5
    }
    set_direction(angle:number){
        this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(angle),this.defs.speed),4)
        this.dirty=true
    }
    getData(): BulletData {
        return {
            position:this.position,
            radius:(this.hb as CircleHitbox2D).radius,
            speed:this.velocity
        }
    }
}