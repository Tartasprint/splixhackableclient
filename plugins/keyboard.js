class KeyboardManager {
    constructor(){
        this.shortcuts = new Map();
        this.actions = new Map();
        this.listen=this.listen.bind(this);
        this.listenup=this.listenup.bind(this);
        this.uitask=[];
        this.active=true;
        this.__visible=false;
    }
    
    makeUI(){
        this.ui = {
            main: document.createElement('table'),
            body: document.createElement('tbody'),
            shortcutinput: document.createElement('input'),            
            actioninput: document.createElement('select'),            
        }
        const header = this.ui.main.appendChild(document.createElement('thead')).insertRow();
        header.insertCell().innerText = "Shortcut";
        header.insertCell().innerText = "Action";
        this.ui.main.appendChild(this.ui.body);
        const footer = this.ui.main.appendChild(document.createElement('tfoot'));
        const input_cell = footer.insertRow().insertCell();
        input_cell.colSpan = 2;
        const input_form = input_cell.appendChild(document.createElement('form'));
        input_cell.appendChild(input_form);
        input_form.appendChild(this.ui.shortcutinput);
        input_form.appendChild(this.ui.actioninput);
        this.ui.shortcutinput.addEventListener('keydown',e => {
            const shortcut = Shortcut.from_event(e);
            e.preventDefault();
            this.ui.shortcutinput.value=shortcut.serialize();
        });
        const submit = document.createElement('input');
        submit.type = "submit";
        submit.value = "Add";
        submit.addEventListener('click',(e) => {
            e.preventDefault();
            this.add_shortcut(this.ui.shortcutinput.value,this.ui.actioninput.value);
    
        })
        input_form.appendChild(submit);
        this.ui.main.classList.add('hc-km-main');
        this.ui.shortcutinput.classList.add('hc-km-input');
        this.ui.actioninput.classList.add('hc-km-input');
        for(const task of this.uitask){
            task();
        }
        this.uitask=null;
        colorBox(this.ui.main,'grey','black');
        this.hideUI();
    }

    add_shortcut(shortcut,action,up=undefined){
        this.shortcuts.set(shortcut,{
            action: action,
            ...(up && {up}),
        });
        this.taskUI(()=>{
            const row = this.ui.body.insertRow()
            row.insertCell().innerText = shortcut;
            row.insertCell().innerText = action;
        })
    }

    add_action(name,func){
        this.actions.set(name,func);
        this.taskUI(()=>{
            const o = document.createElement('option');
            o.text=name;
            o.value=name;
            this.ui.actioninput.add(o);
        })
    }

    taskUI(f){
        if(this.uitask!==null){
            this.uitask.push(f);
        } else {
            f();
        }
    }

    /**
     * 
     * @param {KeyboardEvent} e
     */
    listen(e) {
        if(!this.active) return;
        let action = this.shortcuts.get(Shortcut.from_event(e).serialize());
        if(action === undefined) return;
        action = this.actions.get(action.action);
        if(action === undefined) return;
        action();
    }

    /**
     * 
     * @param {KeyboardEvent} e
     */
    listenup(e) {
        if(!this.active) return;
        let action = this.shortcuts.get(Shortcut.from_event(e).serialize());
        if(action === undefined) return;
        if(action.up === undefined) return;
        console.log('Up we go:', action.up);
        action = this.actions.get(action.up);
        if(action === undefined) return;
        action();
    }

    enable(){
        this.active = true;
    }

    disable(){
        this.active = false;
    }

    showUI(){
        this.__visible=true;
        this.ui.main.style.display='table';
    }

    
    hideUI(){
        this.__visible=false;
        this.ui.main.style.display='none';
    }

    toggleUI(){
        if(this.__visible) this.hideUI();
        else this.showUI();
    }
}

class Shortcut {
    constructor(code,alt,ctrl,shift,meta){
        this.code = code;
        this.alt = alt;
        this.ctrl = ctrl;
        this.shift = shift;
        this.meta = meta;
    }

    /**
     * 
     * @param {string} s 
     */
    static deserialize(s){
        const list = s.split('+');
        const code = list.pop();
        const alt = list.includes('Alt');
        const ctrl = list.includes('Ctrl');
        const shift = list.includes('Shift');
        const meta = list.includes('Meta');
        return new Shortcut(code,alt,ctrl,shift,meta);
    }

    /**
     * @param {KeyboardEvent} e
     */
    static from_event(e){
        return new Shortcut(e.code, e.altKey, e.ctrlKey, e.shiftKey, e.metaKey);
    }

    serialize(){
        let s="";
        if(this.alt) s+='Alt+';
        if(this.ctrl) s+='Ctrl+';
        if(this.shift) s+='Shift+';
        if(this.meta) s+='Meta+';
        s+=this.code;
        return s;
    }
}

window.hc = {};
window.hc.km = new KeyboardManager();

window.hc.km.add_action("shortcuts_toggle",()=>{window.hc.km.toggleUI()});
window.hc.km.add_shortcut("F1","shortcuts_toggle");

let core_actions = [
    ["move_up",()=>{sendDir(Direction.UP)}],
    ["move_down", ()=>{sendDir(Direction.DOWN)}],
    ["move_right", ()=>{sendDir(Direction.RIGHT)}],
    ["move_left", ()=>{sendDir(Direction.LEFT)}],
    ["move_pause", ()=>{sendDir(Direction.PAUSE)}],
    ["core_move_active_up",()=>{activateDir(Direction.UP)}],
    ["core_move_active_down", ()=>{activateDir(Direction.DOWN)}],
    ["core_move_active_right", ()=>{activateDir(Direction.RIGHT)}],
    ["core_move_active_left", ()=>{activateDir(Direction.LEFT)}],
    ["core_move_active_pause", ()=>{activateDir(Direction.PAUSE)}],
    ["core_move_deactive_up",()=>{deactivateDir(Direction.UP)}],
    ["core_move_deactive_down", ()=>{deactivateDir(Direction.DOWN)}],
    ["core_move_deactive_right", ()=>{deactivateDir(Direction.RIGHT)}],
    ["core_move_deactive_left", ()=>{deactivateDir(Direction.LEFT)}],
    ["core_move_deactive_pause", ()=>{deactivateDir(Direction.PAUSE)}],
];



for(const a of core_actions){
    window.hc.km.add_action(...a);
}
let core_shortcuts = [
    ["ArrowUp","core_move_active_up","core_move_deactive_up"],
    ["ArrowDown","core_move_active_down","core_move_deactive_down"],
    ["ArrowRight","core_move_active_right","core_move_deactive_right"],
    ["ArrowLeft","core_move_active_left","core_move_deactive_left"],
    ["KeyP","core_move_active_pause","core_move_deactive_pause"],
];
for(const a of core_shortcuts){
    window.hc.km.add_shortcut(...a);
}

document.addEventListener('DOMContentLoaded', ()=>{
    const style = document.createElement('style');
    style.textContent=`
    .hc-km-main {
        position: fixed;
        top:25%;
        left: 25%;
        width:50%;
    }
    .hc-km-input {
        width: 100%;
    }
    `;
    document.head.append(style);
    window.hc.km.makeUI();
    document.body.append(window.hc.km.ui.main);
    document.body.addEventListener('keydown',window.hc.km.listen);
    document.body.addEventListener('keyup',window.hc.km.listenup);
})