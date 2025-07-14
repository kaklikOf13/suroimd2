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
        width:5,
        height:0.8, // 0.4H = 0.01 radius
    },
    small:{
        width:6,
        height:1, // 0.6H = 0.012 radius
    },
    medium:{
        width:7,
        height:1.3, // 0.7H = 0.014 radius
    },
    large:{
        width:6,
        height:1.7, // 1H = 0.02 radius
    },
    xl:{
        width:7,
        height:2, // 1.2H = 0.025 radius
    },
    mirv:{
        height:3,// 0.4h = 0.01 radius
        width:1,
        color:0x0044aa
    },
    black_projectile:{
        height:1, // 1H = 0.02 radius
        width:1.3,
        color:0x334455
    }
}