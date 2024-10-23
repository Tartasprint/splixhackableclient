class Flag  extends EventTarget {
    constructor(container,id,input,init,label,context, options){
        super();
        this.id=id;
        this.input=document.createElement('input');
        this.input.type=input;
        this.input.name='hcFlag'+id;
        this.input.dataset.id=id;
        this.defaultValue = init;
        this.__visible = false;
        this.store=options.store || (x=>({"v":x, ok: true}));
        this.restore=options.restore;
        if(this.restore === undefined){
            if(input === "number"){
                this.restore = v => {
                    let x = Number.parseInt(v);
                    return Number.isNaN(x) ? {"v": undefined, "ok": false}:{"v":x, "ok":true};
                }
            } else if(input === "checkbox"){
                this.restore = v => ({"ok":true, "v": v==="true"});
            }
        }
        this.interpret=options.interpret || (x=>({"v":x, ok: true}));
        this.present=options.present || (x=>({"v":x, ok: true}));
        this.value=this.getLocalStorage();
        this.input.addEventListener('change', ()=>{
            this.value=this.getUI();
        })
        this.label=document.createElement('label');
        this.label.htmlFor=this.input.name;
        this.label.textContent=label;
        container.append(this.label,this.input);
        if(context !== undefined){
            this.context = document.createElement('p');
            this.context.innerHTML = context;
            container.append(this.context);
        } else {
            this.context = null;
        }
        if(input === 'checkbox'){
            window.hc.km.add_action('flags_toggleFlag_'+id,()=>{
                this.value=!this.value;
            });
        } else if(input === 'number'){
            if(options.min !== undefined) this.input.min = options.min;
            if(options.max !== undefined) this.input.max = options.max;
        }
    }

    setLocalStorage(val){
        let {v,ok} = this.store(val);
        localStorage.setItem(this.id,ok?v:this.store(this.defaultValue).v);
    }

    setUI(val){
        let {v,ok} = this.present(val);
        v=ok?v:this.present(this.defaultValue).v;
        if(this.input.type === 'checkbox'){
            this.input.checked = v;
        } else {
            this.input.value = v;
        }
    }

    getLocalStorage(){
        let s = localStorage.getItem(this.id);
        let value;
        if(s === null) {
            value = this.defaultValue;
            this.value = this.defaultValue;
        } else {
            let {v, ok} =this.restore(s);
            value = ok ? v : (this.value = this.defaultValue);
        }
        return value;
    }

    getUI(){
        let v;
        if(this.input.type === 'checkbox'){
            v = this.input.checked;
        } else if(this.input.type === 'number') {
            v = !Number.isNaN(this.input.valueAsNumber) ? this.input.valueAsNumber : (this.value=this.defaultValue);
        } else {
            v = this.input.value;
        }
        v=this.interpret(v);
        return v.ok ? v.v:(this.value=this.defaultValue);
    }

    set value(v){
        this.setLocalStorage(v);
        this.setUI(v);
        this.dispatchEvent(new CustomEvent('change', {detail: v}));
    }

    get value(){
        return this.getLocalStorage();
    }
}

const flagTalkers = {
    JSON: {
        from: x => {
            let ok = true;
            let v = undefined;
            try {
                v = JSON.stringify(x);
            } catch (e) {
                ok = false;
            }
            return {v, ok};
        },
        into: x => {
            let ok = true;
            let v = undefined;
            try {
                v = JSON.parse(x);
            } catch (e) {
                ok = false;
            }
            return {v, ok};
        }
    }
}

class FlagEditor {
    constructor(){
        this.flags= new Map();
        this.ui = {
            container: document.createElement('dialog'),
            list: document.createElement('ul'),
        }
        this.ui.container.append(this.ui.list);
        this.ui.container.classList.add('hc-flags-container');
        this.ui.container.addEventListener('close', ()=>{
            hc.km.enable();
            this.__visible=false;
        });
        this.ui.list.classList.add('hc-flags-list');
        this.hideUI();
        let that=this;
        this._ = new Proxy({}, {
            get(target,name){
                if(!that.flags.has(name)){throw new Error(`The flag ${name} does not exist.`);}
                let f= that.flags.get(name);
                let v =f.value;
                return v;
            },
            set(target,name,value){
                that.flags.get(name).value=value;
                return(true);
            },
            has(target,name){
                return that.flags.has(name);
            }
        });
    }

    addFlag({
        "name": id,
        "caption": label,
        "description": context,
        "type": input,
        "default": init,
        ...options
    } = params){
        const li = document.createElement('li');
        li.classList.add('hc-flags-flag');
        this.flags.set(id,new Flag(li,id,input,init,label,context,options));
        this.ui.list.append(li);
    }

    toggleUI(){
        if(this.__visible) this.hideUI()
        else this.showUI();
    }
    
    showUI(){
        this.__visible = true;
        this.ui.container.showModal();
        hc.km.disable();
    }

    hideUI(){
        this.__visible = false;
        this.ui.container.close();
    }

    on_change(flag_name, callback){
        this.flags.get(flag_name).addEventListener('change', ({detail: value}) => callback(value))
    }

    toggle(flag_name){
        const flag = this.flags.get(flag_name);
        if(flag.input.type == "checkbox"){
            flag.value = !flag.value;
        }
    }
}


window.hc.flags = new FlagEditor();

document.addEventListener('DOMContentLoaded',()=>{
    const flags = [
        {
            "name": "drawDebug",
            "caption": "Display ping",
            "description": "Displays a tiny red number in the bottom right corner while playing.<br>This is your ping (amount of ms delay with the server)<br>Anything below 100 should be good",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "dontCapFps",
            "caption": "Dont cap fps",
            "description": "To keep the frame rate stable, it is automatically locked to 144, 60, 30, 20 or 10fps, depending on how fast your computer is. If you check this box it doesn't lock the framerate.<br>This causes a higher framerate but it feels more like the game is stuttering.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "drawActualPlayerPos",
            "caption": "Show actual player pos",
            "description": "To make the game feel less laggy, the place where your player is drawn is not its actual position. If you check this checkbox the game will draw a second dot on the position where the server thinks you actually are.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "drawWhiteDot",
            "caption": "Draw a white dot on my player",
            "description": "Useful for tracking the player position when making youtube videos.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "dontSlowPlayersDown",
            "caption": "Don't slow down the player with high ping",
            "description": "When you're running too far ahead according to the server, it starts slowing you down to make up for it. This makes sure that your land gets filled once you reach it, instead of a couple of blocks later. The downside is that your player is slower compared to the other players. To prevent this, check this box. But be warned: Your blocks will be filled with a short delay and players are able to kill you in that short time.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "hidePlayerNames",
            "caption": "Hide player names",
            "description": "Hides the name above players.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "uglyMode",
            "caption": "Ugly mode",
            "description": "In case your fps is too low. Warning! Makes the game ugly. (This is subjective).",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "leaderboardHidden",
            "caption": "Hide the leaderboard",
            "description": "Hides the leaderboard when playing.",
            "type": "checkbox",
            "default": "false"
        },
        {
            "name": "simulatedLatency",
            "caption": "Simulate latency",
            "description": "This increases the lag, there's absolutely no reason why you would want to enable this unless you're debugging stuff. This is also makes things very unstable so you might want to avoid using it.<br>Set this to 0 to disable it.",
            "type": "number",
            "default": "0"
        },
        {
            "name": "bannerAdsUseCurse",
            "caption": "Ads",
            "description": "Check if you do not want to use ads.",
            "type": "checkbox",
            "default": "true"
        },
    ]
    for(const flag of flags){
        window.hc.flags.addFlag(flag);
    };
    document.body.append(window.hc.flags.ui.container);
    colorBox(window.hc.flags.ui.container,'grey','black');
    addStyle(`
        .hc-flags-container {
            width:50%;
            height: 75%;
            overflow: auto;
        }
        
        .hc-flags-container label {
            padding-right: 1rem;    
        }
    `)
    window.hc.km.add_action('flags_visibility_toggle', ()=>{window.hc.flags.toggleUI()});
    window.hc.km.add_shortcut('F2','flags_visibility_toggle');
    window.hc.km.add_shortcut('KeyO','flags_toggleFlag_leaderboardHidden');
    window.hc.flags.on_change("uglyMode", value => {
        window.uglyMode=value;
        window.uglyText.innerHTML = "Ugly mode: " + (value ? "on" : "off");
    });
    window.hc.flags.on_change("leaderboardHidden", value => {
        leaderboardHidden=value;
        setLeaderboardVisibility();
    });
})
