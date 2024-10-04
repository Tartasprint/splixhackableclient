class Flag {
    constructor(container,id,input,init,label,context){
        this.id=id;
        this.input=document.createElement('input');
        this.input.type=input;
        this.input.name='hcFlag'+id;
        this.input.dataset.id=id;
        this.value = this.value || init;
        this.__visible = false;
        this.input.addEventListener('change', ()=>{
            this.value= input === 'checkbox' ? this.input.checked : this.input.value;
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
                this.value=this.value==="false";
            });
        }
    }

    set value(v){
        localStorage.setItem(this.id,v);
        if(this.input.type === 'checkbox'){
            this.input.checked = v;
        } else {
            this.input.value = v;
        }
    }

    get value(){
        return localStorage.getItem(this.id)
    }
}

class FlagEditor {
    constructor(){
        this.flags=[];
        this.ui = {
            container: document.createElement('ul'),
        }
        this.ui.container.classList.add('hc-flags-container');
        this.hideUI();
    }

    addFlag(id,input,init,label,context){
        const li = document.createElement('li');
        li.classList.add('hc-flags-flag');
        this.flags.push(new Flag(li,id,input,init,label,context));
        this.ui.container.append(li);
    }

    toggleUI(){
        if(this.__visible) this.hideUI()
        else this.showUI();
    }
    
    showUI(){
        this.__visible = true;
        this.ui.container.style.display='block';
    }

    hideUI(){
        this.__visible = false;
        this.ui.container.style.display='none';
    }
}


window.hc.flags = new FlagEditor();

document.addEventListener('DOMContentLoaded',()=>{
    const flags = [
        [
            "drawDebug","checkbox","false","Display ping",
            "Displays a tiny red number in the bottom right corner while playing.<br>This is your ping (amount of ms delay with the server)<br>Anything below 100 should be good"
        ],
        [
            "dontCapFps","checkbox","false","Dont cap fps",
            "To keep the frame rate stable, it is automatically locked to 144, 60, 30, 20 or 10fps, depending on how fast your computer is. If you check this box it doesn't lock the framerate.<br>This causes a higher framerate but it feels more like the game is stuttering."
        ],
        [
            "drawActualPlayerPos","checkbox","false","Show actual player pos",
            "To make the game feel less laggy, the place where your player is drawn is not its actual position. If you check this checkbox the game will draw a second dot on the position where the server thinks you actually are.",
        ],
        [
            "drawWhiteDot", "checkbox","false", "Draw a white dot on my player",
            "Useful for tracking the player position when making youtube videos."
        ],
        [
            "dontSlowPlayersDown", "checkbox","false", "Don't slow down the player with high ping",
            "When you're running too far ahead according to the server, it starts slowing you down to make up for it. This makes sure that your land gets filled once you reach it, instead of a couple of blocks later. The downside is that your player is slower compared to the other players. To prevent this, check this box. But be warned: Your blocks will be filled with a short delay and players are able to kill you in that short time."
        ],
        [
            "hidePlayerNames", "checkbox","false", "Hide player names",
            "Hides the name above players."
        ],
        [
            "uglyMode", "checkbox","false", "Ugly mode",
            "In case your fps is too low. Warning! Makes the game ugly. (This is subjective).",
        ],
        [
            "simulatedLatency", "number","0", "Simulate latency",
            "This increases the lag, there's absolutely no reason why you would want to enable this unless you're debugging stuff. This is also makes things very unstable so you might want to avoid using it.<br>Set this to 0 to disable it."
        ],
        [
            "bannerAdsUseCurse", "checkbox","true","Ads",
            "Check if you do not want to use ads."
        ],
    ]
    for(const flag of flags){
        window.hc.flags.addFlag(...flag);
    };
    document.body.append(window.hc.flags.ui.container);
    colorBox(window.hc.flags.ui.container,'grey','black');
    addStyle(`
        .hc-flags-container {
            position: fixed;
            top:12.5%;
            left: 25%;
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
})
