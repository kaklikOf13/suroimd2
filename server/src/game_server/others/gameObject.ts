import { BaseGameObject2D } from "common/scripts/engine/mod.ts";
import { type Player } from "../gameObjects/player.ts";

export abstract class ServerGameObject extends BaseGameObject2D{
    abstract interact(user:Player):void
}