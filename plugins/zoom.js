function isInGame() {
    return beginScreen.getAttribute("style")?.includes("display: none");
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
    window.hc.km.add_action('zoom_in', zoom_in);
    window.hc.km.add_action('zoom_out', zoom_out);
    window.hc.km.add_action('zoom_initial', zoom_initial);

    window.hc.km.add_shortcut('KeyQ','zoom_in');
    window.hc.km.add_shortcut('KeyW','zoom_initial');
    window.hc.km.add_shortcut('KeyE','zoom_out');
}