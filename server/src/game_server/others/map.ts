import { NullVec2, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { type Game } from "./game.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";

import {} from "common/scripts/definitions/maps/base.ts"

export class GameMap{
    readonly size:Vec2
    game:Game
    constructor(game:Game,size:Vec2,_seed:number=0){
        this.size=size
        this.game=game
    }
    getRandomPosition(_maxAttempts:number=30):Vec2{
        return v2.random2(NullVec2,this.size)
    }
    add_obstacle(position:Vec2,def:ObstacleDef):Obstacle{
        const o=this.game.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
            position:position,
            def:def
        }) as Obstacle
        return o
    }
    generate(){
        for(let i=0;i<5;i++){
            this.add_obstacle(this.getRandomPosition(),Obstacles.getFromString("barrel"))
        }
        for(let i=0;i<10;i++){
            this.add_obstacle(this.getRandomPosition(),Obstacles.getFromString("stone"))
        }
        for(let i=0;i<10;i++){
            this.add_obstacle(this.getRandomPosition(),Obstacles.getFromString("bush"))
        }
        for(let i=0;i<10;i++){
            this.add_obstacle(this.getRandomPosition(),Obstacles.getFromString("oak_tree"))
        }
    }
}