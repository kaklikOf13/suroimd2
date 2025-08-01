import { Hitbox2D, NetStream, NullHitbox2D, NullVec2, SeededRandom, Vec2, jaggedRectangle, random, v2 } from "common/scripts/engine/mod.ts";
import { type Game } from "./game.ts";
import { Obstacle } from "../gameObjects/obstacle.ts";
import { ObstacleDef, Obstacles } from "common/scripts/definitions/obstacles.ts";

import { IslandDef } from "common/scripts/definitions/maps/base.ts"
import { GameItem } from "common/scripts/definitions/utils.ts";
import { Guns } from "common/scripts/definitions/items/guns.ts";
import { Armors } from "common/scripts/definitions/items/equipaments.ts";
import { Backpacks } from "common/scripts/definitions/items/backpacks.ts";
import { Skins } from "common/scripts/definitions/loadout/skins.ts";
import { MapPacket } from "common/scripts/packets/map_packet.ts";
import { FloorType, TerrainManager } from "common/scripts/others/terrain.ts";
import { Consumibles } from "common/scripts/definitions/items/consumibles.ts";
import { Layers } from "common/scripts/others/constants.ts";

export function SingleIslandGeneration(map:GameMap,def:IslandDef,random:SeededRandom){
    map.terrain.add_floor(def.terrain.base,[
        v2.new(0,0),
        v2.new(map.size.x,0),
        v2.new(map.size.x,map.size.y),
        v2.new(0,map.size.y),
    ])
    let cp=0
    for(const f of def.terrain.floors.sort()){
        cp+=f.padding
        map.terrain.add_floor(f.type,jaggedRectangle(v2.new(cp,cp),v2.new(map.size.x-cp,map.size.y-cp),f.spacing,f.variation,random))
    }
}

export class GameMap{
    readonly size:Vec2
    game:Game
    constructor(game:Game,size:Vec2,_seed:number=0){
        this.size=size
        this.game=game
    }
    map_packet_stream:NetStream=new NetStream(new ArrayBuffer(10*1024))
    terrain:TerrainManager=new TerrainManager()
    getRandomPosition(hitbox:Hitbox2D,id:number,layer:number=Layers.Normal,gp?:(hitbox:Hitbox2D,map:GameMap)=>Vec2,valid?:(hitbox:Hitbox2D,id:number,layer:number,map:GameMap)=>boolean,maxAttempts:number=100):Vec2|undefined{
        let pos:Vec2|undefined=undefined
        let attempt=0
        if(!valid){
            valid=(hitbox:Hitbox2D,id:number,layer:number,map:GameMap)=>{
                const objs=map.game.scene.objects.cells.get_objects(hitbox,layer)
                for(const o of objs){
                    if(!(o.id===id&&o.layer===layer)&&hb.collidingWith((o as Obstacle).spawnHitbox)){
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
            if(!valid!(hb,id,layer,this)){
                pos=undefined
            }
            attempt++
        }
        return pos
    }
    add_obstacle(def:ObstacleDef):Obstacle{
        const o=this.game.scene.objects.add_object(new Obstacle(),Layers.Normal,undefined,{
            def:def
        }) as Obstacle
        return o
    }
    generate_obstacle(def:ObstacleDef):Obstacle|undefined{
        const o=this.add_obstacle(def)
        const p=this.getRandomPosition(def.spawnHitbox?def.spawnHitbox.clone():(def.hitbox?def.hitbox.clone():new NullHitbox2D(v2.new(0,0))),o.id,o.layer)
        if(!p){
            o.destroy()
            return undefined
        }
        o.set_position(p)
        o.manager.cells.updateObject(o)
        return o
    }
    generate(){
        for(let i=0;i<15;i++){
            this.generate_obstacle(Obstacles.getFromString("stone"))
        }
        for(let i=0;i<15;i++){
            this.generate_obstacle(Obstacles.getFromString("bush"))
        }
        for(let i=0;i<25;i++){
            this.generate_obstacle(Obstacles.getFromString("oak_tree"))
        }
        for(let i=0;i<5;i++){
            this.generate_obstacle(Obstacles.getFromString("barrel"))
        }
        for(let i=0;i<Object.values(Guns.valueNumber).length;i++){
            this.game.add_loot(v2.random2(NullVec2,this.size),Guns.getFromNumber(i) as unknown as GameItem,1)
        }
        this.game.add_loot(v2.new(3,3),Armors.getFromString("soldier_vest") as unknown as GameItem,1)
        this.game.add_loot(v2.new(3,3),Armors.getFromString("basic_helmet") as unknown as GameItem,1)
        this.game.add_loot(v2.new(3,3),Backpacks.getFromString("tactical_pack") as unknown as GameItem,1)

        this.game.add_loot(v2.new(3,3),Skins.getFromString("widower") as unknown as GameItem,1)
        this.game.add_loot(v2.new(3,3),Skins.getFromString("kaklik") as unknown as GameItem,1)
        this.game.add_loot(v2.new(3,3),Skins.getFromString("kitty") as unknown as GameItem,1)

        this.game.add_loot(v2.new(7,7),Consumibles.getFromString("soda") as unknown as GameItem,16)
        this.game.add_loot(v2.new(7,7),Consumibles.getFromString("small_blue_potion") as unknown as GameItem,16)
        this.game.add_loot(v2.new(7,7),Consumibles.getFromString("small_purple_potion") as unknown as GameItem,16)
        this.game.add_loot(v2.new(7,7),Consumibles.getFromString("small_red_crystal") as unknown as GameItem,16)
        this.game.add_loot(v2.new(7,7),Consumibles.getFromString("pocket_portal") as unknown as GameItem,1)

        SingleIslandGeneration(this,{
            terrain:{
                base:FloorType.Water,
                floors:[
                    {
                        padding:20,
                        type:FloorType.Sand,
                        spacing:4,
                        variation:1.3,
                    },
                    {
                        padding:7,
                        type:FloorType.Grass,
                        spacing:4,
                        variation:1.3,
                    }
                ]
            }
        },new SeededRandom(random.float(0,2314)))

        this.game.clients.packets_manager.encode(this.encode(),this.map_packet_stream)
    }
    encode():MapPacket{
        const p=new MapPacket()
        p.map={
            terrain:this.terrain.floors[0],
            size:this.size
        }
        return p
    }
}