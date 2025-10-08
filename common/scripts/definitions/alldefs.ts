import { GameItem } from "./utils.ts";
import { GunDef,Guns } from "./items/guns.ts";
import { Ammos } from "./items/ammo.ts";
import { Consumibles } from "./items/consumibles.ts";
import { DefinitionsMerge } from "../engine/definitions.ts";
import { Others } from "./others.ts";
import { Accessories, Armors } from "./items/equipaments.ts";
import { MeleeDef, Melees } from "./items/melees.ts";
import { Backpacks } from "./items/backpacks.ts";
import { Obstacles, type ObstacleDef } from "./objects/obstacles.ts";
import { ExplosionDef, Explosions } from "./objects/explosions.ts";
import { Skins } from "./loadout/skins.ts";
import { ProjectileDef, Projectiles } from "./objects/projectiles.ts";
import { BuildingDef } from "./objects/buildings_base.ts";

export const GameItems=new DefinitionsMerge<GameItem>()
GameItems.insert_def(Guns.value)
GameItems.insert_def(Melees.value)
GameItems.insert_def(Projectiles.value)
GameItems.insert_def(Ammos.value)
GameItems.insert_def(Consumibles.value)
GameItems.insert_def(Armors.value)
GameItems.insert_def(Backpacks.value)
GameItems.insert_def(Accessories.value)
GameItems.insert_def(Others.value)
GameItems.insert_def(Skins.value)

export type WeaponDef=MeleeDef|GunDef|ProjectileDef
export const Weapons=new DefinitionsMerge<WeaponDef>()
Weapons.insert_def(Guns.value)
Weapons.insert_def(Melees.value)
Weapons.insert_def(Projectiles.value)

export type DamageSourceDef=MeleeDef|GunDef|ObstacleDef|ExplosionDef|ProjectileDef
export const DamageSources=new DefinitionsMerge<DamageSourceDef>()
DamageSources.insert_def(Guns.value)
DamageSources.insert_def(Melees.value)
DamageSources.insert_def(Projectiles.value)
DamageSources.insert_def(Obstacles.value)
DamageSources.insert_def(Explosions.value)

export type ABuildingObject=BuildingDef|ObstacleDef
export const ABuildingObjects=new DefinitionsMerge<ABuildingObject>()