import { ClientGameObject2D } from "../engine/game.ts";
import { type Game } from "./game.ts";

export abstract class GameObject extends ClientGameObject2D{
    declare game:Game
}