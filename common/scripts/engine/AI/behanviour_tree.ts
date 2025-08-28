export enum NodeStatus {
  Success = 'SUCCESS',
  Failure = 'FAILURE',
  Running = 'RUNNING',
}

export interface TickContext<OBJ, Settings> {
  object: OBJ
  blackboard: Blackboard
  settings: Settings & { reaction_time: number; decision_update_rate: number }
  dt: number
}

export class Blackboard {
  private map = new Map<string, any>()
  set(key: string, value: any) { this.map.set(key, value) }
  get<T = any>(key: string): T | undefined { return this.map.get(key) }
  has(key: string) { return this.map.has(key) }
  remove(key: string) { this.map.delete(key) }
  clear() { this.map.clear() }
}

export interface BTNode<OBJ, Settings> {
  name?: string
  tick(ctx: TickContext<OBJ, Settings>): NodeStatus
  reset?(ctx: TickContext<OBJ, Settings>): void
}

export abstract class CompositeNode<OBJ, Settings> implements BTNode<OBJ, Settings> {
  children: BTNode<OBJ, Settings>[]
  name?: string
  constructor(children: BTNode<OBJ, Settings>[] = [], name?: string) { this.children = children; this.name = name }
  abstract tick(ctx: TickContext<OBJ, Settings>): NodeStatus
  reset(ctx: TickContext<OBJ, Settings>) { for (const c of this.children) if (c.reset) c.reset(ctx) }
}

export class SequenceNode<OBJ, Settings> extends CompositeNode<OBJ, Settings> {
  private runningIndex = 0
  tick(ctx: TickContext<OBJ, Settings>) {
    for (let i = this.runningIndex; i < this.children.length; i++) {
      const status = this.children[i].tick(ctx)
      if (status === NodeStatus.Running) { this.runningIndex = i; return NodeStatus.Running }
      if (status === NodeStatus.Failure) { this.runningIndex = 0; return NodeStatus.Failure }
    }
    this.runningIndex = 0
    return NodeStatus.Success
  }
  reset(ctx: TickContext<OBJ, Settings>) { this.runningIndex = 0; super.reset(ctx) }
}

export class SelectorNode<OBJ, Settings> extends CompositeNode<OBJ, Settings> {
  private runningIndex = 0
  tick(ctx: TickContext<OBJ, Settings>) {
    for (let i = this.runningIndex; i < this.children.length; i++) {
      const status = this.children[i].tick(ctx)
      if (status === NodeStatus.Running) { this.runningIndex = i; return NodeStatus.Running }
      if (status === NodeStatus.Success) { this.runningIndex = 0; return NodeStatus.Success }
    }
    this.runningIndex = 0
    return NodeStatus.Failure
  }
  reset(ctx: TickContext<OBJ, Settings>) { this.runningIndex = 0; super.reset(ctx) }
}

export class ParallelNode<OBJ, Settings> extends CompositeNode<OBJ, Settings> {
  successThreshold: number
  constructor(children: BTNode<OBJ, Settings>[], successThreshold: number, name?: string) {
    super(children, name)
    this.successThreshold = successThreshold
  }
  tick(ctx: TickContext<OBJ, Settings>) {
    let success = 0
    let failure = 0
    for (const c of this.children) {
      const s = c.tick(ctx)
      if (s === NodeStatus.Success) success++
      if (s === NodeStatus.Failure) failure++
    }
    if (success >= this.successThreshold) return NodeStatus.Success
    if (failure > (this.children.length - this.successThreshold)) return NodeStatus.Failure
    return NodeStatus.Running
  }
}

export class ActionNode<OBJ, Settings> implements BTNode<OBJ, Settings> {
  name?: string
  private fn: (ctx: TickContext<OBJ, Settings>) => NodeStatus
  constructor(fn: (ctx: TickContext<OBJ, Settings>) => NodeStatus, name?: string) { this.fn = fn; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) { return this.fn(ctx) }
}

export class ConditionNode<OBJ, Settings> implements BTNode<OBJ, Settings> {
  name?: string
  private fn: (ctx: TickContext<OBJ, Settings>) => boolean
  constructor(fn: (ctx: TickContext<OBJ, Settings>) => boolean, name?: string) { this.fn = fn; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) { return this.fn(ctx) ? NodeStatus.Success : NodeStatus.Failure }
}

export class Inverter<OBJ, Settings> implements BTNode<OBJ, Settings> {
  child: BTNode<OBJ, Settings>
  name?: string
  constructor(child: BTNode<OBJ, Settings>, name?: string) { this.child = child; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) {
    const r = this.child.tick(ctx)
    if (r === NodeStatus.Success) return NodeStatus.Failure
    if (r === NodeStatus.Failure) return NodeStatus.Success
    return NodeStatus.Running
  }
}

export class Succeeder<OBJ, Settings> implements BTNode<OBJ, Settings> {
  child: BTNode<OBJ, Settings>
  name?: string
  constructor(child: BTNode<OBJ, Settings>, name?: string) { this.child = child; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) {
    const _ = this.child.tick(ctx)
    return NodeStatus.Success
  }
}

export class Failer<OBJ, Settings> implements BTNode<OBJ, Settings> {
  child: BTNode<OBJ, Settings>
  name?: string
  constructor(child: BTNode<OBJ, Settings>, name?: string) { this.child = child; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) {
    const _ = this.child.tick(ctx)
    return NodeStatus.Failure
  }
}

export class WaitNode<OBJ, Settings> implements BTNode<OBJ, Settings> {
  private remaining = 0
  name?: string
  duration: number
  constructor(duration: number, name?: string) { this.duration = duration; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) {
    if (this.remaining <= 0) this.remaining = this.duration
    this.remaining -= ctx.dt
    if (this.remaining > 0) return NodeStatus.Running
    this.remaining = 0
    return NodeStatus.Success
  }
  reset(ctx: TickContext<OBJ, Settings>) { this.remaining = 0 }
}

export class RepeatNode<OBJ, Settings> implements BTNode<OBJ, Settings> {
  child: BTNode<OBJ, Settings>
  times: number
  private counter = 0
  name?: string
  constructor(child: BTNode<OBJ, Settings>, times = -1, name?: string) { this.child = child; this.times = times; this.name = name }
  tick(ctx: TickContext<OBJ, Settings>) {
    const status = this.child.tick(ctx)
    if (status === NodeStatus.Success) {
      this.counter++
      if (this.times === -1) return NodeStatus.Running
      if (this.counter >= this.times) { this.counter = 0; return NodeStatus.Success }
      return NodeStatus.Running
    }
    if (status === NodeStatus.Failure) { this.counter = 0; return NodeStatus.Failure }
    return NodeStatus.Running
  }
  reset(ctx: TickContext<OBJ, Settings>) { this.counter = 0; if (this.child.reset) this.child.reset(ctx) }
}

export type ActionTreeDef<OBJ, Settings> = BTNode<OBJ, Settings>

export class BehaviourTree<OBJ extends { id?: string }, Settings extends {}> {
  object: OBJ
  settings: { reaction_time: number; decision_update_rate: number } & Settings
  tree: ActionTreeDef<OBJ, typeof this.settings>
  blackboard: Blackboard = new Blackboard()
  last_update: number
  private rootStatus: NodeStatus | null = null

  constructor(object: OBJ, settings: { reaction_time: number; decision_update_rate: number } & Settings, tree: ActionTreeDef<OBJ, typeof settings>) {
    this.object = object
    this.settings = settings
    this.tree = tree
    this.last_update = settings.decision_update_rate
  }

  update(dt: number) {
    this.last_update -= dt
    if (this.last_update <= 0) {
      const ctx: TickContext<OBJ, typeof this.settings> = { object: this.object, blackboard: this.blackboard, settings: this.settings, dt }
      this.rootStatus = this.tree.tick(ctx)
      this.last_update = this.settings.decision_update_rate
    }
    const continuousCtx: TickContext<OBJ, typeof this.settings> = { object: this.object, blackboard: this.blackboard, settings: this.settings, dt }
    if (this.rootStatus === NodeStatus.Running) {
      this.tree.tick(continuousCtx)
    }
  }

  reset() {
    const ctx: TickContext<OBJ, typeof this.settings> = { object: this.object, blackboard: this.blackboard, settings: this.settings, dt: 0 }
    if (this.tree.reset) this.tree.reset(ctx)
    this.rootStatus = null
    this.blackboard.clear()
    this.last_update = this.settings.decision_update_rate
  }
}