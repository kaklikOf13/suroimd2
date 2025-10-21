import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";

export interface EmoteDef extends Definition{
    quality:ItemQuality,
}
export const Emotes=new Definitions<EmoteDef,{}>((e)=>{
    e.idString="emote_"+e.idString
})
Emotes.insert(
    {
        idString:"happy",
        quality:ItemQuality.Common
    },
    {
        idString:"sad",
        quality:ItemQuality.Common
    },
    {
        idString:"neutral",
        quality:ItemQuality.Common
    },
    {
        idString:"md_logo",
        quality:ItemQuality.Common
    },
)