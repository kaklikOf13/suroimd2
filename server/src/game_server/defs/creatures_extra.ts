import { random } from "common/scripts/engine/random.ts";
import { type Creature } from "../gameObjects/creature.ts";
import { v2 } from "common/scripts/engine/geometry.ts";

export type CreatureUFunc=(self:Creature,dt:number)=>void
export type CreatureUFuncC=(params:any,self:Creature)=>CreatureUFunc
export const CreaturesUpdates:Record<string,CreatureUFuncC>={
    friendly_1:(params:{speed:number,stop_time:number,walk_time:number,walk_time_extension:number,stop_time_extension:number},self)=>{
        let time=params.stop_time+(params.stop_time_extension*Math.random())
        return (self:Creature,dt:number)=>{
            if(time<=0){
                switch(self.state){
                    case 0:{ // Stop State
                        self.angle=random.rad()
                        self.state=1
                        time=params.walk_time+(params.walk_time_extension*Math.random())
                        self.velocity=v2.scale(v2.from_RadAngle(self.angle),params?.speed??3)
                        break
                    }
                    case 1:{ //Walk State
                        self.state=0
                        self.velocity=v2.new(0,0)
                        time=params.stop_time+(params.stop_time_extension*Math.random())
                        break
                    }
                }
            }else{
                time-=dt
            }
        }
    }
}