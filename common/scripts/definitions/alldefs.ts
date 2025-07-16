import { GameItem } from "./utils.ts";
import { GunDef,Guns } from "./guns.ts";
import { Ammos } from "./items/ammo.ts";
import { Healings } from "./healings.ts";
import { DefinitionsMerge } from "../engine/definitions.ts";
import { Others } from "./others.ts";
import { Accessories, Armors } from "./equipaments.ts";
import { MeleeDef, Melees } from "./melees.ts";
import { Backpacks } from "./items/backpacks.ts";

export const GameItems=new DefinitionsMerge<GameItem>()
GameItems.insert_def(Guns.value)
GameItems.insert_def(Melees.value)
GameItems.insert_def(Ammos.value)
GameItems.insert_def(Healings.value)
GameItems.insert_def(Armors.value)
GameItems.insert_def(Backpacks.value)
GameItems.insert_def(Accessories.value)
GameItems.insert_def(Others.value)

export type WeaponDef=MeleeDef|GunDef
export const Weapons=new DefinitionsMerge<WeaponDef>()
Weapons.insert_def(Guns.value)
Weapons.insert_def(Melees.value)