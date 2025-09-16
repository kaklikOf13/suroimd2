import { LootData } from "common/scripts/others/objectsEncode.ts";
import { Angle, CircleHitbox2D, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { GameObject } from "../others/gameObject.ts";
import { type Camera2D, Container2D, type Renderer, type Sound, Sprite2D } from "../engine/mod.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts"
import { GunDef } from "common/scripts/definitions/items/guns.ts";
import { ease } from "common/scripts/engine/utils.ts";
import { SkinDef } from "common/scripts/definitions/loadout/skins.ts";
import { EquipamentDef, EquipamentType } from "common/scripts/definitions/items/equipaments.ts";
export class Loot extends GameObject{
    stringType:string="loot"
    numberType: number=2
    name:string=""
    container:Container2D=new Container2D()

    item!:GameItem
    count:number=1

    sprite_main:Sprite2D=new Sprite2D()
    sprite_outline:Sprite2D=new Sprite2D()

    pickup_sound:Sound|undefined
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(3,3),0.3)
        this.game.camera.addObject(this.container)
    }
    update(dt:number): void {
        if(this.dest_pos){
            this.position=v2.lerp(this.position,this.dest_pos,this.game.inter_global)
        }
        this.container.position=this.position
        this.manager.cells.updateObject(this)
    }
    constructor(){
        super()
        this.container.visible=false
        this.sprite_main.hotspot=v2.new(.5,.5)
        this.sprite_main.visible=false
        this.sprite_main.zIndex=3
        this.sprite_outline.hotspot=v2.new(.5,.5)
        this.sprite_outline.visible=false
        this.sprite_outline.zIndex=0
        this.container.zIndex=zIndexes.Loots
        this.container.add_child(this.sprite_outline)
        this.container.add_child(this.sprite_main)
        this.container.updateZIndex()
    }
    override onDestroy(): void {
      this.container.destroy()
    }
    override render(camera: Camera2D, renderer: Renderer, _dt: number): void {
        /*if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_loot"),camera.visual_position)
        }*/
    }
    dest_pos?:Vec2
    override updateData(data:LootData){
        if(this.game.save.get_variable("cv_game_interpolation")&&!data.full){
            this.dest_pos=data.position
        }else{
            this.position=data.position
        }
        if(data.full){
            this.item=GameItems.valueNumber[data.full.item]
            this.count=data.full.count
            switch(this.item.item_type){
                case InventoryItemType.gun:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.rotation=Angle.deg2rad(-30)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`${(this.item as unknown as GunDef).ammoType}_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_outline.scale=v2.new(1.5,1.5);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.gun
                    this.pickup_sound=this.game.resources.get_audio("gun_pickup")
                    break
                case InventoryItemType.ammo:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true;
                    this.sprite_main.scale=v2.new(.9,.9);
                    this.sprite_outline.scale=v2.new(1.5,1.5);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.ammo
                    this.pickup_sound=this.game.resources.get_audio("ammo_pickup")
                    break
                case InventoryItemType.consumible:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_main.scale=v2.new(1.5,1.5);
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.consumible
                    this.pickup_sound=this.game.resources.get_audio(`${this.item.idString}_pickup`)
                    break
                case InventoryItemType.backpack:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_main.scale=v2.new(0.8,0.8);
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.equipament
                    this.pickup_sound=this.game.resources.get_audio(`backpack_pickup`)
                    break
                case InventoryItemType.equipament:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_main.scale=v2.new(0.8,0.8);
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.equipament
                    if((this.item as unknown as EquipamentDef).type===EquipamentType.Vest){
                        this.pickup_sound=this.game.resources.get_audio(`vest_pickup`)
                    }else{
                        this.pickup_sound=this.game.resources.get_audio(`helmet_pickup`)
                    }
                    break
                case InventoryItemType.other:
                    break
                case InventoryItemType.melee:
                    break
                case InventoryItemType.accessorie:
                    break
                case InventoryItemType.skin:{
                    const ff=(this.item as unknown as SkinDef).frame?.base??(this.item.idString+"_body")
                    this.sprite_main.frame=this.game.resources.get_sprite(ff)
                    this.sprite_main.visible=true
                    this.sprite_main.scale=v2.new(0.5,.5)
                    this.sprite_main.rotation=3.141592/2
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.skin
                    break
                }
            }
            if(this.is_new){
                this.container.scale=v2.new(0.05,0.05)
                this.game.addTween({
                    duration:3,
                    target:this.container.scale,
                    ease:ease.elasticOut,
                    to:{
                        x:1,
                        y:1
                    },
                })
            }
            this.container.visible=true
        }
    }
}