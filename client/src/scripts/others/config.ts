import { Casters } from "../engine/console.ts";
import { Server } from "../engine/mod.ts";

export const api_server=new Server("localhost",8000,false)
export const offline=false
export enum GraphicsParticlesConfig {
    None=0,
    Normal,
    Advanced,
}


export const ConfigCasters=Object.freeze({
    cv_loadout_name:Casters.toString,
    cv_loadout_skin:Casters.toString,

    cv_graphics_resolution:Casters.generateUnionCaster(["very-low","low","medium","high","very-high","ultra"]),
    cv_graphics_particles:Casters.toInt
})
export const ConfigDefaultValues={
    cv_loadout_skin:"",
    cv_loadout_name:"",
    cv_graphics_resolution:"high",
    cv_graphics_particles:GraphicsParticlesConfig.Advanced
}

export const Debug={
    hitbox:false,
}