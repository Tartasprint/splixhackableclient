const Direction = {
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3,
    PAUSE: 4,
}


/**
 * 
 * @param {string} s string
 * @param {RegExp} r regex
 * @param {number} i start
 */
function matchat(s,r,i){
    r.lastIndex = i;
    return r.exec(s);
}

/**
 * 
 * @param {string} path 
 */
function* read_instructions(path,safe=true){
    for(let i = 0; i < path.length; i++){
        switch(path[i]){
            case 'L':
                yield Direction.LEFT;
                break;
            case 'R':
                yield Direction.RIGHT;
                break;
            case 'U':
                yield Direction.UP;
                break;
            case 'D':
                yield Direction.DOWN;
                break;
            case 'P':
                yield Direction.PAUSE;
                break;
            case 'C':
                i=0;
                break;
        }
    }
    if(safe) yield Direction.PAUSE;
}

class Travel {
    constructor(path){
        this.path = path;
        this.instructor = read_instructions(path);
        this.timeout = null;
    }

    play(){
        let i = 0;
        const loop = () => {
            this.timeout=setTimeout(()=>{
                if(!this.playOne()){
                    i+=1;
                    loop();
                }
            },166)
        }
        loop();
    }

    playOne(){
        let next = this.instructor.next();
        if(!next.done){
            if(next.value <= 4){
                sendDir(next.value);
            }
        }
        return next.done === true;
    }

    pause(){
        if(this.timeout !== null) {
            clearTimeout(this.timeout);
        }
        sendDir(Direction.PAUSE);
    }
}

const ergomoves = [];
function activateDir(d){
    const index = ergomoves.indexOf(d);
    if(index < 0) {
        ergomoves.push(d);
        sendDir(d);
    }
}

function deactivateDir(d){
    console.log("Deactivating",d);
    console.log("Deactivating",d,". Current state:", ergomoves);
    const index = ergomoves.indexOf(d);
    ergomoves.splice(index,1);
    console.log("Deactivating",d,". New state:", ergomoves);
    if(ergomoves.length > 0){
        for(const dir of ergomoves){
            sendDir(dir);
        }
    }
}