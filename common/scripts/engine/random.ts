import { type DegAngle, type RadAngle } from "./geometry.ts";
import { type ID } from "./utils.ts";

export interface WeightDefinition{
    weight:number
}

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
    },
    weight<Item>(items:Item[], weights:number[]) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let randomNum = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            if (randomNum < weights[i]) {
                return items[i];
            }
            randomNum -= weights[i];
        }
    },
    weight2<TP extends WeightDefinition>(items:TP[]) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let randomNum = Math.random() * totalWeight;
    
        for (const item of items) {
            if (randomNum < item.weight) {
                return item;
            }
            randomNum -= item.weight;
        }
    }
})