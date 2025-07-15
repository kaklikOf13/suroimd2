import { LootData } from "common/scripts/others/objectsEncode.ts";
import { Angle, RectHitbox2D, v2 } from "common/scripts/engine/mod.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { GameObject } from "../others/gameObject.ts";
import { Container2D, Sprite2D } from "../engine/mod.ts";
import { GameItem, InventoryItemType } from "common/scripts/definitions/utils.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts"
import { GunDef } from "common/scripts/definitions/guns.ts";
export class Loot extends GameObject{
    stringType:string="loot"
    numberType: number=2
    name:string=""
    container:Container2D=new Container2D()

    item!:GameItem

    sprite_main:Sprite2D=new Sprite2D()
    sprite_outline:Sprite2D=new Sprite2D()
    create(_args: Record<string, void>): void {
        this.hb=RectHitbox2D.positioned(v2.new(3,3),v2.new(GameConstants.loot.radius.ammo,GameConstants.loot.radius.ammo))
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
    override updateData(data:LootData){
        this.position=data.position
        this.container.position=this.position
        if(data.full){
            this.item=GameItems.valueNumber[data.full.item]
            switch(this.item.item_type){
                case InventoryItemType.gun:
                    this.sprite_main.sprite=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.rotation=Angle.deg2rad(-30)
                    this.sprite_main.visible=true
                    this.sprite_outline.sprite=this.game.resources.get_sprite(`${(this.item as unknown as GunDef).ammoType}_outline`)
                    this.sprite_outline.visible=true
                    break
                case InventoryItemType.ammo:
                    this.sprite_main.sprite=this.game.resources.get_sprite(this.item.idString)
                    this.sprite_main.visible=true
                    break
                case InventoryItemType.healing:
                    break
                case InventoryItemType.equipament:
                    break
                case InventoryItemType.other:
                    break
                case InventoryItemType.melee:
                    break
                case InventoryItemType.accessorie:
                    break
            }
            this.container.visible=true
        }
    }
}