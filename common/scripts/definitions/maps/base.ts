import { LootTableItemRet, LootTablesDefs } from "../../engine/inventory.ts";
import { GameItem, InventoryItemType } from "../utils.ts";
import { GameItems } from "../alldefs.ts";
import { GunDef } from "../items/guns.ts";
import { FloorType, RiversDef } from "../../others/terrain.ts";
import { Random1 } from "../../engine/random.ts";
import { Vec2 } from "../../engine/geometry.ts";
import { type Layers } from "../../others/constants.ts";
import { SpawnMode } from "../objects/obstacles.ts";

export interface Aditional{
    withammo:boolean
}
export function get_item(item:string,count:number,_aditional:Aditional):LootTableItemRet<GameItem>[]{
    const itemD=GameItems.valueString[item]
    if(!itemD){
        console.error(item,"Not Founded")
    }
    if(itemD.item_type===InventoryItemType.gun){
        const ret=[
            {
                item:itemD,
                count:count
            }
        ]
        if((itemD as unknown as GunDef).ammoSpawnAmount){
            ret.push({
                item:GameItems.valueString[(itemD as unknown as GunDef).ammoSpawn??(itemD as unknown as GunDef).ammoType],
                count:(itemD as unknown as GunDef).ammoSpawnAmount!
            })
        }
        return ret
    }else{
        return [
            {
                item:itemD,
                count:count
            }
        ]
    }
}
export interface IslandDef{
    generation:{
        size:Vec2
        terrain:{
            base:FloorType
            floors:{
                type:FloorType
                padding:number
                variation:number
                spacing:number
            }[]
            rivers?:{
                defs:RiversDef[]
                expansion?:number
                spawn_floor:number
                divisions:number
            }
        },
        ground_loot?:{table:string,count:Random1,layer?:Layers}[],
        spawn?:{id:string,count:Random1,layer?:Layers,spawn?:SpawnMode}[][],
    }
}
export const LootTables=new LootTablesDefs<GameItem,Aditional>(get_item)
LootTables.add_tables({
    //Guns
    "common_guns":[
        {item:"m9",weight:5},
    ],
    "uncommon_guns":[
        {item:"mp5",weight:1.4},
        {item:"hp18",weight:1},
    ],
    "rare_guns":[
        {item:"ak47",weight:3},
        {item:"ar15",weight:2},
        {item:"m870",weight:2},
    ],
    "epic_guns":[
        {item:"famas",weight:6},
        {item:"spas12",weight:3},
    ],
    "mythic_guns":[
        {item:"vector",weight:6},
        {item:"kar98k",weight:6},
        {item:"awp",weight:0.5},
        {item:"m2-2",weight:0.1},
    ],
    "legendary_guns":[
        {item:"awms",weight:1},
        {item:"pfeifer_zeliska",weight:1},
        {item:"rpg7",weight:0.8},
    ],
    "guns":[
        {table:"common_guns",weight:27},
        {table:"uncommon_guns",weight:25},
        {table:"rare_guns",weight:17},
        {table:"epic_guns",weight:1},
        {table:"mythic_guns",weight:0.1},
        {table:"legendary_guns",weight:0.01}
    ],
    "melees":[
        {table:"axe",weight:10},
        {table:"hammer",weight:1},
    ],
    "special_guns":[
        {table:"uncommon_guns",weight:29},
        {table:"rare_guns",weight:20},
        {table:"epic_guns",weight:3},
        {table:"mythic_guns",weight:0.7},
        {table:"legendary_guns",weight:0.3}
    ],
    //Consumibles
    "consumibles":[
        {table:"healing",weight:13},
        {table:"adrenaline",weight:6},
        {table:"shield",weight:2},
        {table:"addiction",weight:0.7},
    ],
    "special_consumibles":[
        {table:"healing",weight:13},
        {table:"adrenaline",weight:6},
        {table:"shield",count:2,weight:2},
        {table:"addiction",count:2,weight:0.7},
    ],
    "healing":[
        {item:"gauze",count:5,weight:1},
        {item:"medikit",count:1,weight:0.6},
    ],
    "adrenaline":[
        {item:"soda",count:1,weight:3},
        {item:"inhaler",count:1,weight:1},
        {item:"yellow_pills",count:1,weight:0.6},
    ],
    "shield":[
        {item:"small_blue_potion",count:2,weight:3},
        {item:"blue_potion",count:1,weight:1},
        {item:"blue_pills",count:1,weight:0.6},
    ],
    "addiction":[
        {item:"small_red_crystal",count:4,weight:3},
        {item:"red_crystal",count:2,weight:1},
        {item:"red_pills",count:1,weight:0.6},
    ],
    "mana":[
        {item:"small_purple_potion",count:2,weight:3},
        {item:"purple_potion",count:1,weight:1},
        {item:"purple_pills",count:1,weight:0.6},
    ],
    //Ammos
    "ammos":[
        {item:"12g",count:10,weight:5},
        {item:"9mm",count:60,weight:5},
        {item:"22lr",count:60,weight:5},
        {item:"762mm",count:60,weight:5},
        {item:"556mm",count:60,weight:5},
        {item:"50cal",count:20,weight:0.1},
        {item:"308sub",count:5,weight:0.05},
        {item:"gasoline",count:5,weight:0.05},
        {item:"explosive_ammo",count:2,weight:0.05},
    ],
    "special_ammos":[
        {item:"12g",count:15,weight:5},
        {item:"9mm",count:80,weight:5},
        {item:"22lr",count:80,weight:5},
        {item:"762mm",count:80,weight:5},
        {item:"556mm",count:80,weight:5},
        {item:"50cal",count:40,weight:0.3},
        {item:"308sub",count:10,weight:0.2},
        {item:"gasoline",count:10,weight:0.2},
        {item:"explosive_ammo",count:4,weight:0.2},
    ],
    //Armors And Backpacks
    "armors":[
        {item:"basic_vest",weight:10},
        {item:"regular_vest",weight:1},
        {item:"tactical_vest",weight:0.05},

        {item:"basic_helmet",weight:10},
        {item:"regular_helmet",weight:1},
        {item:"tactical_helmet",weight:0.05},
    ],
    "backpacks":[
        {item:"basic_pack",weight:10},
        {item:"regular_pack",weight:1},
        {item:"tactical_pack",weight:0.05},
    ],
    "equipments":[
        {item:"basic_vest",weight:10},
        {item:"regular_vest",weight:1},
        {item:"tactical_vest",weight:0.05},

        {item:"basic_helmet",weight:10},
        {item:"regular_helmet",weight:1},
        {item:"tactical_helmet",weight:0.05},

        {item:"basic_pack",weight:10},
        {item:"regular_pack",weight:1},
        {item:"tactical_pack",weight:0.05},
    ],
    "special_equipments":[
        {item:"basic_vest",weight:10},
        {item:"regular_vest",weight:3},
        {item:"tactical_vest",weight:0.15},

        {item:"basic_helmet",weight:10},
        {item:"regular_helmet",weight:1},
        {item:"tactical_helmet",weight:0.15},

        {item:"basic_pack",weight:10},
        {item:"regular_pack",weight:1},
        {item:"tactical_pack",weight:0.15},
    ],
    "airdrop_equipments":[
        {item:"tactical_vest",weight:1},
        {item:"tactical_helmet",weight:1},
        {item:"tactical_pack",weight:1},
    ],
    //Loot Tables
    "ground_loot":[
        {weight:1.5,table:"ammos"},
        {weight:1,table:"equipments"},
        {weight:0.5,table:"guns"},
        {weight:0.01,table:"melees"},
    ],
    "wood_crate":[
        [{weight:10,table:"ammos"},{weight:1,table:""}],
        [{weight:10,table:"consumibles"},{weight:1,table:""}],
        [{weight:9.5,table:"equipments"},{weight:1,table:""}],
        [{weight:1,table:"guns"}],
        [{weight:60,table:""},{weight:1,table:"melees"}],
    ],
    "copper_crate":[
        [{weight:10,table:"special_ammos"},{weight:1,table:""}],
        [{weight:10,table:"consumibles"},{weight:1,table:""}],
        [{weight:9.5,table:"special_equipments"},{weight:1,table:""}],
        [{weight:1,table:"special_guns"}],
        [{weight:40,table:""},{weight:1,table:"melees"}],
    ],
    "iron_crate":[
        [{weight:10,table:"special_ammos",count:2},{weight:1,table:""}],
        [{weight:10,table:"consumibles"},{weight:1,table:""}],
        [{weight:1,table:"airdrop_equipments"}],
        [{weight:1,table:"mythic_guns"}],
        [{weight:5,table:""},{weight:1,table:"melees"}],
    ],
    "gold_crate":[
        [{weight:10,table:"special_ammos",count:2},{weight:1,table:""}],
        [{weight:10,table:"consumibles",count:2},{weight:1,table:""}],
        [{weight:10,table:"airdrop_equipments"},{weight:1,count:2,table:"airdrop_equipments"}],
        [{weight:10,table:"legendary_guns"},{weight:1,table:"mythic_guns"}],
        [{weight:1,table:"melees"}],
    ],
    //Animals
    "animal_medium":[
        [{weight:1,count:1,table:"special_consumibles"}],
        [{weight:10,count:1,table:""},{weight:1,count:1,table:"ammos"}],
    ]
})