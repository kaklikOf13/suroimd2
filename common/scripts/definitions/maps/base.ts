import { LootTableItemRet, LootTablesDefs } from "../../engine/inventory.ts";
import { GameItem, InventoryItemType } from "../utils.ts";
import { GameItems } from "../alldefs.ts";
import { GunDef } from "../guns.ts";
import { defaultAmmos } from "../ammo.ts";

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
                item:GameItems.valueString[(itemD as unknown as GunDef).ammoSpawn??defaultAmmos[(itemD as unknown as GunDef).ammoType]],
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

export const LootTables=new LootTablesDefs<GameItem,Aditional>(get_item)
LootTables.add_tables({
    //Guns
    "uncommon_guns":[
        {item:"mp5",weight:1.4},
        {item:"ak47",weight:1},
        {item:"hp18",weight:1},
        {item:"ar15",weight:0.6},
        {item:"m870",weight:0.6},
    ],
    "rare_guns":[
        {item:"spas12",weight:3},
    ],
    "epic_guns":[
        {item:"vector",weight:3},
        {item:"kar98k",weight:1},
        {item:"awp",weight:0.5},
    ],
    "legendary_guns":[
        {item:"awms",weight:1},
    ],
    "guns":[
        {table:"uncommon_guns",weight:29},
        {table:"rare_guns",weight:9},
        {table:"epic_guns",weight:1},
        {table:"legendary_guns",weight:0.1}
    ],
    "special_guns":[
        {table:"uncommon_guns",weight:29},
        {table:"rare_guns",weight:11},
        {table:"epic_guns",weight:3},
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
        {table:"",weight:4},
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
        {item:"12g",count:10,weight:1},
        {item:"9mm",count:60,weight:1},
        {item:"762mm",count:60,weight:1},
        {item:"556mm",count:60,weight:1},
    ],
    //Loot Tables
    "wood_crate":{
        content:[
            {weight:1.5,table:"consumibles"},
            {weight:1.3,table:"ammos"},
            {weight:0.5,table:"guns"},
        ],
        min:1,
        max:4
    },
    "copper_crate":{
        content:[
            {weight:1.5,table:"consumibles"},
            {weight:1.3,table:"ammos"},
            {weight:0.5,table:"special_guns"},
        ],
        min:2,
        max:5
    },
    "iron_crate":[
        [{weight:1,count:4,table:"special_consumibles"}],
        [{weight:1,count:3,table:"ammos"}],
        [{weight:1,count:1,table:"epic_guns"}],
    ],
    "gold_crate":[
        [{weight:1,count:5,table:"special_consumibles"}],
        [{weight:1,count:4,table:"ammos"}],
        [{weight:1,count:1,table:"legendary_guns"}],
    ],
})