import { NullVec2, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { type Game } from "./game.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { CATEGORYS } from "common/scripts/others/constants.ts";
import { Obstacles } from "common/scripts/definitions/obstacles.ts";

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
    generate(){
        for(let i=0;i<10;i++){
            this.game.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
                position:this.getRandomPosition(),
                def:Obstacles.getFromString("stone")
            })
        }
        for(let i=0;i<10;i++){
            this.game.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
                position:this.getRandomPosition(),
                def:Obstacles.getFromString("bush")
            })
        }
        for(let i=0;i<10;i++){
            this.game.scene.objects.add_object(new Obstacle(),CATEGORYS.OBSTACLES,undefined,{
                position:this.getRandomPosition(),
                def:Obstacles.getFromString("oak_tree")
            })
        }
    }
}