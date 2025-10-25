import { ObstacleBehaviorDoor } from "../definitions/objects/obstacles.ts";
import { Orientation, v2 } from "../engine/geometry.ts";
import { RectHitbox2D } from "../engine/hitbox.ts";

export function CalculateDoorHitbox(hitbox:RectHitbox2D,side:Orientation,door:ObstacleBehaviorDoor):Record<-1|0|1,RectHitbox2D>{
    return {
        [-1]:hitbox,
        0:hitbox,
        1:hitbox.transform(
            v2.new(3,0),
            1,0
        )
    }
}