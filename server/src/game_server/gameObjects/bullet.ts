import { BaseGameObject2D, CircleHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { BulletData } from "common/scripts/others/objectsEncode.ts";
import { BulletDef } from "common/scripts/definitions/utils.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacle } from "./obstacle.ts";
import { Player } from "./player.ts";

export class Bullet extends BaseGameObject2D{
    velocity:Vec2
    objectType:string="bullet"
    numberType: number=3
    defs!:BulletDef

    initialPosition!:Vec2
    maxDistance:number=0

    owner?:Player
    angle:number=0
    constructor(){
        super()
        this.velocity=v2.new(0,0)
        this.sendDelete=false
    }
    update(): void {
        if(v2.distance(this.initialPosition,this.position)>this.maxDistance){
            this.destroy()
        }
        this.position=v2.add(this.position,this.velocity)
        const objs=this.manager.cells.get_objects(this.hb,[CATEGORYS.OBSTACLES,CATEGORYS.PLAYERS])
        for(const obj of objs){
            switch((obj as BaseGameObject2D).objectType){
                case "player":
                    if((obj as Player).hb&&this.hb.collidingWith((obj as Player).hb)){
                        (obj as Player).damage({amount:this.defs.damage,owner:this.owner})
                        this.destroy()
                        break
                    }
                    break
                case "obstacle":
                    if((obj as Obstacle).def.noCollision||(obj as Obstacle).def.noBulletCollision)break
                    if((obj as Obstacle).hb&&this.hb.collidingWith((obj as Obstacle).hb)){
                        (obj as Obstacle).damage({amount:this.defs.damage,owner:this.owner})
                        this.destroy()
                    }
                    break
            }
        }
    }
    create(args: {defs:BulletDef,position:Vec2}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(v2.duplicate(args.position),this.defs.radius)
        this.initialPosition=v2.duplicate(this.hb.position)
        this.maxDistance=this.defs.range/2.5
    }
    set_direction(angle:number){
        this.velocity=v2.maxDecimal(v2.scale(v2.from_RadAngle(angle),this.defs.speed),4)
        this.dirty=true
        this.angle=angle
    }
    getData(): BulletData {
        return {
            position:this.position,
            initialPos:this.initialPosition,
            maxDistance:this.maxDistance,
            radius:(this.hb as CircleHitbox2D).radius,
            speed:this.defs.speed,
            angle:this.angle,
            tracer:this.defs.tracer
        }
    }
}