window.CSS.registerProperty({
    name: "--menu-opacity",
    syntax: "<number>",
    inherits: true,
    initialValue: "0.7",
  });

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
    for(let i = 0; i < path.length;){
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
                continue;
        }
        i++
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
                one_game.sendDir(next.value);
            }
        }
        return next.done === true;
    }

    pause(){
        if(this.timeout !== null) {
            clearTimeout(this.timeout);
        }
        one_game.sendDir(Direction.PAUSE);
    }
}

const ergomoves = [];
function activateDir(d){
    const index = ergomoves.indexOf(d);
    if(index < 0) {
        ergomoves.push(d);
        one_game.sendDir(d);
    }
}

function deactivateDir(d){
    const index = ergomoves.indexOf(d);
    ergomoves.splice(index,1);
    if(ergomoves.length > 0){
        for(const dir of ergomoves){
            one_game.sendDir(dir);
        }
    }
}

function showTopNotification(text, timeAlive = 4) {
    var notification = doTopNotification(text);
    setTimeout(function () { notification.animateOut(); notification.destroy(); }, timeAlive * 1000);
}