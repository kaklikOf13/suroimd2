import { Floors, FloorType, TerrainManager } from "common/scripts/others/terrain.ts";
import { Graphics2D } from "../engine/container.ts";
import { ColorM, WebglRenderer } from "../engine/renderer.ts";
import { MapConfig } from "common/scripts/packets/map_packet.ts";
import { type Game } from "../others/game.ts";

export class TerrainM extends TerrainManager{
    map!:MapConfig
    game:Game
    constructor(game:Game){
        super()
        this.game=game
    }
    process_map(mp:MapConfig){
        this.map=mp
        for(const f of mp.terrain){
            this.add_floor(f.type,f.hb,f.layer,f.smooth)
        }
    }

    draw(graphic:Graphics2D,scale:number){
        for(const f of this.floors){
            graphic.beginPath()
            graphic.set_hitbox(f.hb)
            if(f.smooth)graphic.smooth_shape()
            graphic.repeat_size=3
            graphic.endPath()
            graphic.fill_color(ColorM.number(Floors[f.type].default_color))
            graphic.fill()
        }
        graphic.fill_color(ColorM.hex("#0005"))
        graphic.beginPath()
    }
}