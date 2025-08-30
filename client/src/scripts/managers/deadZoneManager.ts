import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { type Game } from "../others/game.ts";
import { zIndexes } from "common/scripts/others/constants.ts";
import { Graphics2D } from "../engine/mod.ts";
export class DeadZoneManager{
    radius:number=5
    position:Vec2=v2.new(0,0)

    sprite:Graphics2D=new Graphics2D()
    game:Game
    constructor(game:Game){
        this.game=game
        this.sprite.zIndex=zIndexes.DeadZone
        this.sprite.scale=v2.new(1,1)
    }
    append(){
        /*const margin=100
        this.sprite.position=v2.new(50,50)
        this.sprite.beginPath()
        const model=cutSquareWithCircle(margin,1)
        this.sprite.fill_color(ColorM.rgba(100,10,70,200))
        this.sprite.command.push({type:"model",model:model})
        this.game.camera.addObject(this.sprite)*/
    }
    tick(){
    }
}