import { ClientGameObject2D, FormGameObject2D } from "../engine/game.ts";
import { type Game } from "./game.ts";

export abstract class GameObject extends ClientGameObject2D{
    declare game:Game
}
export abstract class FormGameObject extends FormGameObject2D{
    declare game:Game
}