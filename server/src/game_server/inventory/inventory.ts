import { Player } from "../gameObjects/player.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Angle, Definition, getPatterningShape, random, v2 } from "common/scripts/engine/mod.ts";
import { FireMode, GunDef } from "common/scripts/definitions/guns.ts";
import { ItemCap } from "common/scripts/engine/inventory.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { ReloadAction } from "./actions.ts";
export abstract class LItem extends ItemCap{
  abstract on_use(user:Player):void
  abstract update(user:Player):void
  abstract itemType:InventoryItemType
  abstract def:Definition
}
export class GunItem extends ItemCap{
    limit_per_slot: number=1
    def:GunDef
    use_delay:number=0
    cap:number

    ammo:number=0
    constructor(def?:GunDef){
      super()
      this.def=def!
      this.tags.push("gun")
      this.cap=this.def.size
      this.ammo=this.def.reload.capacity
    }
    reloading=false
    itemType=InventoryItemType.gun
    is(other: ItemCap): boolean {
      return (other instanceof GunItem)&&other.def.idNumber==this.def.idNumber
    }
    on_use(user:Player){
      if(this.def.fireMode===FireMode.Single&&!user.using_item_down)return
      if(this.use_delay<=0&&this.ammo>0){
        this.shot(user)
        this.use_delay=this.def.fireDelay
      }
    }
    reload(user:Player){
      if(this.ammo>=this.def.reload.capacity){
        this.reloading=false
        this.ammo=this.def.reload.capacity
        return
      }
      user.actions.play(new ReloadAction(this.def.reload.shotsPerReload??this.def.reload.capacity,this.def))
    }
    shot(user:Player){
      user.actions.cancel()
      const bc=this.def.bulletsCount??1
      this.reloading=false
      this.ammo--
      const position=v2.add(
        user.position,
        v2.mult(v2.from_RadAngle(user.rotation),v2.new(this.def.lenght,this.def.lenght))
      )
      const patternPoint = getPatterningShape(bc, this.def.jitterRadius??1);
      for(let i=0;i<bc;i++){
        const b:Bullet=user.game.scene.objects.add_object(new Bullet(),CATEGORYS.BULLETS,undefined,{defs:this.def.bullet,position:this.def.jitterRadius?v2.add(position,patternPoint[i]):position})
        let ang=user.rotation
        if(this.def.spread){
          ang+=Angle.deg2rad(random.float(-this.def.spread,this.def.spread))
        }
        b.set_direction(ang)
        b.owner=user
      }
      if(this.def.recoil){
        user.recoil={delay:this.def.recoil.duration,speed:this.def.recoil.speed}
      }
    }
    update(user:Player){
      if(user.handItem===this&&(this.ammo<=0||this.reloading)&&!user.actions.current_action){
        this.reloading=true
        this.reload(user)
      }
      this.use_delay-=1/user.game.tps
    }
}