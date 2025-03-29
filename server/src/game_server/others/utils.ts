import { DamageReason } from "common/scripts/definitions/utils.ts";
import { Player } from "../gameObjects/player.ts";

export interface DamageParams{
    amount:number
    owner?:Player
    reason:DamageReason
}