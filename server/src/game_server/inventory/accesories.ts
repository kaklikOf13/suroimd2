import { type AccessorieDef } from "common/scripts/definitions/equipaments.ts";
import { type Player } from "../gameObjects/player.ts";

export interface AccessoriesSlot{
    droppable:boolean
    changable:boolean
    item?:AccessorieDef
}
export class AccessoriesManager{
    user:Player
    accessories:Record<number,AccessoriesSlot>={}
    slots:AccessoriesSlot[]=[]
    constructor(user:Player,slots:number){
        this.user=user
        for(let i=0;i<slots;i++){
            const s={
                droppable:true,
                changable:true,
                item:undefined
            }
            this.slots.push(s)
            this.accessories[i]=s
        }
    }
    hasAccesorie(idString:string):boolean{
        for(const s of this.slots){
            if(s.item&&s.item.idString===idString){
                return true
            }
        }
        return false
    }
}