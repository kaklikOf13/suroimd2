import { DeadZoneState, DeadZoneUpdate } from "common/scripts/packets/update_packet.ts";
import { Game } from "../others/game.ts";
import { v2, Vec2 } from "common/scripts/engine/geometry.ts";
import { CircleHitbox2D } from "common/scripts/engine/hitbox.ts";
import { Numeric } from "common/scripts/engine/utils.ts";
import { random } from "common/scripts/engine/random.ts";
export const DeadZoneDefinition: DeadZoneStage[] = [
    {
        state: DeadZoneState.Deenabled,
        damage: 0,
        radius: 0.85,
        old_radius: 0.85,
        new_radius: 0.85,
        time: 0,
    },
    {
        state: DeadZoneState.Waiting,
        damage: 0,
        radius: 0.85,
        old_radius: 0.85,
        new_radius: 0.7,
        time: 120,
    },
    {
        state: DeadZoneState.Advancing,
        damage: 2,
        radius: 0.9,
        old_radius: 0.9,
        new_radius: 0.7,
        time: 90,
    },
    {
        state: DeadZoneState.Waiting,
        damage: 2,
        radius: 0.7,
        old_radius: 0.7,
        new_radius: 0.45,
        time: 100,
    },
    {
        state: DeadZoneState.Advancing,
        damage: 5,
        radius: 0.7,
        old_radius: 0.7,
        new_radius: 0.45,
        time: 80,
    },
    {
        state: DeadZoneState.Waiting,
        damage: 5,
        radius: 0.45,
        old_radius: 0.45,
        new_radius: 0.25,
        time: 90,
    },
    {
        state: DeadZoneState.Advancing,
        damage: 10,
        radius: 0.45,
        old_radius: 0.45,
        new_radius: 0.25,
        time: 60,
    },
    {
        state: DeadZoneState.Waiting,
        damage: 10,
        radius: 0.25,
        old_radius: 0.25,
        new_radius: 0.1,
        time: 70,
    },
    {
        state: DeadZoneState.Advancing,
        damage: 20,
        radius: 0.25,
        old_radius: 0.25,
        new_radius: 0.1,
        time: 50,
    },
    {
        state: DeadZoneState.Waiting,
        damage: 20,
        radius: 0.1,
        old_radius: 0.1,
        new_radius: 0.0,
        time: 40,
    },
    {
        state: DeadZoneState.Advancing,
        damage: 50,
        radius: 0.1,
        old_radius: 0.1,
        new_radius: 0.0,
        time: 40,
    },
]

export interface DeadZoneStage {
  state: DeadZoneState;
  old_radius: number;   // fraction (0..1) of map.size.x
  radius: number;       // fraction (display)
  new_radius: number;   // fraction
  time: number;         // seconds
  damage: number;       // dps or damage per tick
}

/** modos de operação extra para procedural */
export enum DeadZoneProceduralMode {
  ShrinkOnly = "SHRINK_ONLY", // centro fixo, só encolhe
  Moving = "MOVING",          // encolhe e centro se move (lerp)
  Split = "SPLIT"             // escolhe novo centro longe -> cria "metade/metade" transição
}

export enum DeadZoneMode {
  Disabled,
  Staged,
  Procedural
}

export interface DeadZoneConfig {
  mode: DeadZoneMode;
  stages?: DeadZoneStage[];           // para Staged
  initialRadius?: number;             // para Procedural (fração do mapa ou px)
  initialPosition?: Vec2;             // em world coords (opcional)
  proceduralMode?: DeadZoneProceduralMode;
  waitingTime?: number;               // defaults
  advanceTime?: number;
  radiusDecay?: number;               // multiplicativo por etapa (0..1)
  minRadius?: number;                 // mínima fração/px antes de terminar
  waitingDecay?: number;
  advanceDecay?: number;
  damageLevels?: number[];            // opcional
  timeSpeed?: number;                 // divisor de tempo (ex.: 15 -> como teu code)
  // control for random pos generator
  randomPosAttempts?: number;
  randomBias?: number;                // 0..1 how biased to edges (1 = strong edge bias)
}

export class DeadZoneManager {
  readonly game: Game;
  readonly hitbox: CircleHitbox2D;

  state: DeadZoneUpdate = {
    new_position: v2.new(0, 0),
    new_radius: 0,
    position: v2.new(0, 0),
    radius: 0,
    state: DeadZoneState.Deenabled
  };

  old_position: Vec2 = v2.new(0, 0);
  old_radius: number = 1;

  stage = 0;
  dirty = true;

  config: DeadZoneConfig;
  countdownStart = 0;
  currentDuration = 0;
  completionRatio = 0;

  /** dano / tick control */
  do_damage = false;
  current_damage = 0;
  ddt = 0;

  time_speed: number = 1;

  constructor(game: Game, config: DeadZoneConfig) {
    this.game = game;
    this.config = {
      waitingTime: 80,
      advanceTime: 80,
      radiusDecay: 0.7,
      minRadius: 0.02,
      timeSpeed: 1,
      randomPosAttempts: 100,
      randomBias: 0.5,
      ...config
    };
    this.hitbox = new CircleHitbox2D(v2.new(0, 0), 1);

    // inicialização baseada no modo
    if (this.config.mode === DeadZoneMode.Staged && this.config.stages && this.config.stages.length > 0) {
      const first = this.config.stages[0];
      const center = this.config.initialPosition
        ? v2.mult(this.config.initialPosition, this.game.map.size)
        : v2.scale(this.game.map.size, 0.5);
      this.set_state(center, first.radius * this.game.map.size.x);
      this.state.state = first.state;
      this.current_damage = first.damage;
    } else if (this.config.mode === DeadZoneMode.Procedural) {
      const pos = this.config.initialPosition
        ? v2.mult(this.config.initialPosition, this.game.map.size)
        : v2.scale(this.game.map.size, 0.5);
      const radiusPx = (this.config.initialRadius ?? Math.min(this.game.map.size.x, this.game.map.size.y) * 0.5) * this.game.map.size.x;
      this.set_state(pos, radiusPx);
      this.current_damage = this.config.damageLevels?.[0] ?? 1;
      this.state.state = DeadZoneState.Waiting;
    }

    this.time_speed = this.config.timeSpeed ?? 1
  }

  set_state(position: Vec2, radius: number) {
    position = v2.clamp2(position, v2.new(0, 0), this.game.map.size);
    this.state.position = position;
    this.state.radius = radius;
    this.hitbox.position = this.state.position;
    this.hitbox.radius = this.state.radius;
    this.dirty = true;
  }

  /** Start the sequence (use after constructing) */
  start() {
    if (this.config.mode === DeadZoneMode.Staged) {
      this.stage = 0;
      this.advanceStage();
    } else if (this.config.mode === DeadZoneMode.Procedural) {
      // start procedural loop
      this.state.state = DeadZoneState.Waiting;
      this.countdownStart = Date.now();
      this.currentDuration = (this.config.waitingTime ?? 80) / this.time_speed;
    }
  }

  tick(dt: number) {
    if (this.state.state === DeadZoneState.Deenabled) return;

    this.ddt += dt;
    this.do_damage = false;
    if (this.ddt >= 2) {
      this.ddt = 0;
      this.do_damage = true;
    }

    if (this.currentDuration > 0) {
      this.completionRatio = (Date.now() - this.countdownStart) / (1000 * this.currentDuration);
    } else {
      this.completionRatio = 1;
    }

    if (this.completionRatio >= 1) {
      if (this.config.mode === DeadZoneMode.Staged) {
        this.advanceStage();
      } else if (this.config.mode === DeadZoneMode.Procedural) {
        this.advanceProcedural();
      }
    }

    if (this.state.state === DeadZoneState.Advancing) {
      // interpola entre old -> new
      const newR = Numeric.lerp(this.old_radius, this.state.new_radius, this.completionRatio);
      const newP = v2.lerp(this.old_position, this.state.new_position, this.completionRatio);
      this.set_state(newP, newR);
    }
  }

  advanceStage() {
    if (!this.config.stages) return;
    this.stage++;
    const next = this.config.stages[this.stage];
    if (!next) {
      this.state.state = DeadZoneState.Finished;
      this.currentDuration = 0;
      return;
    }

    this.old_position = this.state.position;
    this.old_radius = this.state.radius;

    this.state.state = next.state;
    this.state.new_radius = next.new_radius * this.game.map.size.x;
    this.old_radius = next.old_radius * this.game.map.size.x;
    this.state.radius = next.radius * this.game.map.size.x;

    if (this.state.state === DeadZoneState.Waiting) {
      this.state.new_position = this.random_point_within_map();
    }

    this.current_damage = next.damage;
    this.countdownStart = Date.now();
    this.currentDuration = (next.time / (this.time_speed || 1));
    this.dirty = true;
  }

  advanceProcedural() {
    const cfg = this.config;
    if (cfg.mode !== DeadZoneMode.Procedural) return;

    if (this.state.state === DeadZoneState.Waiting) {
      this.state.state = DeadZoneState.Advancing;

      this.old_position = this.state.position;
      this.old_radius = this.state.radius;

      const newRadius = Math.max((this.old_radius * (cfg.radiusDecay ?? 0.7)), (cfg.minRadius ?? 1) * this.game.map.size.x);
      this.state.new_radius = newRadius;

      const mode = cfg.proceduralMode ?? DeadZoneProceduralMode.Moving;
      if (mode === DeadZoneProceduralMode.ShrinkOnly) {
        this.state.new_position = this.state.position;
      } else if (mode === DeadZoneProceduralMode.Moving) {
        this.state.new_position = this.random_biased_position_within_radius(this.old_position, (this.old_radius - newRadius));
      } else if (mode === DeadZoneProceduralMode.Split) {
        this.state.new_position = this.random_point_far(this.old_position, Math.max(this.game.map.size.x * 0.2, this.old_radius));
      }

      this.countdownStart = Date.now();
      this.currentDuration = (cfg.advanceTime ?? 60) / (this.time_speed || 1);
      this.dirty = true;
    } else {
      this.state.state = DeadZoneState.Waiting;
      this.countdownStart = Date.now();
      this.currentDuration = (this.config.waitingTime ?? 80) / (this.time_speed || 1);
      this.current_damage = this.current_damage + 1;
      this.dirty = true;
    }
  }

  random_point_within_map(): Vec2 {
    return v2.new(random.float(0, this.game.map.size.x), random.float(0, this.game.map.size.y));
  }

  random_biased_position_within_radius(origin: Vec2, maxDelta: number): Vec2 {
    for (let i = 0; i < (this.config.randomPosAttempts ?? 100); i++) {
      const angle = random.float(0, Math.PI * 2);
      const bias = this.config.randomBias ?? 0.5;
      const dist = random.float(maxDelta * bias, maxDelta);
      const p = v2.new(origin.x + Math.cos(angle) * dist, origin.y + Math.sin(angle) * dist);
      if (p.x >= 0 && p.y >= 0 && p.x <= this.game.map.size.x && p.y <= this.game.map.size.y) {
        return p;
      }
    }
    return v2.clamp2(v2.new(origin.x + random.float(-maxDelta, maxDelta), origin.y + random.float(-maxDelta, maxDelta)), v2.new(0, 0), this.game.map.size);
  }

  random_point_far(origin: Vec2, minDist: number): Vec2 {
    for (let i = 0; i < (this.config.randomPosAttempts ?? 100); i++) {
      const angle = random.float(0, Math.PI * 2);
      const dist = random.float(minDist, Math.max(this.game.map.size.x, this.game.map.size.y) * 0.5);
      const p = v2.new(origin.x + Math.cos(angle) * dist, origin.y + Math.sin(angle) * dist);
      if (p.x >= 0 && p.y >= 0 && p.x <= this.game.map.size.x && p.y <= this.game.map.size.y) {
        return p;
      }
    }
    return v2.clamp2(v2.new(random.float(0, this.game.map.size.x), random.float(0, this.game.map.size.y)), v2.new(0, 0), this.game.map.size);
  }

  isInGas(position: Vec2): boolean {
    const dist2 = v2.distanceSquared(position, this.state.position);
    return dist2 >= (this.state.radius * this.state.radius);
  }

  damageAt(position: Vec2): number {
    if (!this.isInGas(position)) return 0;
    const dist = Math.sqrt(v2.distanceSquared(position, this.state.position));
    const extra = Math.max(0, dist - this.state.radius);
    return this.current_damage + (extra / Math.max(this.game.map.size.x, 1)) * (this.current_damage * 0.5);
  }

  clear() {
    this.state.state = DeadZoneState.Deenabled;
    this.currentDuration = 0;
    this.completionRatio = 0;
    this.current_damage = 0;
    this.dirty = true;
  }

  /** Reseta tudo */
  reset() {
    this.stage = 0;
    this.ddt = 0;
    this.do_damage = false;
    this.clear();
  }
}
