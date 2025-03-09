import { BaseGameObject2D, CircleHitbox2D, random, Vec2 } from "common/scripts/engine/mod.ts"
import { Player } from "./player.ts";
import { ExplosionData } from "common/scripts/others/objectsEncode.ts";
import { ExplosionDef } from "common/scripts/definitions/explosions.ts";
import { Bullet } from "./bullet.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";

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
                    const b=this.manager.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{
                        defs:this.defs.bullet.def,
                        position:this.position
                    })as Bullet
                    b.set_direction(random.rad())
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