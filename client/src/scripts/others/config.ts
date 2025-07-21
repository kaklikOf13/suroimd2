import { Server } from "../engine/mod.ts";

export const server=new Server("localhost",8080,false)
export enum GraphicsConfig {
    VeryLow=0,
    Low=1,
    Medium=2,
    High=3,
    VeryHigh=4,
    Ultra=5
}

export const Graphics:GraphicsConfig=GraphicsConfig.VeryLow

export const Debug={
    hitbox:false,
}