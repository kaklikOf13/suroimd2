import { DamageReason, GameItem } from "common/scripts/definitions/utils.ts";
import { Player } from "../gameObjects/player.ts";
import { Vec2 } from "common/scripts/engine/geometry.ts";

export interface DamageParams{
    amount:number
    owner?:Player
    reason:DamageReason
    position:Vec2
    critical:boolean
    source?:GameItem
}