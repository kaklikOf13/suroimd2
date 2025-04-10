import { PacketsManager } from "../engine/packets.ts"
export { JoinPacket } from "../packets/join_packet.ts"
export { ActionPacket } from "../packets/action_packet.ts"
export { GameOverPacket } from "../packets/gameOver.ts"
import { JoinPacket } from "../packets/join_packet.ts"
import { ActionPacket } from "../packets/action_packet.ts"
import { GuiPacket } from "common/scripts/packets/gui_packet.ts"
import { GameOverPacket } from "../packets/gameOver.ts"

export const GameConstants={
    player:{
        defaultName:"Player",
        playerRadius:0.3,
        max_name_size:25,
    },
    loot:{
        velocityDecay:0.96,
        radius:{
            ammo:0.3,
        }
    },
    tps:100,
    collision:{
        threads:2,
        chunckSize:32
    }
}
export enum CATEGORYS{
    PLAYERS=0,
    LOOTS,
    BULLETS,
    OBSTACLES,
    EXPLOSIONS,
    PROJECTILES
}
export const CATEGORYSL=[
    CATEGORYS.PLAYERS,
    CATEGORYS.LOOTS,
    CATEGORYS.BULLETS,
    CATEGORYS.OBSTACLES,
    CATEGORYS.EXPLOSIONS,
    CATEGORYS.PROJECTILES
]
export enum ItemQuality{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Developer
}
export const PacketManager:PacketsManager=new PacketsManager()
PacketManager.add_packet(JoinPacket)
PacketManager.add_packet(ActionPacket)
PacketManager.add_packet(GuiPacket)
PacketManager.add_packet(GameOverPacket)
export const tracers={
    tiny:{
        width:0.4,
        height:0.4, // 0.4H = 0.01 radius
    },
    small:{
        width:1,
        height:0.6, // 0.6H = 0.012 radius
    },
    medium:{
        width:1.5,
        height:0.7, // 0.7H = 0.014 radius
    },
    large:{
        width:2,
        height:1, // 1H = 0.02 radius
    },
    xl:{
        width:3,
        height:1.4, // 1.2H = 0.025 radius
    },
    mirv:{
        height:0.4,// 0.4h = 0.01 radius
        width:1,
        color:0x0044aa
    },
    black_projectile:{
        height:1, // 1H = 0.02 radius
        width:1.3,
        color:0x334455
    }
}
export enum zIndexes{
    Explosions,
    Obstacles3=1,
    Obstacles2,
    Players,
    Obstacles1,
    DeadObstacles,
    Grid,
    Terrain,
}
export enum ActionsType{
    Reload,
    Healing
}

export type PlayerModifiers={
    damage:number
    speed:number
    health:number
    boost:number
    bullet_speed:number
    bullet_size:number
    critical_mult:number
}