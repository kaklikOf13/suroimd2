import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { Container2D, Graphics2D, Sprite2D, SubCanvas2D } from "../engine/container.ts";
import { ColorM, WebglRenderer } from "../engine/renderer.ts";
import { type Game } from "../others/game.ts";
import { GameConstants, zIndexes } from "common/scripts/others/constants.ts";
import { MapConfig } from "common/scripts/packets/map_packet.ts";
import { Obstacles } from "common/scripts/definitions/objects/obstacles.ts";
import { GetObstacleBaseFrame } from "../gameObjects/obstacle.ts";
import { HideElement, ShowElement } from "../engine/utils.ts";

export class MinimapManager{
    game:Game

    terrain_gfx=new Graphics2D()
    grid_gfx=new Graphics2D()

    map=new SubCanvas2D(1000,1000)

    canvas:HTMLCanvasElement=document.querySelector("#minimap-canvas") as HTMLCanvasElement
    ctx:CanvasRenderingContext2D

    full_map_canvas:HTMLCanvasElement=document.querySelector("#fullmap-canvas") as HTMLCanvasElement
    full_map_ctx:CanvasRenderingContext2D

    full_map:boolean=false
    set_full_map(v:boolean){
        this.full_map=v
        if(v){
            ShowElement(this.full_map_canvas)
        }else{
            HideElement(this.full_map_canvas)
        }
    }
    constructor(game:Game){
        this.game=game

        this.terrain_gfx.zIndex=0
        this.grid_gfx.zIndex=1

        this.map.add_child(this.terrain_gfx)
        this.map.add_child(this.grid_gfx)
        //this.map.add_child(this.game.dead_zone.map_sprite)

        this.map.zIndex=zIndexes.Minimap

        this.map.size=v2.new(1000,1000)

        this.map.camera.meter_size=10
        this.ctx=this.canvas.getContext("2d")!

        this.full_map_canvas.width=800
        this.full_map_canvas.height=800
        this.full_map_ctx=this.full_map_canvas.getContext("2d")!
        this.set_full_map(false)

        this.canvas.addEventListener("click",()=>this.set_full_map(!this.full_map))
    }
    update_grid(grid_gfx:Graphics2D,gridSize:number,camera_position:Vec2,camera_size:Vec2,line_size:number){
        grid_gfx.clear()
        grid_gfx.fill_color(ColorM.hex("#0000001e"))
        grid_gfx.drawGrid(v2.sub(v2.floor(v2.dscale(v2.sub(camera_position,v2.new(camera_size.x/2,camera_size.y/2)),gridSize)),v2.new(1,1)),v2.ceil(v2.new(camera_size.x/gridSize+2,camera_size.y/gridSize+2)),gridSize,line_size)
    }
    image: HTMLImageElement=new Image()
    render(){
        this.map.downscale=4
        this.map.camera.meter_size=10/(this.config.size.x/100)
        this.imgS=500*(this.config.size.x/20)
        this.ms=(this.imgS/10)/10
        this.map.update(0.1,this.game.resources)
        this.map.render(this.game.renderer as WebglRenderer,this.game.camera)
        this.map.update(0.1, this.game.resources)
        this.image.src=this.map.toBase64(this.game.resources)
    }
    imgS=10
    ms=1
    position:Vec2=v2.new(0,0)
    
    draw():Promise<void>{
        return new Promise<void>((resolve) => {    
            this.canvas.width = 500
            this.canvas.height = 500
            this.ctx.clearRect(0, 0, this.canvas.width,this.canvas.height)

            const halfW = this.canvas.width / 2
            const halfH = this.canvas.height / 2

            const vx=((this.position.x*this.ms))-halfH
            const vy=((this.position.y*this.ms))-halfW

            this.ctx.save()
            this.ctx.translate(-vx,-vy)
            this.ctx.drawImage(this.image,0,0,this.image.width,this.image.height,0,0,this.imgS, this.imgS)
            this.ctx.restore()
            this.ctx.fillStyle="#0ff"
            this.ctx.fillRect(halfW-5,halfH-5,10,10)
            resolve()

            if(this.full_map){
                this.full_map_ctx.drawImage(this.image,0,0,this.full_map_canvas.width,this.full_map_canvas.height)
                
                this.full_map_ctx.fillStyle="#0ff"
                const dp=v2.scale(v2.mult(this.position,this.map.scale),8)
                this.full_map_ctx.fillRect(dp.x-5,dp.y-5,10,10)
            }

            /*

            for (let i = 0; i < this.images.length; i++) {
                for (let j = 0; j < this.images[i].length; j++) {
                    const img = this.images[i][j]
                    if (img.complete) {
                        const x = j * this.imgS, y = i * this.imgS
                        this.ctx.drawImage(img, x, y, this.imgS, this.imgS)
                    }
                }
            }
            resolve()*/
        })
    }
    objects:Container2D=new Container2D()
    config!:MapConfig
    init(map:MapConfig){
        this.config=map
        this.objects.destroyed=true
        this.objects=new Container2D()
        this.map.add_child(this.objects)
        this.grid_gfx.clear()
        this.grid_gfx.fill_color(ColorM.hex("#0000001e"))
        this.grid_gfx.drawGrid(v2.new(0,0),map.size,GameConstants.collision.chunckSize,0.2)
        for(const ob of map.objects){
            switch(ob.type){
                case 0:{
                    const def=Obstacles.getFromNumber(ob.def)
                    const spr=new Sprite2D()
                    spr.zIndex=def.zIndex??zIndexes.Obstacles1
                    spr.set_frame({
                        image:GetObstacleBaseFrame(def,ob.variation),
                        position:ob.position,
                        rotation:ob.rotation,
                        scale:ob.scale,
                        hotspot:v2.new(0.5,0.5)
                    },this.game.resources)
                    this.objects.add_child(spr)
                    spr.cam=this.map.camera
                    spr.update_model()
                }
            }
        }
        this.objects.updateZIndex()
        this.render()
    }
}