import { GameItem } from "./utils.ts";
import { Guns } from "./guns.ts";
import { Ammos } from "./ammo.ts";
import { Healings } from "./healings.ts";
import { DefinitionsMerge } from "../engine/definitions.ts";
import { Others } from "common/scripts/definitions/others.ts";
import { Accessories, Armors } from "common/scripts/definitions/equipaments.ts";

export const GameItems=new DefinitionsMerge<GameItem>()
GameItems.insert_def(Guns.value)
GameItems.insert_def(Ammos.value)
GameItems.insert_def(Healings.value)
GameItems.insert_def(Armors.value)
GameItems.insert_def(Accessories.value)
GameItems.insert_def(Others.value)