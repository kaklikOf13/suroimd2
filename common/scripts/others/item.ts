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
        proj:{
            img:1,
            width:1,
            height:1
        }
    },
    small:{
        width:5.5,
        height:1, // 0.6H = 0.012 radius
        proj:{
            img:1,
            width:1,
            height:1
        }
    },
    medium:{
        width:8.5,
        height:1.3, // 0.7H = 0.014 radius
        proj:{
            img:1,
            width:1,
            height:1
        }
    },
    large:{
        width:12,
        height:2.3, // 1H = 0.02 radius
        proj:{
            img:1,
            width:1.5,
            height:1.5
        }
    },
    xl:{
        width:12,
        height:2.7, // 1.2H = 0.025 radius
        proj:{
            img:1,
            width:1,
            height:1
        }
    },
    mirv:{
        height:3,// 0.4h = 0.01 radius
        width:1,
        color:0x0044aa,
        proj:{
            img:1,
            width:1,
            height:1
        }
    },
    black_projectile:{
        height:1, // 1H = 0.02 radius
        width:1.3,
        color:0x334455,
        proj:{
            img:1,
            width:1,
            height:1
        }
    }
}