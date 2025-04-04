import { Definition } from "../../engine/definitions.ts";
import { LootTablesDefs } from "../../engine/inventory.ts";
import { GameItems } from "common/scripts/definitions/alldefs.ts";

export interface Aditional{
    withammo:boolean
}
export function get_item(item:string,count:number,aditional:Aditional):Definition[]{
    if(GameItems[item]){
        /*const g=Guns.getFromString(item)
        if(aditional.withammo&&g.ammoSpawnAmount){
            return [g,Ammos.getFromString(g.ammoSpawn??defaultAmmos[g.ammoType])]
        }else{
            return [g]
        }*/
    }
    /*if(Ammos.exist(item)){
        return [Ammos.getFromString(item)]
    }*/
    return []
}

export const LootTables=new LootTablesDefs<Definition,Aditional>(get_item)