import { Definitions } from "../engine/definitions.ts";
import { BulletDef } from "./utils.ts";

export interface GunDef{
    bullet:BulletDef
    fireDelay:number
    bulletsCount?:number
    spread?:number
}

export const Guns=new Definitions()