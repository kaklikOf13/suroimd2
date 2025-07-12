import { type Player } from "../gameObjects/player.ts";
import { Angle, CircleHitbox2D, Definition, getPatterningShape, random, v2 } from "common/scripts/engine/mod.ts";
import { FireMode, GunDef, Guns } from "common/scripts/definitions/guns.ts";
import { Inventory, Item, SlotCap } from "common/scripts/engine/inventory.ts";
import { BoostType, DamageReason, GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { HealingAction, ReloadAction } from "./actions.ts";
import { AmmoDef } from "common/scripts/definitions/ammo.ts";
import { HealingCondition, HealingDef } from "common/scripts/definitions/healings.ts";
import { OtherDef } from "common/scripts/definitions/others.ts";
import { CellphoneAction, CellphoneActionType } from "common/scripts/packets/action_packet.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";
import { MeleeDef, Melees } from "common/scripts/definitions/melees.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { type ServerGameObject } from "../others/gameObject.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { Projectiles } from "common/scripts/definitions/projectiles.ts";
export abstract class LItem extends Item{
  abstract on_use(user:Player,slot?:LItem):void
  abstract update(user:Player):void
  abstract itemType:InventoryItemType
  abstract def:Definition
  droppable:boolean=true
}
export class GunItem extends LItem{
    def:GunDef
    use_delay:number=0
    cap:number

    ammo:number=0

    type="gun"
    constructor(def?:GunDef,droppable=true){
      super()
      this.def=def!
      this.tags.push("gun")
      this.cap=this.def.size
      this.ammo=this.def.reload?this.def.reload.capacity:Infinity
      this.droppable=droppable
    }
    reloading=false
    itemType=InventoryItemType.gun
    is(other: LItem): boolean {
      return (other instanceof GunItem)&&other.def.idNumber==this.def.idNumber
    }
    on_use(user:Player,_slot?:LItem){
      if(this.def.fireMode===FireMode.Single&&!user.using_item_down)return
      if(this.use_delay<=0&&(this.ammo>0||!this.def.reload)&&(!this.def.mana_consume||this.has_mana(user))){
        this.shot(user)
        this.use_delay=this.def.fireDelay
      }
    }
    has_mana(user:Player){
      return user.BoostType===BoostType.Mana&&this.def.mana_consume!*user.modifiers.mana_consume<=user.boost
    }
    reload(user:Player){
      if(!this.def.reload)return
      if(this.ammo>=this.def.reload.capacity){
        this.reloading=false
        this.ammo=this.def.reload.capacity
        return
      }
      user.privateDirtys.action=true
      user.actions.play(new ReloadAction(this))
    }
    shot(user:Player){
      user.actions.cancel()
      user.privateDirtys.action=true
      this.reloading=false
      if(this.def.reload)this.ammo--
      if(this.def.mana_consume)user.boost=Math.max(user.boost-this.def.mana_consume*user.modifiers.mana_consume,0)
      const position=v2.add(
        user.position,
        v2.mult(v2.from_RadAngle(user.rotation),v2.new(this.def.lenght,this.def.lenght))
      )
      if(this.def.bullet){
        const bc=this.def.bullet.count??1
        const patternPoint = getPatterningShape(bc, this.def.jitterRadius??1);
        for(let i=0;i<bc;i++){
          let ang=user.rotation
          if(this.def.spread){
            ang+=Angle.deg2rad(random.float(-this.def.spread,this.def.spread))
          }
          const b=user.game.add_bullet(this.def.jitterRadius?v2.add(position,patternPoint[i]):position,ang,this.def.bullet.def,user,this.def.ammoType,this.def as unknown as GameItem)
          b.modifiers={
            speed:user.modifiers.bullet_speed,
            size:user.modifiers.bullet_size,
          }
          b.set_direction(ang)
        }
      }
      if(this.def.projectile){
        const pc=this.def.projectile.count??1
        const patternPoint = getPatterningShape(pc, this.def.jitterRadius??1);
        const def=Projectiles.getFromString(this.def.projectile.def)
        for(let i=0;i<pc;i++){
          let ang=user.rotation
          if(this.def.spread){
            ang+=Angle.deg2rad(random.float(-this.def.spread,this.def.spread))
          }
          const p=user.game.add_projectile(this.def.jitterRadius?v2.add(position,patternPoint[i]):position,def,user)
          p.throw_projectile(ang,this.def.projectile.speed,this.def.projectile.angular_speed)
        }
      }
      if(this.def.recoil){
        user.recoil={delay:this.def.recoil.duration,speed:this.def.recoil.speed}
      }

      user.privateDirtys.current_weapon=true
    }
    update(user:Player){
      if(user.inventory.currentWeapon===this&&(this.ammo==0||this.reloading)&&this.def.reload&&!user.actions.current_action){
        this.reloading=true
        this.reload(user)
      }
      this.use_delay-=1/user.game.tps
    }
}
export class AmmoItem extends LItem{
  def:AmmoDef
  cap: number
  itemType: InventoryItemType.ammo=InventoryItemType.ammo

  type="ammo"
  constructor(def:AmmoDef,droppable=true){
    super()
    this.def=def
    this.cap=def.size
    this.droppable=droppable
    this.tags.push("ammo",`ammo_${this.def.ammoType}`)
  }
  is(other: LItem): boolean {
    return (other instanceof AmmoItem)&&other.def.idNumber==this.def.idNumber
  }
  on_use(_user: Player,_slot?:LItem): void {
  }
  update(_user: Player): void {
    
  }
}
export class HealingItem extends LItem{
  def:HealingDef
  cap: number
  itemType: InventoryItemType.healing=InventoryItemType.healing

  type="healing"
  constructor(def:HealingDef,droppable=true){
    super()
    this.def=def
    this.cap=def.size
    this.droppable=droppable
  }
  is(other: LItem): boolean {
    return (other instanceof HealingItem)&&other.def.idNumber==this.def.idNumber
  }
  on_use(user: Player,slot?:LItem): void {
    if(!user.using_item_down||!user.handItem||!user.handItem.is(this))return
    if(this.def.condition){
      for(const c of this.def.condition){
        switch(c){
          case HealingCondition.UnfullHealth:
            if(user.health>=user.maxHealth)return
            break
          case HealingCondition.UnfullExtra:
            if(!(user.boost<user.maxBoost||user.BoostType!==this.def.boost_type))return
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
export class OtherItem extends LItem{
  def:OtherDef
  cap: number
  itemType: InventoryItemType.other=InventoryItemType.other

  type="other"
  constructor(def:OtherDef,droppable:boolean=true){
    super()
    this.def=def
    this.cap=def.size
    this.droppable=droppable
  }
  is(other: LItem): boolean {
    return (other instanceof OtherItem)&&other.def.idNumber==this.def.idNumber
  }
  on_use(_user: Player,_slot:SlotCap): void {
    
  }
  cellphone_action(user:Player,action:CellphoneAction){
    if(this.def.idString!=="cellphone")return
    switch(action!.type){
      case CellphoneActionType.GiveItem:
        user.give_item(GameItems.valueNumber[action!.item_id],action!.count)
        break
      case CellphoneActionType.SpawnObstacle:
    }
    
  }
  update(_user: Player): void {
    
  }
}
export class MeleeItem extends LItem{
  def:MeleeDef
  cap: number
  itemType: InventoryItemType.melee=InventoryItemType.melee
  use_delay:number=0

  type="melee"
  constructor(def:MeleeDef,droppable=true){
    super()
    this.cap=def.size
    this.limit_per_slot=1
    this.def=def
    this.droppable=droppable
  }
  is(other: LItem): boolean {
    return (other instanceof MeleeItem)&&other.def.idNumber==this.def.idNumber
  }
  attack(user:Player):void{
    if(!(user.handItem&&user.handItem.is(this)))return
    const position=v2.add(
      user.position,
      v2.mult(v2.from_RadAngle(user.rotation),v2.new(this.def.offset,this.def.offset))
    )
    const hb=new CircleHitbox2D(position,this.def.radius)
    const collidibles:ServerGameObject[]=user.manager.cells.get_objects(hb,[CATEGORYS.PLAYERS,CATEGORYS.OBSTACLES])
    for(const c of collidibles){
      if(!hb.collidingWith(c.hb))continue
      if(c instanceof Obstacle){
        c.damage({
          amount:this.def.damage,
          critical:false,
          position:hb.position,
          reason:DamageReason.Player,
          owner:user,
          source:this.def as unknown as GameItem
        })
      }else if(c instanceof Player&&c.id!==user.id){
        c.damage({
          amount:this.def.damage,
          critical:false,
          position:hb.position,
          reason:DamageReason.Player,
          owner:user,
          source:this.def as unknown as GameItem
        })
      }
    }
  }
  on_use(user: Player,_slot?:LItem): void {
    if(this.use_delay<=0){
      for(const t of this.def.damage_delays){
        user.game.addTimeout(this.attack.bind(this,user),t)
        this.use_delay=this.def.attack_delay
      }
    }
  }
  update(user: Player): void {
    this.use_delay-=1/user.game.tps
  }
}
export class GInventory extends Inventory<LItem>{

  weapons:{
    0?:MeleeItem,
    1?:GunItem,
    2?:GunItem
  }={0:undefined,1:undefined,2:undefined}
  owner:Player

  weaponIdx:number=-1
  currentWeapon:GunItem|MeleeItem|undefined
  currentWeaponDef:GunDef|MeleeDef|undefined

  constructor(owner:Player){
    super(7)
    this.owner=owner
  }

  set_current_weapon_index(idx:number){
    if(this.weaponIdx===idx)return
  
    if(this.currentWeapon){
        switch(this.currentWeapon.type){
          case "gun":
            (this.currentWeapon as GunItem).reloading=false
            break
          case "melee":
             (this.currentWeapon as MeleeItem).use_delay=(this.currentWeaponDef as MeleeDef).attack_delay
            break
        }
    }

    const val=this.weapons[idx as keyof typeof this.weapons] as GunItem|MeleeItem|undefined
    this.weaponIdx=idx

    this.currentWeapon=val
    this.currentWeaponDef=val?.def

    this.owner.recoil=undefined
    this.owner.privateDirtys.weapons=true
    this.owner.privateDirtys.current_weapon=true
    this.owner.privateDirtys.action=true
    this.owner.actions.cancel()

    this.owner.dirty=true
  }
  set_weapon(slot:number=0,id:string=""){
    if(slot===0){
      this.weapons[slot]=new MeleeItem(Melees.getFromString(id),true)
    }else if(slot==1||slot==2){
      this.weapons[slot]=new GunItem(Guns.getFromString(id),true)
    }
    this.owner.privateDirtys.weapons=true
    this.owner.privateDirtys.current_weapon=true
  }

  give_item(def:GameItem,count:number,droppable:boolean=true){
      switch(def.item_type){
          case InventoryItemType.ammo:
              this.add(new AmmoItem(def as unknown as AmmoDef,droppable),count)
              break
          case InventoryItemType.healing:
              this.add(new HealingItem(def as unknown as HealingDef,droppable),count)
              break
          case InventoryItemType.equipament:
              break
          /*case InventoryItemType.other:
              this.add(new OtherItem(def as unknown as OtherDef,droppable),count)
              break*/
      }
      this.owner.privateDirtys.inventory=true
  }
  update(){
    //this.weapons[0]?.update(this.owner)
    this.weapons[1]?.update(this.owner)
    this.weapons[2]?.update(this.owner)
  }
}