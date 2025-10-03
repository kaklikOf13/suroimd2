import { Game } from "../others/game.ts";
import { InventoryItemData } from "common/scripts/definitions/utils.ts";
import { ActionsType, GameOverPacket } from "common/scripts/others/constants.ts";
import { Angle, Numeric, v2, Vec2 } from "common/scripts/engine/mod.ts";
import { DamageSources, GameItems } from "common/scripts/definitions/alldefs.ts";
import { InputActionType } from "common/scripts/packets/action_packet.ts";
import { MeleeDef } from "common/scripts/definitions/items/melees.ts";
import { BoostType,Boosts } from "common/scripts/definitions/player/boosts.ts";
import { GunDef } from "common/scripts/definitions/items/guns.ts";
import { Ammos } from "common/scripts/definitions/items/ammo.ts";
import { KillFeedMessage, KillFeedMessageKillleader, KillFeedMessageType } from "common/scripts/packets/killfeed_packet.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";
import { isMobile } from "../engine/game.ts";
import { Debug, GraphicsDConfig } from "../others/config.ts";
import { HideElement, ShowElement } from "../engine/utils.ts";
import { JoystickEvent } from "../engine/keys.ts";
import { PrivateUpdate } from "common/scripts/packets/update_packet.ts";
import { Badges } from "common/scripts/definitions/loadout/badges.ts";
import { EmoteDef, Emotes} from "common/scripts/definitions/loadout/emotes.ts";

export interface HelpGuiState{
    driving:boolean
    gun:boolean
    loot:boolean
    interact:boolean
    information_box_message:string
}
export class GuiManager{
    game!:Game
    content={
        menuD:document.querySelector("#menu") as HTMLDivElement,
        gameD:document.querySelector("#game") as HTMLDivElement,
        game_gui:document.querySelector("#game-gui") as HTMLDivElement,
        health_bar_interior:document.querySelector("#health-bar") as HTMLDivElement,
        health_bar_animation:document.querySelector("#health-bar-animation") as HTMLDivElement,
        health_bar_amount:document.querySelector("#health-bar-amount") as HTMLSpanElement,

        _bar_interior:document.querySelector("#boost-bar") as HTMLDivElement,
        _bar_amount:document.querySelector("#boost-bar-amount") as HTMLSpanElement,

        hand_info_count:document.querySelector("#hand-info-count") as HTMLSpanElement,
        current_item_image:document.querySelector("#current-item-image") as HTMLImageElement,

        action_info_delay:document.querySelector("#action-info-delay") as HTMLSpanElement,
        action_info:document.querySelector("#action-info") as HTMLDivElement,

        inventory:document.querySelector("#inventory") as HTMLDivElement,

        helmet_slot:document.querySelector("#helmet-slot") as HTMLImageElement,
        vest_slot:document.querySelector("#vest-slot") as HTMLImageElement,

        debug_menu:document.querySelector("#game-debug-menu") as HTMLDivElement,

        gameOver:document.querySelector("#gameover-container") as HTMLDivElement,
        
        gameOver_main_message:document.querySelector("#gameover-main-message") as HTMLDivElement,
        gameOver_kills:document.querySelector("#gameover-kills") as HTMLDivElement,
        gameOver_damaged:document.querySelector("#gameover-damaged") as HTMLDivElement,
        gameOver_score:document.querySelector("#gameover-score") as HTMLDivElement,
        gameOver_menu_btn:document.querySelector("#gameover-menu-btn") as HTMLButtonElement,

        weapon1:document.querySelector("#game-weapon-slot-00") as HTMLDivElement,
        weapon2:document.querySelector("#game-weapon-slot-01") as HTMLDivElement,
        weapon3:document.querySelector("#game-weapon-slot-02") as HTMLDivElement,

        e_weapon1:document.querySelector("#game-weapon-slot-expanded-00") as HTMLDivElement,
        e_weapon2:document.querySelector("#game-weapon-slot-expanded-01") as HTMLDivElement,
        e_weapon3:document.querySelector("#game-weapon-slot-expanded-02") as HTMLDivElement,

        ammos:document.querySelector("#ammos-inventory") as HTMLDivElement,
        ammos_all:document.querySelector("#all-inventory-ammos") as HTMLDivElement,

        killfeed:document.querySelector("#killfeed-container") as HTMLDivElement,
        
        information_killbox:document.querySelector("#information-killbox") as HTMLDivElement,
        information_interact:document.querySelector("#information-interaction") as HTMLDivElement,

        killeader_span:document.querySelector("#killeader-text") as HTMLSpanElement,

        gui_items:document.querySelector("#gui-items") as HTMLSpanElement,
        gui_items_all:document.querySelector("#all-inventory-items") as HTMLSpanElement,

        help_gui:document.querySelector("#help-gui") as HTMLDivElement,

        debug_show:document.querySelector("#debug-show") as HTMLDivElement,

        all_inventory:document.querySelector("#all-inventory") as HTMLDivElement,
        close_all_inventory:document.querySelector("#close-all-inventory") as HTMLButtonElement,

        post_proccess:{
            vignetting:document.querySelector("#vignetting-gfx") as HTMLDivElement,
            tiltshift:document.querySelector("#tiltshift-gfx") as HTMLDivElement,
            recolor:document.querySelector("#recolor-gfx") as HTMLDivElement,
        },
        debug:{
            input_item_id:document.querySelector("#debug-item-id") as HTMLInputElement,
            input_item_count:document.querySelector("#debug-item-count") as HTMLInputElement,
            btn_give:document.querySelector("#debug-give-item") as HTMLButtonElement,
            btn_spawn:document.querySelector("#debug-spawn-item") as HTMLButtonElement,
        },
        emote_wheel:{
            main:document.querySelector("#emote-wheel") as HTMLDivElement,
            hover:document.querySelector("#emote-wheel-hover") as HTMLImageElement,

            emotes:[
                document.querySelector("#emote-wheel-right") as HTMLImageElement,
                document.querySelector("#emote-wheel-bottom") as HTMLImageElement,
                document.querySelector("#emote-wheel-left") as HTMLImageElement,
                document.querySelector("#emote-wheel-top") as HTMLImageElement
            ]
        }
    }
    mobile_content={
        gui:document.querySelector("#game-mobile-gui") as HTMLDivElement,
        left_joystick:document.querySelector("#left-joystick") as HTMLDivElement,
        right_joystick:document.querySelector("#right-joystick") as HTMLDivElement,

        btn_interact:document.querySelector("#btn-mobile-interact") as HTMLButtonElement,
        btn_inventory:document.querySelector("#btn-mobile-inventory") as HTMLButtonElement,
        btn_reload:document.querySelector("#btn-mobile-reload") as HTMLButtonElement,
    }

    weapons:{
        0?:MeleeDef,
        1?:GunDef,
        2?:GunDef
    }={
        0:undefined,
        1:undefined,
        2:undefined
    }
    action?:{delay:number,start:number,type:ActionsType}

    currentWeapon?:HTMLDivElement
    currentWeaponIDX:number=0
    killleader?:{
        id:number
        kills:number
    }
    constructor(){
        this.set_health(100,100)
        HideElement(this.content.debug_menu)
        HideElement(this.content.gameOver)

        const deenable_act=()=>{
            this.game.can_act=false
        }
        const enable_act=()=>{
            this.game.can_act=true
        }

        this.content.debug.input_item_id.onfocus=deenable_act
        this.content.debug.input_item_id.onblur=enable_act

        this.content.debug.input_item_count.onfocus=deenable_act
        this.content.debug.input_item_count.onblur=enable_act

        this.content.debug.btn_give.addEventListener("click",(_e)=>{
            this.game.action.actions.push({
                type:InputActionType.debug_give,
                item:this.content.debug.input_item_id.value,
                count:parseInt(this.content.debug.input_item_count.value)
            })
        })
        this.content.debug.btn_spawn.addEventListener("click",(_e)=>{
            this.game.action.actions.push({
                type:InputActionType.debug_spawn,
                item:this.content.debug.input_item_id.value,
                count:parseInt(this.content.debug.input_item_count.value)
            })
        })

        const dropW=(w:number)=>{
            return (e:MouseEvent)=>{
                if(e.button==2){
                    this.game.action.actions.push({type:InputActionType.drop,drop:w,drop_kind:1})
                }
            }
        }

        const dropW2=(w:number)=>{
            return ()=>{
                this.game.action.actions.push({type:InputActionType.drop,drop:w,drop_kind:1})
            }
        }
        
        const selecW=(w:number)=>{
            return ()=>{
                this.game.action.actions.push({type:InputActionType.set_hand,hand:w})
            }
        }
        this.content.weapon1.addEventListener("mouseup",dropW(0))
        this.content.weapon2.addEventListener("mouseup",dropW(1))
        this.content.weapon3.addEventListener("mouseup",dropW(2))

        this.content.e_weapon2.addEventListener("click",dropW2(1))
        this.content.e_weapon3.addEventListener("click",dropW2(2))

        this.content.weapon1.addEventListener("touchstart",selecW(0))
        this.content.weapon2.addEventListener("touchstart",selecW(1))
        this.content.weapon3.addEventListener("touchstart",selecW(2))

        this.update_ammos({})
        this.update_gui_items([
        ])
        document.addEventListener("contextmenu", e => e.preventDefault());
        this.clear()
        HideElement(this.content.gameD)
        ShowElement(this.content.menuD)
        HideElement(this.content.emote_wheel.main)
        HideElement(this.content.information_killbox)

        this.content.close_all_inventory.addEventListener("click",this.set_all_inventory.bind(this,false))
    }
    all_inventory_enabled:boolean=false
    set_all_inventory(enabled:boolean){
        if(enabled){
            ShowElement(this.content.all_inventory)
        }else{
            HideElement(this.content.all_inventory)
        }
        this.all_inventory_enabled=enabled
    }
    mobile_init(){
        this.mobile_open()
        let rotating=false
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        this.mobile_content.left_joystick.addEventListener("joystickmove",(e:JoystickEvent)=>{
            this.game.action.movement.x=e.detail.x
            this.game.action.movement.y=e.detail.y
            if(!rotating){
                this.game.set_lookTo_angle(Math.atan2(e.detail.y,e.detail.x),true,0.3)
            }
        })
        this.mobile_content.left_joystick.addEventListener("joystickend",()=>{
            this.game.action.movement.x=0
            this.game.action.movement.y=0
        })
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        this.mobile_content.right_joystick.addEventListener("joystickmove",(e:JoystickEvent)=>{
            rotating=true
            this.game.fake_crosshair.visible=true
            const dist=Math.sqrt(e.detail.x*e.detail.x+e.detail.y*e.detail.y)
            if(dist>0.9){
                this.game.action.use_weapon=true
            }else{
                this.game.action.use_weapon=false
            }
            this.game.set_lookTo_angle(Math.atan2(e.detail.y,e.detail.x))
        })
        this.mobile_content.right_joystick.addEventListener("joystickend",()=>{
                this.game.action.use_weapon=false
            rotating=false
        })
        this.mobile_content.btn_interact.addEventListener("click",()=>{
            this.game.input_manager.emit("actiondown",{action:"interact"})
        })
        this.mobile_content.btn_inventory.addEventListener("click",()=>{
            this.set_all_inventory(!this.all_inventory_enabled)
        })
        this.mobile_content.btn_reload.addEventListener("click",()=>{
            this.game.input_manager.emit("actiondown",{action:"reload"})
        })
    }
    emote_wheel={
        positon:v2.new(0,0),
        active:false,
        current_side:-1,
        emote:[
        ] as EmoteDef[]
    }
    begin_emote_wheel(position:Vec2,emotes?:EmoteDef[]){
        ShowElement(this.content.emote_wheel.main)
        this.content.emote_wheel.main.style.left=`${position.x*100}px`
        this.content.emote_wheel.main.style.top=`${position.y*100}px`
        this.emote_wheel.positon=position
        this.emote_wheel.active=true

        this.emote_wheel_set_emotes(emotes??[
            Emotes.getFromString("emote_neutral"), //Right
            Emotes.getFromString("emote_md_logo"), //Bottom
            Emotes.getFromString("emote_sad"), //Left
            Emotes.getFromString("emote_happy"), //Top
        ])
    }
    emote_wheel_set_emotes(emote:EmoteDef[]){
        for(const ev in this.content.emote_wheel.emotes){
            this.content.emote_wheel.emotes[ev].src=this.game.resources.get_sprite(emote[ev].idString).src
        }
        this.emote_wheel.emote=emote
    }
    end_emote_wheel(){
        HideElement(this.content.emote_wheel.main)
        this.emote_wheel.active=false
        let selected_emote:EmoteDef|undefined=undefined
        if(this.emote_wheel.current_side!==-1){
            selected_emote=this.emote_wheel.emote[this.emote_wheel.current_side]
        }
        if(selected_emote){
            this.game.action.actions.push({
                type:InputActionType.emote,
                emote:selected_emote
            })
        }
    }
    mobile_close(){
        HideElement(this.mobile_content.gui)
        ShowElement(this.content.help_gui)
    }
    mobile_open(){
        ShowElement(this.mobile_content.gui)
        HideElement(this.content.help_gui)
    }
    init(game:Game){
        this.game=game
        if(isMobile||Debug.force_mobile){
            this.mobile_init()
        }
        this.game.signals.on("update",this.update.bind(this))
    }
    start(){
        if(this.game.client){
            this.game.client.on("gameover",this.show_game_over.bind(this))
        }
        this.set_all_inventory(false)
        HideElement(this.content.post_proccess.tiltshift)
        HideElement(this.content.post_proccess.recolor)
        HideElement(this.content.post_proccess.vignetting)
        if(this.game.save.get_variable("cv_graphics_post_proccess")>=GraphicsDConfig.Advanced){
            ShowElement(this.content.post_proccess.tiltshift)
        }else if(this.game.save.get_variable("cv_graphics_post_proccess")>=GraphicsDConfig.Normal){
            ShowElement(this.content.post_proccess.vignetting)
            ShowElement(this.content.post_proccess.recolor)
        }
        this.game.renderer.canvas.focus()
    }
    ammos_cache:{
        normal:Record<string,HTMLDivElement>,
        all:Record<string,HTMLDivElement>
    }={normal:{},all:{}}
    update_ammos(ammos:Record<string,number>){
        const ak=Object.keys(ammos)
        const ack=Object.keys(this.ammos_cache.normal)
        if(ack.length===ak.length&&ack.length>0){
            for(const a of ak){
                const c1=this.ammos_cache.normal[a].querySelector(".count") as HTMLSpanElement
                c1.innerText=`${ammos[a]}`
                const c2=this.ammos_cache.all[a].querySelector(".slot-count") as HTMLSpanElement
                c2.innerText=`${ammos[a]}`
            }
        }else{
            const dropA=(a:number)=>{
                return (e:MouseEvent)=>{
                    if(e.button==2){
                        this.game.action.actions.push({type:InputActionType.drop,drop:a,drop_kind:2})
                    }
                }
            }
            const dropA2=(a:number)=>{
                return ()=>{
                    this.game.action.actions.push({type:InputActionType.drop,drop:a,drop_kind:2})
                }
            }
            this.content.ammos.innerHTML=""
            this.content.ammos_all.innerHTML=""
            this.ammos_cache={all:{},normal:{}}
            for(const a of ak){
                const def=Ammos.getFromString(a)
                const htm=`<div class="ammo-slot" id="ammo-${a}">
                    <image class="icon" src="img/game/common/items/ammos/${a}.svg"></image>
                    <span class="count">${ammos[a]}</span>
                </div>`
                
                const htm2=`<div class="inventory-item-slot" id="ammo-all-${a}">
                    <img class="slot-image" src="img/game/common/items/ammos/${a}.svg"></img>
                    <span class="slot-count">${ammos[a]}</span>
                </div>`

                this.content.ammos.insertAdjacentHTML("beforeend", htm);
                this.content.ammos_all.insertAdjacentHTML("beforeend", htm2);
                this.ammos_cache.normal[a]=this.content.ammos.querySelector(`#ammo-${a}`) as HTMLDivElement
                this.ammos_cache.normal[a].addEventListener("mouseup",dropA(def.idNumber!))
                this.ammos_cache.all[a]=this.content.ammos_all.querySelector(`#ammo-all-${a}`) as HTMLDivElement
                this.ammos_cache.all[a].addEventListener("click",dropA2(def.idNumber!))
            }
        }
    }
    items_cache:Record<string,HTMLDivElement>={}
    items?:Record<string,number>
    update_gui_items(slots:InventoryItemData[]){
        this.content.gui_items.innerHTML=""
        let i=0;
        const Ic=(i:number)=>{
            return (e:MouseEvent)=>{
                if(e.button==2){
                    this.game.action.actions.push({type:InputActionType.drop,drop:i,drop_kind:3})
                }
            }
        }
        const Ic2=(i:number)=>{
            return ()=>{
                this.game.action.actions.push({type:InputActionType.use_item,slot:i})
            }
        }
        
        const Ic3=(i:number)=>{
            return ()=>{
                this.game.action.actions.push({type:InputActionType.drop,drop:i,drop_kind:4})
            }
        }
        const items:Record<string,number>={}
        for(const s of slots){
            if(s.count>0){
                const def=GameItems.valueNumber[s.idNumber]
                this.content.gui_items.insertAdjacentHTML("beforeend",`<div class="inventory-item-slot" id="inventory-slot-${i}">
                <div class="slot-number">${i+4}</div>
                <div class="slot-count">${s.count}</div>
                <img class="slot-image" src="${this.game.resources.get_sprite(def.idString).src}"></img>
                </div>`)
                const vv=this.content.gui_items.querySelector(`#inventory-slot-${i}`) as HTMLDialogElement
                vv.addEventListener("mouseup",Ic(i))
                vv.addEventListener("click",Ic2(i))
                if(items[def.idString]){
                    items[def.idString]+=s.count
                }else{
                    items[def.idString]=s.count
                }
            }else{
                this.content.gui_items.insertAdjacentHTML("beforeend",`<div class="inventory-item-slot">
                <div class="slot-number">${i+4}</div>
                </div>`)
            }
            i++
        }
        this.content.gui_items_all.innerHTML=""
        this.items_cache={}
        for(const i of Object.keys(items)){
            this.items_cache[i]=document.createElement("div")
            this.items_cache[i].classList.add("inventory-item-slot")
            this.items_cache[i].insertAdjacentHTML("beforeend",`
                <div class="slot-count">${items[i]}</div>
                <img class="slot-image" src="${this.game.resources.get_sprite(i).src}">`)
            this.items_cache[i].addEventListener("click",Ic3(GameItems.keysString[i]))
            this.content.gui_items_all.appendChild(this.items_cache[i])
        }
        this.items=items
    }
    players_name:Record<number,{name:string,badge:string,full:string}>={}
    process_joined_packet(jp:JoinedPacket){
        for(const p of jp.players){
            const badge_frame=p.badge!==undefined?Badges.getFromNumber(p.badge).idString:""
            const badge_html=badge_frame===""?"":`<img class="badge-icon" src="./img/game/common/loadout/badges/${badge_frame}.svg">`
            this.players_name[p.id]={name:p.name,badge:badge_html,full:`${badge_html}${p.name}`}
        }
        if(jp.kill_leader){
            this.assign_killleader({
                type:KillFeedMessageType.killleader_assigned,
                player:jp.kill_leader
            })
        }
        ShowElement(this.content.gameD)
        HideElement(this.content.menuD)
    }
    state:HelpGuiState={
        driving:false,
        gun:false,
        loot:false,
        interact:false,
        information_box_message:"a"
    }
    update_hint(){
        const state=this.state
        this.content.help_gui.innerHTML=``
        if(state.driving){
            this.content.help_gui.insertAdjacentHTML("beforeend",`
                <span>R - Reverse</span>
                <span>E - Leave</span>
                `)
        }
        if(state.gun){
            this.content.help_gui.insertAdjacentHTML("beforeend",`
                <span>R - Reload</span>
                `)
        }
        if(state.loot){
            this.content.help_gui.insertAdjacentHTML("beforeend",`
                <span>E - Take Loot</span>
                `)
        }
        if(state.interact){
            this.content.help_gui.insertAdjacentHTML("beforeend",`
                <span>E - Interact</span>
                `)
        }
        if(state.information_box_message!==this.content.information_interact.innerHTML){
            if(state.information_box_message===""){
                HideElement(this.content.information_interact)
            }else{
                ShowElement(this.content.information_interact)
                this.content.information_interact.innerHTML=state.information_box_message
            }
        }
    }
    clear(){
        this.content.killfeed.innerHTML=""
        this.content.killeader_span.innerText=""
        this.killleader=undefined
        this.content.killeader_span.innerText="Waiting For A Kill Leader"
        this.content.help_gui.innerText=""

        ShowElement(this.content.menuD)
        HideElement(this.content.gameD)
        HideElement(this.content.gameOver)
        ShowElement(this.content.game_gui)
    }
    assign_killleader(msg:KillFeedMessageKillleader){
        this.killleader={
            id:msg.player.id,
            kills:msg.player.kills
        }
        this.content.killeader_span.innerText=`${this.killleader.kills} - ${this.players_name[msg.player.id].name}`
    }
    add_killfeed_message(msg:KillFeedMessage){
        const elem=document.createElement("div") as HTMLDivElement
        elem.classList.add("killfeed-message")
        this.content.killfeed.appendChild(elem)
        switch(msg.type){
            case KillFeedMessageType.join:{
                const badge_frame=msg.playerBadge!==undefined?Badges.getFromNumber(msg.playerBadge).idString:""
                const badge_html=badge_frame===""?"":`<img class="badge-icon" src="./img/game/common/loadout/badges/${badge_frame}.svg">`
                this.players_name[msg.playerId]={badge:badge_html,name:msg.playerName,full:`${badge_html}${msg.playerName}`}
                elem.innerHTML=`${this.players_name[msg.playerId].full} Join`
                break
            }
            case KillFeedMessageType.kill:{
                const dsd=DamageSources.valueNumber[msg.used]
                elem.innerHTML=`${this.players_name[msg.killer.id].full} Killed ${this.players_name[msg.victimId].full} With ${dsd.idString}`
                if(msg.killer.id===this.game.activePlayer!.id){
                    this.content.information_killbox.innerText=`${msg.killer.kills} Kills`
                    ShowElement(this.content.information_killbox)
                    this.game.addTimeout(()=>{
                        HideElement(this.content.information_killbox)
                    },3)
                }
                if(this.killleader&&msg.killer.id===this.killleader.id){
                    this.killleader.kills=msg.killer.kills
                    this.content.killeader_span.innerText=`${this.killleader.kills} - ${this.players_name[msg.killer.id].name}`
                }
                break
            }
            case KillFeedMessageType.down:{
                const dsd=DamageSources.valueNumber[msg.used]
                elem.innerHTML=`${this.players_name[msg.killer.id].full} Knocked ${this.players_name[msg.victimId].full} With ${dsd.idString}`
                break
            }
            case KillFeedMessageType.killleader_assigned:{
                elem.innerHTML=`${this.players_name[msg.player.id].name} Become The Kill Leader`
                this.assign_killleader(msg)
                this.game.sounds.play(this.game.resources.get_audio("kill_leader_assigned"),{
                    volume:0.4
                },"player")
                break
            }
            case KillFeedMessageType.killleader_dead:{
                this.killleader=undefined
                elem.innerHTML=`The Killleader Are Dead`
                this.content.killeader_span.innerText="Waiting For A Kill Leader"
                this.game.sounds.play(this.game.resources.get_audio("kill_leader_dead"),{
                    volume:0.6
                },"player")
                break
            }
        }
        this.game.addTimeout(()=>{
            elem.remove()
        },4)
    }
    update_gui(priv:PrivateUpdate){
        this.set_health(priv.health,priv.max_health)
        this.set_boost(priv.boost,priv.max_boost,priv.boost_type)

        if(priv.damages){
            for(const ds of priv.damages){
                this.game.add_damageSplash(ds)
            }
        }

        if(priv.dirty.weapons){
            let name=this.content.weapon1.querySelector(".weapon-slot-name") as HTMLSpanElement
            let img=this.content.weapon1.querySelector(".weapon-slot-image") as HTMLImageElement

            let name2=this.content.e_weapon1.querySelector(".weapon-slot-name") as HTMLSpanElement
            let img2=this.content.e_weapon1.querySelector(".weapon-slot-image") as HTMLImageElement
            if(priv.weapons.melee){
                name.innerText=priv.weapons.melee.idString
                name2.innerText=priv.weapons.melee.idString
                const src=this.game.resources.get_sprite(priv.weapons.melee.idString).src
                img.src=src
                img2.src=src
                this.weapons[0]=priv.weapons.melee
                img.style.display="block"
                img2.style.display="block"
            }else{
                name.innerText=""
                name2.innerText=""
            }
            name=this.content.weapon2.querySelector(".weapon-slot-name") as HTMLSpanElement
            img=this.content.weapon2.querySelector(".weapon-slot-image") as HTMLImageElement
            name2=this.content.e_weapon2.querySelector(".weapon-slot-name") as HTMLSpanElement
            img2=this.content.e_weapon2.querySelector(".weapon-slot-image") as HTMLImageElement
            if(priv.weapons.gun1){
                name.innerText=priv.weapons.gun1.idString
                name2.innerText=priv.weapons.gun1.idString
                const src=this.game.resources.get_sprite(priv.weapons.gun1.idString).src
                img.src=src
                img2.src=src
                this.weapons[1]=priv.weapons.gun1
                img.style.display="block"
                img2.style.display="block"
            }else{
                name.innerText=""
                name2.innerText=""
                img.style.display="none"
                img2.style.display="none"
            }
            name=this.content.weapon3.querySelector(".weapon-slot-name") as HTMLSpanElement
            img=this.content.weapon3.querySelector(".weapon-slot-image") as HTMLImageElement
            name2=this.content.e_weapon3.querySelector(".weapon-slot-name") as HTMLSpanElement
            img2=this.content.e_weapon3.querySelector(".weapon-slot-image") as HTMLImageElement
            if(priv.weapons.gun2){
                name.innerText=priv.weapons.gun2.idString
                name2.innerText=priv.weapons.gun2.idString
                const src=this.game.resources.get_sprite(priv.weapons.gun2.idString).src
                img.src=src
                img2.src=src
                this.weapons[2]=priv.weapons.gun2
                img.style.display="block"
                img2.style.display="block"
            }else{
                name.innerText=""
                name2.innerText=""
                img.style.display="none"
                img2.style.display="none"
            }
        }
        if(priv.dirty.current_weapon&&priv.current_weapon){
            if(this.currentWeapon)this.currentWeapon.classList.remove("weapon-slot-selected")
            const wp=this.weapons[priv.current_weapon.slot as keyof typeof this.weapons]
            switch(priv.current_weapon.slot){
                case 1:
                    this.currentWeapon=this.content.weapon2
                    this.currentWeaponIDX=1
                    break
                case 2:
                    this.currentWeapon=this.content.weapon3
                    this.currentWeaponIDX=2
                    break
                default:
                    this.currentWeapon=this.content.weapon1
                    this.currentWeaponIDX=0
            }

            if(priv.current_weapon.slot===0){
                //
            }else if(wp&&(wp as GunDef).reload){
                this.content.hand_info_count.innerText=`${priv.current_weapon.ammo}/${(wp as GunDef).reload?.capacity}`
            }
            this.currentWeapon.classList.add("weapon-slot-selected")
        }

        if(priv.dirty.inventory&&priv.inventory){
            this.update_gui_items(priv.inventory)
        }
        if(priv.dirty.action){
            if(priv.action){
                this.action={
                    delay:priv.action.delay,
                    start:Date.now(),
                    type:priv.action.type
                }
            }else{
                this.action=undefined
            }
        }
        if(priv.dirty.ammos){
            const aa:Record<string,number>={}
            for(const a of Object.keys(priv.ammos)){
                const def=Ammos.getFromNumber(a as unknown as number)
                aa[def.idString]=priv.ammos[a as unknown as number]
            }
            this.update_ammos(aa)
        }

        if (this.emote_wheel.active) {
            const angle = Angle.rad2deg(
                v2.lookTo(this.emote_wheel.positon, this.game.input_manager.mouse.position)
            )
            const distance = v2.distance(this.emote_wheel.positon, this.game.input_manager.mouse.position)

            const chsrc = "/img/menu/gui/emote_wheel_hover_center.svg"
            const shsrc = "/img/menu/gui/emote_wheel_hover.svg"

            // Normaliza ângulo para 0–360
            let norm = (angle + 360) % 360

            if (distance > 0.24) {
                if (this.content.emote_wheel.hover.src !== shsrc) {
                    this.content.emote_wheel.hover.src = shsrc
                }

                let sideClass = "wheel-hover"

                if (norm >= 45 && norm < 135) {
                    sideClass += " wheel-hover-bottom"
                    this.emote_wheel.current_side=1
                } else if (norm >= 135 && norm < 225) {
                    sideClass += " wheel-hover-left"
                    this.emote_wheel.current_side=2
                } else if (norm >= 225 && norm < 315) {
                    sideClass += " wheel-hover-top"
                    this.emote_wheel.current_side=3
                } else {
                    sideClass += " wheel-hover-right"
                    this.emote_wheel.current_side=0
                }

                if (this.content.emote_wheel.hover.className !== sideClass) {
                    this.content.emote_wheel.hover.className = sideClass
                }
            } else {
                this.emote_wheel.current_side=-1
                if (this.content.emote_wheel.hover.src !== chsrc) {
                    this.content.emote_wheel.hover.src = chsrc
                    this.content.emote_wheel.hover.className = "wheel-hover wheel-hover-center"
                }
            }
        }


        this.content.debug_show.innerText=`FPS: ${this.game.fps}`
    }
    show_game_over(g:GameOverPacket){
        if(this.game.gameOver)return
        this.game.gameOver=true
        console.log(g)
        ShowElement(this.content.gameOver)
        HideElement(this.content.game_gui)
        if(g.Win){
            this.content.gameOver_main_message.innerHTML=`
<span id="gameover-you-win">You Win!</span>
`
        }else{
            console.log(g.Eliminator)
            if(!this.players_name[g.Eliminator])return
            this.content.gameOver_main_message.innerHTML=`
<span id="gameover-eliminated">Eliminated By</span>
<span id="gameover-eliminator">${this.players_name[g.Eliminator].full}</span>
`
            /*this.content.gameOver_status.innerText=`You Die!`
            this.content.gameOver_status.style.color=""
            if(Math.random()<=0.01){
                const ge=document.createElement("span")
                ge.id="gameover-you-dead"
                ge.innerText="You Die!"
                document.body.appendChild(ge)
                setTimeout(()=>{
                    ge.remove()
                },2900)
            }*/
        }
        /*this.content.gameOver_kills.innerText=`Kills: ${g.Kills}`
        this.content.gameOver_damaged.innerText=`Damage Dealth: ${g.DamageDealth}`
        this.content.gameOver_score.innerText=`Score: 0`*/
        this.content.gameOver_menu_btn.onclick=this.game.onstop!.bind(this.game,this.game)
    }
    update_equipaments(){
        /*const player=this.game.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.game.activePlayer}) as Player
        if(!player)return
        if(player.helmet){
            this.content.helmet_slot.src=this.game.resources.get_sprite(player.helmet.idString).path
        }else{
            this.content.helmet_slot.src="img/game/common/icons/helmet.svg"
        }
        if(player.vest){
            this.content.vest_slot.src=this.game.resources.get_sprite(player.vest.idString).path
        }else{
            this.content.vest_slot.src="img/game/common/icons/vest.svg"
        }*/
    }
    update(){
        if(this.action){
            const w=(Date.now()-this.action.start)/1000
            if(w<this.action.delay){
                ShowElement(this.content.action_info)
                this.content.action_info_delay.innerText=`${Numeric.maxDecimals(this.action.delay-w,1)}s`
            }else{
                this.action=undefined
            }
        }else{
            HideElement(this.content.action_info)
        }
        this.update_hint()
    }
    set_health(health:number,max_health:number){
        const p=health/max_health
        this.content.health_bar_interior.style.width =`${p*100}%`
        this.content.health_bar_animation.style.width=`${p*100}%`
        this.content.health_bar_amount.innerText=`${health}/${max_health}`
    }
    set_boost(boost:number,max_boost:number,_type:BoostType){
        const p=boost/max_boost
        this.content._bar_interior.style.width =`${p*100}%`
        this.content._bar_amount.innerText=`${boost}/${max_boost}`
        this.content._bar_interior.style.backgroundColor=Boosts[_type].color
    }
}