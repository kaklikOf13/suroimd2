import { Player } from "../gameObjects/player.ts";
import { Bullet } from "../gameObjects/bullet.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Angle, Definition, getPatterningShape, random, v2 } from "common/scripts/engine/mod.ts";
import { FireMode, GunDef } from "common/scripts/definitions/guns.ts";
import { ItemCap, SlotCap } from "common/scripts/engine/inventory.ts";
import { InventoryItemType } from "common/scripts/definitions/utils.ts";
import { HealingAction, ReloadAction } from "./actions.ts";
import { AmmoDef } from "common/scripts/definitions/ammo.ts";
import { HealingCondition, HealingDef } from "common/scripts/definitions/healings.ts";
export abstract class LItem extends ItemCap{
  // deno-lint-ignore no-explicit-any
  abstract on_use(user:Player,slot:SlotCap<any>):void
  abstract update(user:Player):void
  abstract itemType:InventoryItemType
  abstract def:Definition
}
export class GunItem extends LItem{
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
    on_use(user:Player,_slot:SlotCap){
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
      if(!user.ammoCount[this.def.ammoType]){
        user.ammoCount[this.def.ammoType]=user.inventory.getCountTag(`ammo_${this.def.ammoType}`)
      }
      if(user.ammoCount[this.def.ammoType]!<=0){
        this.reloading=false
        return
      }
      user.privateDirtys.action=true
      const reload_need=(this.def.reload.shotsPerReload??(this.def.reload.capacity-this.ammo))
      user.actions.play(new ReloadAction(reload_need,this.def))
    }
    shot(user:Player){
      user.actions.cancel()
      user.privateDirtys.hand=true
      user.privateDirtys.action=true
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
export class AmmoItem extends LItem{
  limit_per_slot: number=Infinity
  def:AmmoDef
  cap: number
  itemType: InventoryItemType.ammo=InventoryItemType.ammo

  constructor(def:AmmoDef){
    super()
    this.def=def
    this.cap=def.size
    this.tags.push("ammo",`ammo_${this.def.ammoType}`)
  }
  is(other: LItem): boolean {
    return (other instanceof AmmoItem)&&other.def.idNumber==this.def.idNumber
  }
  on_use(_user: Player,_slot:SlotCap): void {
  }
  update(_user: Player): void {
    
  }
}
export class HealingItem extends LItem{
  limit_per_slot: number=Infinity
  def:HealingDef
  cap: number
  itemType: InventoryItemType.healing=InventoryItemType.healing

  constructor(def:HealingDef){
    super()
    this.def=def
    this.cap=def.size
  }
  is(other: LItem): boolean {
    return (other instanceof HealingItem)&&other.def.idNumber==this.def.idNumber
  }
  on_use(user: Player,slot:SlotCap): void {
    if(!user.using_item_down)return
    if(this.def.condition){
      for(const c of this.def.condition){
        switch(c){
          case HealingCondition.UnfullHealth:
            if(user.health>=user.maxHealth)return
            break
          case HealingCondition.UnfullExtra:
            if(!(user.extra<user.maxExtra||user.extraType!==this.def.extra_type))return
            break
        }
      }
    }
    user.privateDirtys.action=true
    user.actions.play(new HealingAction(this.def,slot))
  }
  update(_user: Player): void {
    
  }
}