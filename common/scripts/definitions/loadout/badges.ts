import { Definition, Definitions } from "../../engine/definitions.ts";
import { ItemQuality } from "../../others/item.ts";

export interface BadgeDef extends Definition{
    quality:ItemQuality,
}
export const Badges=new Definitions<BadgeDef,null>((i)=>{
})
Badges.insert(
    {
        idString:"stone_1_badge",
        quality:ItemQuality.Common
    },
)