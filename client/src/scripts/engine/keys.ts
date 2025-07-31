import { SignalManager, Vec2, v2 } from "common/scripts/engine/mod.ts";
import { type Camera2D } from "./container.ts";

export enum Key{
    A=0,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I,
    J,
    K,
    L,
    M,
    N,
    O,
    P,
    Q,
    R,
    S,
    T,
    U,
    V,
    W,
    X,
    Y,
    Z,
    Number_0,
    Number_1,
    Number_2,
    Number_3,
    Number_4,
    Number_5,
    Number_6,
    Number_7,
    Number_8,
    Number_9,
    
    Enter,
    Backspace,
    Space,
    Delete,
    Tab,
    LShift,
    RShift,
    LCtrl,
    RCtrl,
    LALT,
    RALT,

    Arrow_Up,
    Arrow_Down,
    Arrow_Left,
    Arrow_Right,

    Mouse_Left,
    Mouse_Middle,
    Mouse_Right,

    Mouse_Option1,
    Mouse_Option2
}

export const JSKeys:Record<Key,number>={
  [Key.A]: 65,
  [Key.B]: 66,
  [Key.C]: 67,
  [Key.D]: 68,
  [Key.E]: 69,
  [Key.F]: 70,
  [Key.G]: 71,
  [Key.H]: 72,
  [Key.I]: 73,
  [Key.J]: 74,
  [Key.K]: 75,
  [Key.L]: 76,
  [Key.M]: 77,
  [Key.N]: 78,
  [Key.O]: 79,
  [Key.P]: 80,
  [Key.Q]: 81,
  [Key.R]: 82,
  [Key.S]: 83,
  [Key.T]: 84,
  [Key.U]: 85,
  [Key.V]: 86,
  [Key.W]: 87,
  [Key.X]: 88,
  [Key.Y]: 89,
  [Key.Z]: 100,

  [Key.Number_0]: 48,
  [Key.Number_1]: 49,
  [Key.Number_2]: 50,
  [Key.Number_3]: 51,
  [Key.Number_4]: 52,
  [Key.Number_5]: 53,
  [Key.Number_6]: 54,
  [Key.Number_7]: 55,
  [Key.Number_8]: 56,
  [Key.Number_9]: 57,

  [Key.Enter]: 13,
  [Key.Backspace]: 8,
  [Key.Space]: 32,
  [Key.Delete]: 46,
  [Key.Tab]: 9,

  [Key.LShift]: 16,
  [Key.RShift]: 16,

  [Key.LCtrl]: 17,
  [Key.RCtrl]: 17,

  [Key.LALT]: 18,
  [Key.RALT]: 18,

  [Key.Arrow_Up]: 38,
  [Key.Arrow_Down]: 40,
  [Key.Arrow_Left]: 37,
  [Key.Arrow_Right]: 39,

  [Key.Mouse_Left]: 300,
  [Key.Mouse_Middle]: 301,
  [Key.Mouse_Right]: 302,
  [Key.Mouse_Option1]: 303,
  [Key.Mouse_Option2]: 304
}
export const KeyNames: Record<number, Key> = {
    65: Key.A,
    66: Key.B,
    67: Key.C,
    68: Key.D,
    69: Key.E,
    70: Key.F,
    71: Key.G,
    72: Key.H,
    73: Key.I,
    74: Key.J,
    75: Key.K,
    76: Key.L,
    77: Key.M,
    78: Key.N,
    79: Key.O,
    80: Key.P,
    81: Key.Q,
    82: Key.R,
    83: Key.S,
    84: Key.T,
    85: Key.U,
    86: Key.V,
    87: Key.W,
    88: Key.X,
    89: Key.Y,
    100: Key.Z,
  
    48: Key.Number_0,
    49: Key.Number_1,
    50: Key.Number_2,
    51: Key.Number_3,
    52: Key.Number_4,
    53: Key.Number_5,
    54: Key.Number_6,
    55: Key.Number_7,
    56: Key.Number_8,
    57: Key.Number_9,
  
    13: Key.Enter,
    8: Key.Backspace,
    32: Key.Space,
    46: Key.Delete,
    9: Key.Tab,
  
    16: Key.LShift,
    17: Key.LCtrl,
    18: Key.LALT,

    38: Key.Arrow_Up,
    40: Key.Arrow_Down,
    37: Key.Arrow_Left,
    39: Key.Arrow_Right,
  
    300: Key.Mouse_Left,
    301: Key.Mouse_Middle,
    302: Key.Mouse_Right,
    303: Key.Mouse_Option1,
    304: Key.Mouse_Option2
}

export enum KeyEvents{
    KeyDown="keydown",
    KeyUp="keyup"
}
export enum MouseEvents{
    MouseMove="mousemove",
}

export class KeyListener{
    private keys:number[]
    private keysdown:number[]
    private keysup:number[]

    public listener:SignalManager
    constructor(){
        this.keys=[]
        this.keysdown=[]
        this.keysup=[]
        this.listener=new SignalManager()
    }
    bind(elem:HTMLElement){
        elem.addEventListener("keydown",(e:KeyboardEvent)=>{
            this.keysdown.push(e.keyCode)
            this.keys.push(e.keyCode)
            this.listener.emit(KeyEvents.KeyDown,KeyNames[e.keyCode])
        })
        elem.addEventListener("keyup",(e:KeyboardEvent)=>{
            this.keysup.push(e.keyCode)
            this.listener.emit(KeyEvents.KeyUp,KeyNames[e.keyCode])
        })
        elem.addEventListener("mousedown",(e:MouseEvent)=>{
            this.keysdown.push(e.button+300)
            this.keys.push(e.button+300)
            
            this.listener.emit(KeyEvents.KeyDown,KeyNames[e.button+300])
        })
        elem.addEventListener("mouseup",(e:MouseEvent)=>{
            this.keys.splice(this.keys.indexOf(e.button+300))
            this.keysup.push(e.button+300)
            this.listener.emit(KeyEvents.KeyUp,KeyNames[e.button+300])
        })
    }
    //to work
    tick(){
        this.keysdown=[]
        for(const i of this.keysup){
            let index=this.keys.indexOf(i)
            while(index!=-1){
                this.keys.splice(index,1)
                index=this.keys.indexOf(i)
            }
        }
        this.keysup=[]
    }
    keyPress(key:Key):boolean{
        return this.keys.includes(JSKeys[key])
    }
    keyDown(key:Key):boolean{
        return this.keysdown.includes(JSKeys[key])
    }
    keyUp(key:Key):boolean{
        return this.keysup.includes(JSKeys[key])
    }
}

export class MousePosListener{
    private _position:Vec2
    private readonly meter_size:number
    public listener:SignalManager
    get position():Vec2{
        return v2.dscale(this._position,this.meter_size)
    }
    constructor(meter_size:number){
        this._position=v2.new(0,0)
        this.meter_size=meter_size
        this.listener=new SignalManager()
    }
    camera_pos(camera:Camera2D):Vec2{
        return v2.add(v2.scale(this.position,camera.zoom),camera.position)
    }
    bind(elem:HTMLElement,canvas:HTMLCanvasElement){
        elem.addEventListener("pointermove",(e:MouseEvent)=>{
            const rect=canvas.getBoundingClientRect()
            this._position=v2.new(e.x-rect.left,e.y-rect.top)
            this.listener.emit(MouseEvents.MouseMove,this.position)
        })
    }
}
export enum GamepadButtonID {
    A = 0,
    B = 1,
    X = 2,
    Y = 3,

    L1 = 4,
    R1 = 5,
    L2 = 6,
    R2 = 7,

    Select = 8,
    Start = 9,

    L3 = 10,
    R3 = 11,

    DPAD_Up = 12,
    DPAD_Down = 13,
    DPAD_Left = 14,
    DPAD_Right = 15,

    Home = 16
}
export enum GamepadManagerEvent{
    close="close",
    buttondown="buttondown",
    buttonup="buttonup",
    analogicmove="analogicmove"
}
export class GamepadManager {
    listener: SignalManager = new SignalManager();
    private previousStates: Map<number, Gamepad> = new Map();
    private deadZone: Vec2;
    private animationFrameId: number | null = null;

    constructor(deadZone: Vec2 = v2.new(0.1, 0.1)) {
        this.deadZone = deadZone;

        addEventListener("gamepadconnected", (e: GamepadEvent) => {
            this.previousStates.set(e.gamepad.index, e.gamepad);
            this.listener.emit(GamepadManagerEvent.analogicmove, { index: e.gamepad.index, gamepad: e.gamepad });
            this.startLoop();
        });

        addEventListener("gamepaddisconnected", (e: GamepadEvent) => {
            this.previousStates.delete(e.gamepad.index);
            this.listener.emit(GamepadManagerEvent.close, { index: e.gamepad.index });
        });
    }

    private startLoop() {
        const loop = () => {
            const pads = navigator.getGamepads();
            for (const pad of pads) {
                if (!pad) continue;

                const prev = this.previousStates.get(pad.index);
                if (!prev) {
                    this.previousStates.set(pad.index, pad);
                    continue;
                }

                // Check button changes
                for (let i = 0; i < pad.buttons.length; i++) {
                    const current = pad.buttons[i].pressed;
                    const previous = prev.buttons[i]?.pressed ?? false;

                    if (current && !previous) {
                        this.listener.emit(GamepadManagerEvent.buttondown, { index: pad.index, button: i });
                    } else if (!current && previous) {
                        this.listener.emit(GamepadManagerEvent.buttonup, { index: pad.index, button: i });
                    }
                }

                if (pad.axes.length >= 2) {
                    const x = pad.axes[0];
                    const y = pad.axes[1];
                    const dx = Math.abs(x) < this.deadZone.x ? 0 : x;
                    const dy = Math.abs(y) < this.deadZone.y ? 0 : y;
                    this.listener.emit(GamepadManagerEvent.analogicmove, {
                        index: pad.index,
                        stick: "left",
                        axis: v2.new(dx, dy)
                    });
                }
                if (pad.axes.length >= 4) {
                    const x = pad.axes[2];
                    const y = pad.axes[3];
                    const dx = Math.abs(x) < this.deadZone.x ? 0 : x;
                    const dy = Math.abs(y) < this.deadZone.y ? 0 : y;
                    this.listener.emit(GamepadManagerEvent.analogicmove, {
                        index: pad.index,
                        stick: "right",
                        axis: v2.new(dx, dy)
                    });
                }

                this.previousStates.set(pad.index, {
                    buttons: pad.buttons.map(b => ({ pressed: b.pressed })),
                    axes: [...pad.axes],
                // deno-lint-ignore no-explicit-any
                } as any);
            }

            this.animationFrameId = requestAnimationFrame(loop);
        };

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(loop);
        }
    }

    stop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}
export interface InputAction {
    keys: number[];    // Teclado / mouse
    buttons: number[]; // Gamepad
}

export interface ActionEvent {
    action: string;
}

export class InputManager {
    gamepad: GamepadManager;
    mouse: MousePosListener;
    keys: KeyListener;

    actions: Map<string, InputAction> = new Map();
    private activeActions: Set<string> = new Set();
    private pressedButtons: Set<number> = new Set(); // <-- NOVO

    private callbacks: Record<"actiondown" | "actionup", ((event: ActionEvent) => void)[]> = {
        actiondown: [],
        actionup: [],
    };

    constructor(meterSize: number) {
        this.gamepad = new GamepadManager();
        this.mouse = new MousePosListener(meterSize);
        this.keys = new KeyListener();

        // Captura eventos do controle e atualiza estado
        this.gamepad.listener.on(GamepadManagerEvent.buttondown, (e: { button: number }) => {
            this.pressedButtons.add(e.button);
            this.handleInput(e.button, true);
        });

        this.gamepad.listener.on(GamepadManagerEvent.buttonup, (e: { button: number }) => {
            this.pressedButtons.delete(e.button);
            this.handleInput(e.button, false);
        });
    }

    bind(element: HTMLElement, canvas: HTMLCanvasElement) {
        this.keys.bind(element);
        this.mouse.bind(element, canvas);
    }

    on(event: "actiondown" | "actionup", callback: (event: ActionEvent) => void) {
        this.callbacks[event].push(callback);
    }

    registerAction(name: string, input: InputAction) {
        this.actions.set(name, input);
    }

    unregisterAction(name: string) {
        this.actions.delete(name);
        this.activeActions.delete(name);
    }

    private handleInput(code: number, isDown: boolean) {
        for (const [action, { keys, buttons }] of this.actions.entries()) {
            const match = keys.includes(code) || buttons.includes(code);

            if (match && isDown && !this.activeActions.has(action)) {
                this.activeActions.add(action);
                this.emit("actiondown", action);
            } else if (match && !isDown && this.activeActions.has(action)) {
                this.activeActions.delete(action);
                this.emit("actionup", action);
            }
        }
    }

    tick() {
        this.keys.tick();

        for (const [action, { keys, buttons }] of this.actions.entries()) {
            const keyPressed = keys.some(k => this.keys.keyPress(k));
            const buttonPressed = buttons.some(b => this.pressedButtons.has(b));

            const isPressed = keyPressed || buttonPressed;
            const wasActive = this.activeActions.has(action);

            if (isPressed && !wasActive) {
                this.activeActions.add(action);
                this.emit("actiondown", action);
            } else if (!isPressed && wasActive) {
                this.activeActions.delete(action);
                this.emit("actionup", action);
            }
        }
    }

    private emit(type: "actiondown" | "actionup", action: string) {
        const event: ActionEvent = { action };
        for (const callback of this.callbacks[type]) {
            callback(event);
        }
    }

    saveConfig(): Record<string, InputAction> {
        return Object.fromEntries(this.actions);
    }

    loadConfig(ac: Record<string, InputAction>) {
        for (const a of Object.keys(ac)) {
            this.registerAction(a, ac[a]);
        }
    }
}