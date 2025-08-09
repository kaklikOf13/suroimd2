import { LootData } from "common/scripts/others/objectsEncode.ts";
import { Angle, CircleHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { GameObject } from "../others/gameObject.ts";
import { type Camera2D, Container2D, type Renderer, Sprite2D } from "../engine/mod.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts"
import { GunDef } from "../../../../common/scripts/definitions/items/guns.ts";
import { Debug } from "../others/config.ts";
import { ease } from "common/scripts/engine/utils.ts";
import { SkinDef } from "common/scripts/definitions/loadout/skins.ts";
export class Loot extends GameObject{
    stringType:string="loot"
    numberType: number=2
    name:string=""
    container:Container2D=new Container2D()

    item!:GameItem

    sprite_main:Sprite2D=new Sprite2D()
    sprite_outline:Sprite2D=new Sprite2D()
    create(_args: Record<string, void>): void {
        this.hb=new CircleHitbox2D(v2.new(3,3),0.3)
        this.game.camera.addObject(this.container)
    }
    update(_dt:number): void {
        
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
        if(Debug.hitbox){
            renderer.draw_hitbox2D(this.hb,this.game.resources.get_material2D("hitbox_loot"),camera.visual_position)
        }
    }
    override updateData(data:LootData){
        this.position=data.position
        this.container.position=this.position
        this.manager.cells.updateObject(this)
        if(data.full){
            this.item=GameItems.valueNumber[data.full.item]
            switch(this.item.item_type){
                case InventoryItemType.gun:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.rotation=Angle.deg2rad(-30)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`${(this.item as unknown as GunDef).ammoType}_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_outline.scale=v2.new(1.5,1.5);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.gun
                    break
                case InventoryItemType.ammo:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true;
                    this.sprite_main.scale=v2.new(.9,.9);
                    this.sprite_outline.scale=v2.new(1.5,1.5);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.ammo
                    break
                case InventoryItemType.consumible:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_main.scale=v2.new(1.5,1.5);
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.consumible
                    break
                case InventoryItemType.backpack:
                case InventoryItemType.equipament:
                    this.sprite_main.frame=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    this.sprite_outline.frame=this.game.resources.get_sprite(`null_outline`)
                    this.sprite_outline.visible=true;
                    this.sprite_main.scale=v2.new(0.8,0.8);
                    this.sprite_outline.scale=v2.new(0.9,0.9);
                    (this.hb as CircleHitbox2D).radius=GameConstants.loot.radius.equipament
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