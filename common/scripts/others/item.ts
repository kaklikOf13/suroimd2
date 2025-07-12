export enum ItemQuality{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Developer
}
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