import { Server } from "../engine/mod.ts";

export const server=new Server("localhost",8080,false)
export enum GraphicsConfig {
    Low=0,
    Medium=1,
    High=2
}

export const Graphics=GraphicsConfig.High

export const Debug={
    hitbox:false,
}