import { Definitions } from "common/scripts/engine/definitions.ts";
import { ParticleDef2D,Particles2DBase,Particle2DLifetime1Args } from "common/scripts/engine/particles.ts";
import { GameObject } from "../others/gameObject.ts";

export const Particles:Definitions<ParticleDef2D<GameObject>,undefined>=new Definitions()
Particles.insert(
    {
        update:Particles2DBase.life_timed1_update,
        create:Particles2DBase.life_timed1_create,
        args:{
            angular_speed:{
                min:-0.1,
                max:0.1,
            },
            lifetime:{
                min:3,
                max:6
            },
            speed:{
                min:0.01,
                max:0.1
            }
        } as Particle2DLifetime1Args,
        idString:"leaf_green_particle",
        sprite:"leaf_green_particle"
    },
    {
        update:Particles2DBase.life_timed1_update,
        create:Particles2DBase.life_timed1_create,
        args:{
            angular_speed:{
                min:0.007,
                max:0.009,
            },
            lifetime:{
                min:0.7,
                max:1
            },
            speed:{
                min:0.01,
                max:0.02
            }
        } as Particle2DLifetime1Args,
        idString:"stone_particle",
        sprite:"stone_particle"
    }
)