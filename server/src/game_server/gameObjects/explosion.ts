import { BaseGameObject2D, CircleHitbox2D, random, v2, Vec2 } from "common/scripts/engine/mod.ts"
import { Player } from "./player.ts";
import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { type Game } from "../others/game.ts";
import { Projectiles } from "common/scripts/definitions/projectiles.ts";

export class Explosion extends BaseGameObject2D{
    stringType:string="explosion"
    numberType: number=5
    defs!:ExplosionDef

    owner?:Player

    radius:number=2
    constructor(){
        super()
        this.netSync.deletion=false
    }
    delay:number=3
    update(_dt:number): void {
        if(this.delay==0){
            if(this.defs.bullet){
                for(let i=0;i<this.defs.bullet.count;i++){
                    (this.game as Game).add_bullet(this.position,random.rad(),this.defs.bullet.def,this.owner)
                }
            }
            if(this.defs.projectiles){
                for(let i=0;i<this.defs.projectiles.count;i++){
                    const p=(this.game as Game).add_projectile(this.position,Projectiles.getFromString(this.defs.projectiles.def),this.owner)
                    p.velocity=v2.random(-this.defs.projectiles.speed,this.defs.projectiles.speed)
                    p.angularVelocity=this.defs.projectiles.angSpeed+(Math.random()*this.defs.projectiles.randomAng)
                }
            }
            this.destroy()
        }else{
            this.delay--
        }
    }
    create(args: {defs:ExplosionDef,position:Vec2}): void {
        this.defs=args.defs
        this.hb=new CircleHitbox2D(args.position,random.float(this.defs.size.min,this.defs.size.max))
    }
    getData(): ExplosionData {
        return {
            position:this.position,
            def:this.defs.idNumber!,
            radius:(this.hb as CircleHitbox2D).radius
        }
    }
}