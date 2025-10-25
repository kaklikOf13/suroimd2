import { Floors, TerrainManager } from "common/scripts/others/terrain.ts";
import { Graphics2D } from "../engine/container_2d.ts";
import { ColorM } from "../engine/renderer.ts";
import { MapConfig } from "common/scripts/packets/map_packet.ts";
import { type Game } from "../others/game.ts";
import { HitboxType2D, PolygonHitbox2D } from "common/scripts/engine/hitbox.ts";
import { model2d } from "common/scripts/engine/models.ts";
import { Debug } from "../others/config.ts";

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
            //if(f.smooth)graphic.smooth_shape()
            graphic.repeat_size=3
            graphic.endPath()
            graphic.fill_color(ColorM.number(Floors[f.type].default_color))
            graphic.fill()
        }

        if(Debug.hitbox){
            for(const f of this.floors){
                graphic.fill_color(ColorM.hex("#ff0"))
                if(f.hb.type===HitboxType2D.polygon)
                for(const p of (f.hb as PolygonHitbox2D).points){
                    graphic.drawModel(model2d.circle(0.1,8,p))
                }
            }
        }
        graphic.fill_color(ColorM.hex("#0005"))
        graphic.beginPath()
    }
}