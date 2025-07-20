import { Game } from "./game.ts";
import { BoostType } from "common/scripts/definitions/utils.ts";
import { ActionsType, CATEGORYS, GameOverPacket } from "common/scripts/others/constants.ts";
import { DefaultEvents, Numeric, v2 } from "common/scripts/engine/mod.ts";
import { Player } from "../gameObjects/player.ts";
import { DamageSources, GameItems } from "common/scripts/definitions/alldefs.ts";
import { CellphoneActionType } from "common/scripts/packets/action_packet.ts";
import { MeleeDef } from "../../../../common/scripts/definitions/items/melees.ts";
import { GunDef } from "../../../../common/scripts/definitions/items/guns.ts";
import { GuiUpdate } from "common/scripts/packets/update_packet.ts";
import { Ammos } from "common/scripts/definitions/items/ammo.ts";
import { KillFeedMessage, KillFeedMessageType } from "common/scripts/packets/killfeed_packet.ts";
import { JoinedPacket } from "common/scripts/packets/joined_packet.ts";

export class GuiManager{
    game:Game
    content={
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

        cellphone_actions:document.querySelector("#cellphone-actions") as HTMLDivElement,
        cellphone_input_item_id:document.querySelector("#cellphone-insert-item-id") as HTMLInputElement,
        cellphone_input_item_count:document.querySelector("#cellphone-insert-item-count") as HTMLInputElement,
        cellphone_give_item:document.querySelector("#cellphone-give-item-button") as HTMLButtonElement,

        gameOver:document.querySelector("#gameover-container") as HTMLDivElement,
        
        gameOver_status:document.querySelector("#gameover-status") as HTMLDivElement,
        gameOver_kills:document.querySelector("#gameover-kills") as HTMLDivElement,
        gameOver_damaged:document.querySelector("#gameover-damaged") as HTMLDivElement,
        gameOver_score:document.querySelector("#gameover-score") as HTMLDivElement,
        gameOver_menu_btn:document.querySelector("#gameover-menu-btn") as HTMLButtonElement,

        weapon1:document.querySelector("#game-weapon-slot-00") as HTMLDivElement,
        weapon2:document.querySelector("#game-weapon-slot-01") as HTMLDivElement,
        weapon3:document.querySelector("#game-weapon-slot-02") as HTMLDivElement,

        ammos:document.querySelector("#ammos-inventory") as HTMLDivElement,

        killfeed:document.querySelector("#killfeed-container") as HTMLDivElement,
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
    //inventory:{count:number,def:Definition,type:InventoryItemType}[]=[]
    action?:{delay:number,start:number,type:ActionsType}

    currentWeapon?:HTMLDivElement
    constructor(game:Game){
        this.game=game
        this.game.client.on("gameover",this.show_game_over.bind(this))
        this.game.events.on(DefaultEvents.GameTick,this.update.bind(this))
        this.set_health(100,100)

        this.content.gameOver.style.opacity="0%"

        //Cellphone
        this.content.cellphone_actions.style.display="none"

        const deenable_act=()=>{
            this.game.can_act=false
        }
        const enable_act=()=>{
            this.game.can_act=true
        }

        this.content.cellphone_input_item_id.onfocus=deenable_act
        this.content.cellphone_input_item_id.onblur=enable_act

        this.content.cellphone_input_item_count.onfocus=deenable_act
        this.content.cellphone_input_item_count.onblur=enable_act

        this.content.cellphone_give_item.onclick=(_)=>{
            this.game.action.cellphoneAction={
                type:CellphoneActionType.GiveItem,
                item_id:GameItems.keysString[this.content.cellphone_input_item_id.value],
                count:parseInt(this.content.cellphone_input_item_count.value),
            }
        }

        this.update_ammos({})
    }
    ammos_cache:Record<string,HTMLDivElement>={}
    update_ammos(ammos:Record<string,number>){
        const ak=Object.keys(ammos)
        const ack=Object.keys(this.ammos_cache)
        if(ack.length===ak.length){
            for(const a of ak){
                const c=this.ammos_cache[a].querySelector(".count") as HTMLSpanElement
                c.innerText=`${ammos[a]}`
            }
        }else{
            this.content.ammos.innerHTML=""
            this.ammos_cache={}
            for(const a of ak){
                const htm=`<div class="ammo-slot" id="ammo-${a}">
                    <image class="icon" src="img/game/common/items/ammos/${a}.svg"></image>
                    <span class="count">${ammos[a]}</span>
                </div>`

                this.content.ammos.insertAdjacentHTML("beforeend", htm);
                this.ammos_cache[a]=this.content.ammos.querySelector(`#ammo-${a}`) as HTMLDivElement
            }
        }
    }
    players_name:Record<number,{name:string,badge:string}>={}
    process_joined_packet(jp:JoinedPacket){
        for(const p of jp.players){
            this.players_name[p.id]={name:p.name,badge:""}
        }
    }
    clear_killfeed(){
        this.content.killfeed.innerHTML=""
    }
    add_killfeed_message(msg:KillFeedMessage){
        const elem=document.createElement("div") as HTMLDivElement
        elem.classList.add("killfeed-message")
        this.content.killfeed.appendChild(elem)
        switch(msg.type){
            case KillFeedMessageType.join:{
                this.players_name[msg.playerId]={badge:"",name:msg.playerName}
                elem.innerHTML=`${this.players_name[msg.playerId].name} Join`
                break
            }
            case KillFeedMessageType.kill:{
                const dsd=DamageSources.valueNumber[msg.used]
                elem.innerHTML=`${this.players_name[msg.killerId].name} Killed ${this.players_name[msg.victimId].name} With ${dsd.idString}`
                break
            }
            case KillFeedMessageType.down:{
                const dsd=DamageSources.valueNumber[msg.used]
                elem.innerHTML=`${this.players_name[msg.killerId].name} Knocked ${this.players_name[msg.victimId].name} With ${dsd.idString}`
                break
            }
        }
        this.game.addTimeout(()=>{
            elem.remove()
        },4)
    }
    update_gui(gui:GuiUpdate){
        this.set_health(gui.health,gui.max_health)
        this.set_boost(gui.boost,gui.max_boost,gui.boost_type)

        if(gui.damages){
            this.game.add_damageSplash(gui.damages.position,gui.damages.count,gui.damages.critical,gui.damages.shield)
        }

        if(gui.dirty.weapons){
            let name=this.content.weapon1.querySelector(".weapon-slot-name") as HTMLSpanElement
            let img=this.content.weapon1.querySelector(".weapon-slot-image") as HTMLImageElement
            if(gui.weapons.melee){
                name.innerText=gui.weapons.melee.idString
                img.src=this.game.resources.get_sprite(gui.weapons.melee.idString).path
                this.weapons[0]=gui.weapons.melee
                img.style.display="block"
            }else{
                name.innerText=""
            }
            name=this.content.weapon2.querySelector(".weapon-slot-name") as HTMLSpanElement
            img=this.content.weapon2.querySelector(".weapon-slot-image") as HTMLImageElement
            if(gui.weapons.gun1){
                name.innerText=gui.weapons.gun1.idString
                img.src=this.game.resources.get_sprite(gui.weapons.gun1.idString).path
                this.weapons[1]=gui.weapons.gun1
                img.style.display="block"
            }else{
                name.innerText=""
                img.style.display="none"
            
            }
            name=this.content.weapon3.querySelector(".weapon-slot-name") as HTMLSpanElement
            img=this.content.weapon3.querySelector(".weapon-slot-image") as HTMLImageElement
            if(gui.weapons.gun2){
                name.innerText=gui.weapons.gun2.idString
                img.src=this.game.resources.get_sprite(gui.weapons.gun2.idString).path
                this.weapons[2]=gui.weapons.gun2
                img.style.display="block"
            }else{
                name.innerText=""
                img.style.display="none"
            }
        }
        if(gui.dirty.current_weapon&&gui.current_weapon){
            if(this.currentWeapon)this.currentWeapon.classList.remove("weapon-slot-selected")
            const wp=this.weapons[gui.current_weapon.slot as keyof typeof this.weapons]
            switch(gui.current_weapon.slot){
                case 1:
                    this.currentWeapon=this.content.weapon2
                    break
                case 2:
                    this.currentWeapon=this.content.weapon3
                    break
                default:
                    this.currentWeapon=this.content.weapon1
            }

            if(gui.current_weapon.slot===0){
                //
            }else{
                this.content.hand_info_count.innerText=`${gui.current_weapon.ammo}/${(wp as GunDef).reload?.capacity}`
            }
            this.currentWeapon.classList.add("weapon-slot-selected")
        }

        /*if(p.inventory){
            this.inventory.length=0
            for(const s of p.inventory){
                this.inventory.push({count:s.count,def:GameItems.valueNumber[s.idNumber],type:s.type})
            }
            this.inventory_cache=this.inventory_reset()
        }*/
        if(gui.dirty.action){
            if(gui.action){
                this.action={
                    delay:gui.action.delay,
                    start:Date.now(),
                    type:gui.action.type
                }
            }else{
                this.action=undefined
            }
        }
        if(gui.dirty.ammos){
            const aa:Record<string,number>={}
            for(const a of Object.keys(gui.ammos)){
                const def=Ammos.getFromNumber(a as unknown as number)
                aa[def.idString]=gui.ammos[a as unknown as number]
            }
            this.update_ammos(aa)
        }
    }
    show_game_over(g:GameOverPacket){
        if(this.game.gameOver)return
        this.game.gameOver=true
        this.content.gameOver.style.opacity="100%"
        if(g.Win){
            this.content.gameOver_status.innerText=`Winner Winner Chicken Dinner!`
            this.content.gameOver_status.style.color="#fe3"
        }else{
            this.content.gameOver_status.innerText=`You Die!`
            this.content.gameOver_status.style.color="#e05"
            if(Math.random()<=0.01){
                const ge=document.createElement("span")
                ge.id="gameover-you-dead"
                ge.innerText="You Die!"
                document.body.appendChild(ge)
                setTimeout(()=>{
                    ge.remove()
                },2900)
            }
        }
        this.content.gameOver_kills.innerText=`Kills: ${g.Kills}`
        this.content.gameOver_damaged.innerText=`Damage Dealth: ${g.DamageDealth}`
        this.content.gameOver_score.innerText=`Score: 0`
        this.content.gameOver_menu_btn.onclick=this.game.onstop!.bind(this.game,this.game)
    }
    update_equipaments(){
        const player=this.game.scene.objects.get_object({category:CATEGORYS.PLAYERS,id:this.game.activePlayer}) as Player
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
        }
    }
    /*inventory_cache:HTMLDivElement[]=[]
    inventory_reset():HTMLDivElement[]{
        const cache:HTMLDivElement[]=[]
        this.content.inventory.innerHTML=""
        let i=0
        const sMM=(slot:HTMLDivElement,i:number)=>{
            slot.addEventListener("mousedown",(e)=>{
                if(e.button!==0)return
                this.game.action.hand=i
                this.game.action.UsingItem=false
            })
        }
        for(const s of this.inventory){
            const slot = document.createElement("div")
            slot.classList.add("inventory-slot")

            if(this.hand&&this.hand.location===i){
                slot.classList.add("inventory-slot-selected")
            }

            const img = document.createElement("img")
            switch(s.type){
                case InventoryItemType.gun:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width = "40px"
                    img.style.height = "40px"
                    break
                case InventoryItemType.melee:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width = "40px"
                    img.style.height = "40px"
                    break
                case InventoryItemType.ammo:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width="25px"
                    img.style.height="25px"
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
                case InventoryItemType.healing:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width="25px"
                    img.style.height="25px"
                    img.style.transform="unset"
                    if(s.count>0){
                        const another=document.createElement("span")
                        another.innerText=`${s.count}`
                        slot.appendChild(another)
                    }
                    break
                case InventoryItemType.other:
                    img.src=this.game.resources.get_sprite(s.def.idString).path
                    img.style.width = "40px"
                    img.style.height = "40px"
                    break
            }
            slot.appendChild(img)
            this.content.inventory.appendChild(slot)
            cache.push(slot)
            sMM(slot,i)
            i++

        }
        return cache
    }*/
    update(){
        if(this.action){
            const w=(Date.now()-this.action.start)/1000
            
            if(w<this.action.delay){
                this.content.action_info.style.opacity="100%"
                this.content.action_info_delay.innerText=`${Numeric.maxDecimals(this.action.delay-w,1)}s`
            }
        }else{
            this.content.action_info.style.opacity="0%"
        }
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
        this.content._bar_interior.style.backgroundColor=BoostsColors[_type]
    }
}
const BoostsColors:Record<BoostType,string>={
    [BoostType.Adrenaline]:"#ff0",
    [BoostType.Shield]:"#08f",
    [BoostType.Mana]:"#92a",
    [BoostType.Addiction]:"#e13"
}