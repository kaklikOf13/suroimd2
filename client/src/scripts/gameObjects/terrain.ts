import { Floors, TerrainManager } from "common/scripts/others/terrain.ts";
import { Graphics2D } from "../engine/container.ts";
import { ColorM } from "../engine/renderer.ts";
import { MapConfig } from "common/scripts/packets/map_packet.ts";

export class TerrainM extends TerrainManager{
    map!:MapConfig
    process_map(mp:MapConfig){
        this.map=mp
        for(const f of mp.terrain){
            this.add_floor(f.type,f.hb,undefined,f.smooth)
        }
    }

    draw(graphic:Graphics2D,scale:number){
        for(const f of this.floors[0]){
            graphic.beginPath()
            graphic.set_hitbox(f.hb)
            if(f.smooth)graphic.smooth_shape()
            graphic.endPath()
            graphic.fill_color(ColorM.number(Floors[f.type].default_color))
            graphic.fill()
        }
        graphic.fill_color(ColorM.hex("#0005"))
    }
}