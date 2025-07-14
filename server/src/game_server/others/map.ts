import { Hitbox2D, NullHitbox2D, NullVec2, ObjectKey, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { type Game } from "./game.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";

import {} from "common/scripts/definitions/maps/base.ts"
import { GameItem } from "common/scripts/definitions/utils.ts";
import { Guns } from "common/scripts/definitions/guns.ts";
import { Ammos } from "common/scripts/definitions/ammo.ts";

export class GameMap{
    readonly size:Vec2
    game:Game
    constructor(game:Game,size:Vec2,_seed:number=0){
        this.size=size
        this.game=game
    }
    getRandomPosition(hitbox:Hitbox2D,k:ObjectKey,gp?:(hitbox:Hitbox2D,map:GameMap)=>Vec2,valid?:(hitbox:Hitbox2D,k:ObjectKey,map:GameMap)=>boolean,maxAttempts:number=100):Vec2|undefined{
        let pos:Vec2|undefined=undefined
        let attempt=0
        if(!valid){
            valid=(hitbox:Hitbox2D,k:ObjectKey,map:GameMap)=>{
                const objs=map.game.scene.objects.cells.get_objects2(hitbox,CATEGORYS.OBSTACLES)
                for(const o of objs){
                    if(!(o.id===k.id&&o.category===k.category)&&hb.collidingWith((o as Obstacle).spawnHitbox)){
                        return false
                    }
                }
                return true
            }
        }
        if(!gp){
            gp=(_hitbox:Hitbox2D,map:GameMap)=>{
                return v2.random2(NullVec2,map.size)
            }
        }
        const hb=hitbox.clone()
        const hc=hitbox.clone()
        while(!pos){
            if(attempt>=maxAttempts)break
            pos=gp!(hc,this)
            hb.translate(pos)
            if(!valid!(hb,k,this)){
                pos=undefined
            }
            attempt++
        }
        return pos
    }
    add_obstacle(def:ObstacleDef):Obstacle{
        const o=this.game.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
            def:def
        }) as Obstacle
        return o
    }
    generate_obstacle(def:ObstacleDef):Obstacle|undefined{
        const o=this.add_obstacle(def)
        const p=this.getRandomPosition(def.spawnHitbox?def.spawnHitbox.clone():(def.hitbox?def.hitbox.clone():new NullHitbox2D(v2.new(0,0))),o.get_key())
        if(!p){
            o.destroy()
            return undefined
        }
        o.set_position(p)
        o.manager.cells.updateObject(o)
        return o
    }
    generate(){
        for(let i=0;i<5;i++){
            this.generate_obstacle(Obstacles.getFromString("stone"))
        }
        for(let i=0;i<10;i++){
            this.generate_obstacle(Obstacles.getFromString("bush"))
        }
        for(let i=0;i<15;i++){
            this.generate_obstacle(Obstacles.getFromString("oak_tree"))
        }
        for(let i=0;i<10;i++){
            this.generate_obstacle(Obstacles.getFromString("barrel"))
        }
        this.game.add_loot(v2.new(3,3),Guns.getFromNumber(0) as unknown as GameItem,1)

        this.game.add_loot(v2.new(3,3),Ammos.getFromString("762mm") as unknown as GameItem,30)
        this.game.add_loot(v2.new(3,3),Ammos.getFromString("762mm") as unknown as GameItem,30)
        //Feast
        /*const crate=Obstacles.getFromString("wood_crate")
        let obs=this.add_obstacle(crate)
        obs.set_position(v2.new(2,4))
        obs=this.add_obstacle(crate)
        obs.set_position(v2.new(3,4))
        obs=this.add_obstacle(crate)
        obs.set_position(v2.new(2,5))
        obs=this.add_obstacle(crate)
        obs.set_position(v2.new(3,5))
        obs=this.add_obstacle(crate)
        obs.set_position(v2.new(2,6))
        obs=this.add_obstacle(crate)
        obs.set_position(v2.new(3,6))
        // Map
        for(let i=0;i<10;i++){
            this.generate_obstacle(Obstacles.getFromString("barrel"))
        }
        for(let i=0;i<15;i++){
            this.generate_obstacle(Obstacles.getFromString("stone"))
        }
        for(let i=0;i<5;i++){
            this.generate_obstacle(crate)
        }
        for(let i=0;i<3;i++){
            this.generate_obstacle(Obstacles.getFromString("copper_crate"))
        }
        for(let i=0;i<1;i++){
            this.generate_obstacle(Obstacles.getFromString("iron_crate"))
        }
        for(let i=0;i<1;i++){
            this.generate_obstacle(Obstacles.getFromString("gold_crate"))
        }
        for(let i=0;i<10;i++){
            this.generate_obstacle(Obstacles.getFromString("bush"))
        }
        for(let i=0;i<15;i++){
            this.generate_obstacle(Obstacles.getFromString("oak_tree"))
        }
        */
    }
}