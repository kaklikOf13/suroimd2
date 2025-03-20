import { BaseGameObject2D, CircleHitbox2D, NullVec2, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { type Player } from "./player.ts";
import { type Game } from "../others/game.ts";
import { ProjectileDef } from "common/scripts/definitions/projectiles.ts";
import { Explosions } from "common/scripts/definitions/explosions.ts";
import { ProjectileData } from "common/scripts/others/objectsEncode.ts";

export class Projectile extends BaseGameObject2D{
    stringType:string="projectile"
    numberType: number=6
    defs!:ProjectileDef

    owner?:Player

    zpos:number=1
    rotation:number=0

    velocity:Vec2
    angularVelocity:number

    constructor(){
        super()
        this.velocity=v2.new(3,0)
        this.angularVelocity=10
    }

    fuse_delay:number=0
    update(dt:number): void {
        if(!v2.is(this.velocity,NullVec2)){
            this.position=v2.add(this.position,v2.scale(this.velocity,dt))
            this.manager.cells.updateObject(this)
            this.dirtyPart=true
        }
        if(this.angularVelocity!=0){
            this.rotation+=this.angularVelocity*dt
            this.dirtyPart=true
        }
        if(this.zpos>0){
            this.zpos=Math.max(this.zpos-this.defs.gravity*dt,0)
        }else{
            this.angularVelocity=Numeric.lerp(this.angularVelocity,0,dt*this.defs.decays.ground_rotation)
            this.velocity=v2.lerp(this.velocity,NullVec2,dt*this.defs.decays.ground_speed)
        }
        if(this.defs.cook){
            this.fuse_delay-=dt
            if(this.fuse_delay<=0){
                this.destroy();
                if(this.defs.explosion)(this.game as Game).add_explosion(this.position,Explosions.getFromString(this.defs.explosion),this.owner)
            }
        }
    }
    create(args: {defs:ProjectileDef,position:Vec2}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(v2.duplicate(args.position),this.defs.radius)
        if(this.defs.cook){
            this.fuse_delay=this.defs.cook.fuse_time
        }
    }
    getData(): ProjectileData {
        return {
            position:this.position,
            rotation:this.rotation,
            z:this.zpos,
            full:{
                definition:this.defs.idNumber!
            }
        }
    }
}