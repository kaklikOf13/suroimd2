import { BaseGameObject2D } from "common/scripts/engine/mod.ts";
import { type Player } from "../gameObjects/player.ts";
import { type Game } from "./game.ts";

export abstract class ServerGameObject extends BaseGameObject2D{
    abstract interact(user:Player):void
    declare game:Game
}