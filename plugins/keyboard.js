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

    load_shortcuts(list){
        if(!KeyboardManager.check_list_of_shortcuts(list)) return false;
        for(const shortcut of list){
             this.add_shortcut(...shortcut);
        }
        return true;
    }

    serialize_shortcuts(){
        const list = [];
        for(const [shortcut,{action,up = undefined}] of this.shortcuts){
            list.push(up === undefined ? [shortcut,action] : [shortcut,action,up])
        }
        return list;
    }

    store_shortcuts(){
        if(this.flag_ready()){
            window.hc.flags._.km_shortcuts = this.serialize_shortcuts();
        }
    }

    static check_list_of_shortcuts(list){
        if(!Array.isArray(list)) return false;
        for(const shortcut of list){
            if(!Array.isArray(shortcut)) return false;
            if(shortcut.length !== 2 && shortcut.length !== 3) return false;
            for(const entry of shortcut){
                if(typeof entry !== "string") return false;
            }
        }
        return true;
    }
    
    makeUI(){
        this.ui = {
            container: document.createElement('div'),
            main: document.createElement('table'),
            body: document.createElement('tbody'),
            shortcutinput: document.createElement('input'),            
            actioninput: document.createElement('select'),
            savebutton: document.createElement('button'),
            resetbutton: document.createElement('button'),
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
        this.ui.container.classList.add('hc-km-container');
        this.ui.main.classList.add('hc-km-main');
        this.ui.shortcutinput.classList.add('hc-km-input');
        this.ui.actioninput.classList.add('hc-km-input');
        const tasks = this.uitask; // This copy is necessary:
        this.uitask=null;          // if we set this.uitask after the loop, since the tasks are separated JS microtasks, a new task could be registered and forgotten.
        for(const task of tasks){
            task();
        }
        this.ui.resetbutton.textContent = "Reset";
        this.ui.resetbutton.title = "Reset";
        this.ui.resetbutton.addEventListener('click', _ => {
            let ok = confirm("Are you sure you want to reset your shortcuts ?\nIn case you want to back them um copy paste the Keyboard Manager Shortcuts flags in some file.");
            if(ok){
                if(this.flag_ready()) {
                    window.hc.flags._.km_shortcuts = [];
                    window.location.reload();
                }
            }
        });
        if(window.hc.flags !== undefined){
            window.hc.flags.addFlag({
                "name": "km_shortcuts",
                "caption": "Keyboard Manager Shortcuts",
                "description": "You should not edit this. You can save/share your shortcuts by copy/pasting the text into/from a file.",
                "type": "text",
                "default": [],
                "store": flagTalkers.JSON.from,
                "restore": flagTalkers.JSON.into,
                "interpret": flagTalkers.JSON.into,
                "present": flagTalkers.JSON.from,
            });
            if(!this.load_shortcuts(window.hc.flags._.km_shortcuts)){
                console.warn('Shortcuts were saved, but are invalid. Ignoring them.');
            }
        }
        else { console.error('Could not load shortcuts.')};
        this.ui.container.appendChild(this.ui.resetbutton);
        this.ui.container.appendChild(this.ui.main);
        colorBox(this.ui.container,'grey','black');
        this.hideUI();
    }

    add_shortcut(shortcut,action,up=undefined){
        this.shortcuts.set(shortcut,{
            action: action,
            ...(up && {up}),
        });
        this.taskUI(()=>{
                let the_row = undefined;
                for(const row of this.ui.body.rows){
                    if(row.dataset.shortcut === shortcut) {the_row = row; break;};
                }
                if(the_row === undefined){
                    the_row = this.ui.body.insertRow();
                    the_row.dataset.shortcut = shortcut;
                    the_row.insertCell();
                    the_row.insertCell();
                }
                the_row.cells.item(0).innerText = shortcut;
                the_row.cells.item(1).innerText = action;

            })
        this.store_shortcuts();
    }

    flag_ready(){
        return window.hc.flags !== undefined && 'km_shortcuts' in window.hc.flags._
    }

    remove_shortcut(shortcut){
        const already_present = this.shortcuts.delete(shortcut);
        if(!already_present) console.error('Cannot delete non-existent shortcut.');
        this.taskUI(()=>{
            let the_row = undefined;
            for(const row of this.ui.body.rows){
                if(row.dataset.shortcut === shortcut) {the_row = row; break;};
            }
            if(the_row === undefined && already_present){ console.error("Expected the row to be present.")};
            the_row.remove();
        });
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
        this.ui.container.style.display='table';
    }

    
    hideUI(){
        this.__visible=false;
        this.ui.container.style.display='none';
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
    ["none", ()=>{}],
    ["move_up",()=>{sendDir(Direction.UP)}],
    ["move_down", ()=>{sendDir(Direction.DOWN)}],
    ["move_right", ()=>{sendDir(Direction.RIGHT)}],
    ["move_left", ()=>{sendDir(Direction.LEFT)}],
    ["move_pause", ()=>{sendDir(Direction.PAUSE)}],
    ["start_honk", ()=>{honkStart()}],
    ["end_honk", ()=>{honkEnd()}],
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
    ["Space","start_honk","end_honk"],
];
for(const a of core_shortcuts){
    window.hc.km.add_shortcut(...a);
}

document.addEventListener('DOMContentLoaded', ()=>{
    const style = document.createElement('style');
    style.textContent=`
    .hc-km-container {
        position: fixed;
        top:25%;
        left: 25%;
        width:50%;
        padding: 0;
    }
    .hc-km-main {
        width: calc(100% - 2em);
        padding: 1em;
    }
    .hc-km-main {
        width: calc(100% - 2em);
        padding: 1em;
    }
    .hc-km-input {
        width: 100%;
        box-sizing: border-box;
    }
    `;
    document.head.append(style);
    window.hc.km.makeUI();
    document.body.append(window.hc.km.ui.container);
    document.body.addEventListener('keydown',window.hc.km.listen);
    document.body.addEventListener('keyup',window.hc.km.listenup);
})