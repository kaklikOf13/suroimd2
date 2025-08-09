import { DamageReason } from "common/scripts/definitions/utils.ts";
import { Player } from "../gameObjects/player.ts";
import { Vec2 } from "common/scripts/engine/geometry.ts";
import { DamageSourceDef } from "common/scripts/definitions/alldefs.ts";

export interface DamageParams{
    amount:number
    owner?:Player
    reason:DamageReason
    position:Vec2
    critical:boolean
    source?:DamageSourceDef
}