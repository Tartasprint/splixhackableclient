function isInGame() {
    return beginScreen.getAttribute("style")?.includes("display: none") && hc.km.active;
}

document.addEventListener("wheel", (e)=>{
    if (!isInGame()) return;
    let isUp = e.deltaY > 1;
    if (isUp) {
     zoom_out();
    } else {
        zoom_in();
    }
})

function zoom_out(){
    if (window.BLOCKS_ON_SCREEN < 100000000000 ||true) window.BLOCKS_ON_SCREEN = (Math.sqrt(window.BLOCKS_ON_SCREEN)+5)**2;
}

function zoom_initial(){
    window.BLOCKS_ON_SCREEN = 1100;
}

function zoom_in(){
    if (window.BLOCKS_ON_SCREEN > 20) window.BLOCKS_ON_SCREEN = (Math.sqrt(window.BLOCKS_ON_SCREEN)-5)**2;
}

if(window.hc.km!==undefined){
    window.hc.km.add_action({
        name: 'zoom_in',
        short: "Zoom in",
        down: zoom_in,
    });
    window.hc.km.add_action({
        name: 'zoom_out',
        short: "Zoom out",
        down: zoom_out,
    });
    window.hc.km.add_action({
        name: 'zoom_initial',
        short: "Zoom initial",
        down: zoom_initial,
    });
    window.hc.km.add_default_shortcut('KeyQ','zoom_in','playing');
    window.hc.km.add_default_shortcut('KeyW','zoom_initial','playing');
    window.hc.km.add_default_shortcut('KeyE','zoom_out','playing');
}