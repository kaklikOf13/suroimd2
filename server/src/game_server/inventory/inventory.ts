import { Player } from "../gameObjects/player.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Angle, Item, random } from "common/scripts/engine/mod.ts";
import { GunDef } from "common/scripts/definitions/guns.ts";
export abstract class LItem extends Item{
  abstract on_use(user:Player):void
  abstract update(user:Player):void
}
export class GunItem extends Item{
    limit_per_slot: number=1;
    def:GunDef
    use_delay:number=0;
    constructor(def?:GunDef){
      super()
      this.def=def!
    }
    is(other: Item): boolean {
      return (other instanceof GunItem)
    }
    on_use(user:Player){
      if(this.use_delay<=0){
        const bc=this.def.bulletsCount??1
        for(let i=0;i<bc;i++){
          const b:Bullet=user.game.scene.objects.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{defs:this.def.bullet,position:user.position})
          let ang=user.rotation
          if(this.def.spread){
            ang+=Angle.deg2rad(random.float(-this.def.spread,this.def.spread))
          }
          b.set_direction(ang)
        }
        this.use_delay=this.def.fireDelay
      }
    }
    update(user:Player){
      this.use_delay-=1/user.game.tps
    }
}