import { type DegAngle, type RadAngle } from "./geometry.ts";
import { type ID } from "./utils.ts";

export const random=Object.freeze({
    int(min:number,max:number):number{
        return Math.floor(Math.random()*(max-min)+min)
    },
    float(min:number,max:number):number{
        return Math.random()*(max-min)+min
    },
    choose<Val>(val:Val[]):Val{
        return val[Math.floor(Math.random()*val.length)]
    },
    id():ID{
        return Math.floor(Math.random() * 4294967296)
    },
    rad():RadAngle{
        return Math.random()*(Math.PI-(-Math.PI))+(-Math.PI)
    },
    deg():DegAngle{
        return this.int(-180,180)
    }
})