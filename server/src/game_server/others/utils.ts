import { Player } from "../gameObjects/player.ts";

export interface DamageParams{
    amount:number,
    owner?:Player
}