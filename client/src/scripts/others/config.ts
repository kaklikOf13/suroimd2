import { Casters } from "../engine/console.ts";
import { GamepadButtonID, Key, Server } from "../engine/mod.ts";

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

    cv_graphics_resolution:Casters.generateUnionCaster(["very-low","low","medium","high","very-high"]),
    cv_graphics_particles:Casters.toInt
})
export const ConfigDefaultValues={
    cv_loadout_skin:"",
    cv_loadout_name:"",
    cv_graphics_resolution:"high",
    cv_graphics_particles:GraphicsParticlesConfig.Advanced
}
export const ConfigDefaultActions={
    "fire":{
      buttons:[GamepadButtonID.R2],
      keys:[Key.Mouse_Left]
    },
    "reload":{
      buttons:[GamepadButtonID.X],
      keys:[Key.R]
    },
    "interact":{
      buttons:[GamepadButtonID.A],
      keys:[Key.E]
    },
    "move_up":{
      buttons:[],
      keys:[Key.W]
    },
    "move_down":{
      buttons:[],
      keys:[Key.S]
    },
    "move_left":{
      buttons:[],
      keys:[Key.A]
    },
    "move_right":{
      buttons:[],
      keys:[Key.D]
    },
    "weapon1":{
        buttons:[],
        keys:[Key.Number_1]
    },
    "weapon2":{
        buttons:[],
        keys:[Key.Number_2]
    },
    "weapon3":{
        buttons:[],
        keys:[Key.Number_3]
    },
    "use_item1":{
        buttons:[],
        keys:[Key.Number_4]
    },
    "use_item2":{
        buttons:[],
        keys:[Key.Number_5]
    },
    "use_item3":{
        buttons:[],
        keys:[Key.Number_6]
    },
    "use_item4":{
        buttons:[],
        keys:[Key.Number_7]
    },
    "use_item5":{
        buttons:[],
        keys:[Key.Number_8]
    },
    "use_item6":{
        buttons:[],
        keys:[Key.Number_9]
    },
    "use_item7":{
        buttons:[],
        keys:[Key.Number_0]
    },
    "previour_weapon":{
      buttons:[GamepadButtonID.L1],
      keys:[]
    },
    "next_weapon":{
      buttons:[GamepadButtonID.R1],
      keys:[]
    },
    "expanded_inventory":{
      buttons:[GamepadButtonID.Y],
      keys:[Key.I]
    }
}
export const Debug={
    hitbox:false,
}