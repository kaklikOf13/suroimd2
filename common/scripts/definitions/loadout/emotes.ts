import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";

export interface EmoteDef extends Definition{
    rarity:ItemQuality,
}
export const Emotes=new Definitions<EmoteDef,{}>((e)=>{
    e.idString="emote_"+e.idString
})
Emotes.insert(
    {
        idString:"happy",
        rarity:ItemQuality.Common
    },
    {
        idString:"sad",
        rarity:ItemQuality.Common
    },
    {
        idString:"neutral",
        rarity:ItemQuality.Common
    },
    {
        idString:"md_logo",
        rarity:ItemQuality.Common
    },
)