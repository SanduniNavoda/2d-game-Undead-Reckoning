const characterElm = document.querySelector('#character');
const bodyElm = document.querySelector("body");
const scoreBoardElm = document.querySelector(".lblScore");

document.querySelector("#end-screen").classList.add('hide')

const startScreenSoundElm = document.createElement("audio");
startScreenSoundElm.setAttribute("preload", "auto");
startScreenSoundElm.setAttribute("src", "/sound/theme.mp3");
startScreenSoundElm.setAttribute("loop", "true");
startScreenSoundElm.volume = 0.5;
document.body.appendChild(startScreenSoundElm);

const backgroundSoundElm = document.createElement("audio");
backgroundSoundElm.setAttribute("preload", "auto");
backgroundSoundElm.setAttribute("src", "/sound/starry-night-sound.mp3");
backgroundSoundElm.setAttribute("loop", "true");
backgroundSoundElm.volume = 0.5;
document.body.appendChild(backgroundSoundElm);

const deathSoundElm = document.createElement("audio");
deathSoundElm.setAttribute("preload", "auto");
deathSoundElm.setAttribute("src", "/sound/death-sound.mp3");
deathSoundElm.volume = 1.0;
document.body.appendChild(deathSoundElm);

const playButtonSound = document.createElement("audio");
playButtonSound.setAttribute("preload", "auto");
playButtonSound.setAttribute("src", "/sound/play-button-click-sound.mp3");
playButtonSound.volume = 0.5;
document.body.appendChild(playButtonSound);

const zombieSound = document.createElement("audio");
zombieSound.setAttribute("preload", "auto");
zombieSound.setAttribute("src", "/sound/zombie-moan.mp3");
zombieSound.volume = 1;
document.body.appendChild(zombieSound);

await new Promise((resolve) => {
    document.querySelector("#start-screen > button")
        .addEventListener('click', async () => {
            playButtonSound.play();
            // await document.querySelector("html").requestFullscreen({
            //     navigationUI: 'hide'
            // });
            document.querySelector("#start-screen").remove();
            resolve();
        });
});

await new Promise(function (resolve) {
    const images = [
        '/image/BG.png',
        '/image/tile/Tile (1).png',
        '/image/tile/Tile (2).png',
        '/image/tile/Tile (3).png',
        '/image/enemy/DeadBush.png',
        ...Array(10).fill('/image/character')
            .flatMap((v, i) => [
                `${v}/Jump__00${i}.png`,
                `${v}/Idle__00${i}.png`,
                `${v}/Run__00${i}.png`,
                `${v}/Dead__00${i}.png`,
                `${v}/Attack__00${i}.png`
            ]),
        ...Array(10).fill('/image/enemy/zombie/male')
            .flatMap((v, i) => [
                `${v}/Walk__00${i}.png`
            ]),
        ...Array(10).fill('/image/enemy/zombie/female')
            .flatMap((v, i) => [
                `${v}/Walk__00${i}.png`
            ]),
    ];
    for (const image of images) {
        const img = new Image();
        img.src = image;
        img.addEventListener('load', progress);
    }

    const barElm = document.getElementById('bar');
    const totalImages = images.length;

    function progress() {
        images.pop();
        barElm.style.width = `${100 / totalImages * (totalImages - images.length)}%`
        if (!images.length) {
            setTimeout(() => {
                document.getElementById('overlay').classList.add('hide');
                resolve();
            }, 1000);
        }
    }
});

let dx = 0;                     // Run
let i = 0;                      // Rendering
let t = 0;
let run = false;
let jump = false;
let attack = false;
let zombieDie = false;
let angle = 0;
let tmr4Jump;
let tmr4Run;
let previousTouch;
let die = false;
let lives = 5;
let health = 100;
let score = 0;
let coins = 0;

/* Rendering Function */

backgroundSoundElm.play();

const checkPosition = () => {
    enemyElms.forEach(enemyElm => {
        if ((characterElm.offsetLeft - 20 + characterElm.offsetWidth) > (enemyElm.offsetLeft + 20) &&
            (characterElm.offsetLeft + 20) < (enemyElm.offsetLeft - 20 + enemyElm.offsetWidth) &&
            (characterElm.offsetTop - 20 + characterElm.offsetHeight > enemyElm.offsetTop + 20) &&
            enemyElm.classList.contains('enemy')) {
            happenDie();
        } else {
            score = score + 0.0001;//add one score for 10 second survival time
            console.log(Math.floor(score));
        }
    });
};

const positionInterval = setInterval(checkPosition, 1); // Check every 1ms

const motion = setInterval(() => {
    if (die) {
        characterElm.style.width = "100px"
        characterElm.style.height = "100px"
        characterElm.style.backgroundImage = `url('/image/character/Dead__00${i++}.png')`;
        if (i === 10) {
            clearInterval(motion);
            clearInterval(positionInterval);
            setTimeout(() => {
                document.querySelector("#end-screen").classList.remove('hide');
                scoreBoardElm.textContent = `${Math.floor(score)}`;
            }, 800);
        }
        return;
    }

    if (jump) {
        characterElm.style.width = "100px"
        characterElm.style.height = "100px"
        characterElm.style.backgroundImage = `url('/image/character/Jump__00${i++}.png')`;
    } else if (attack) {
        characterElm.style.width = "150px"
        characterElm.style.height = "110px"
        characterElm.style.backgroundImage = `url('/image/character/Attack__00${i++}.png')`;
    } else if (run) {
        characterElm.style.width = "100px"
        characterElm.style.height = "100px"
        characterElm.style.backgroundImage = `url('/image/character/Run__00${i++}.png')`;
    } else {
        characterElm.style.width = "100px"
        characterElm.style.height = "100px"
        characterElm.style.backgroundImage = `url('/image/character/Idle__00${i++}.png')`;
    }

    if (i === 10) i = 0;
}, 1000 / 30);

// Initially Fall Down
const tmr4InitialFall = setInterval(() => {
    const top = characterElm.offsetTop + (t++ * 0.2);
    if (characterElm.offsetTop >= (innerHeight - 128 - characterElm.offsetHeight)) {
        clearInterval(tmr4InitialFall);
        return;
    }
    characterElm.style.top = `${top}px`;
}, 20);

for (let k = 0; k < 20; k++) {
    const zombieElms = document.createElement("div");
    //zombieElms.setAttribute("class", "enemy zombie");
    const gender = ['male', 'female'];
    const num = (Math.random() > 0.5) ? 0 : 1;
    const selectedGender = gender[num];
    if (selectedGender === 'female'){
        zombieElms.setAttribute("class", "enemy");
    } else {
        zombieElms.setAttribute("class", "enemy zombie");
    }
    zombieElms.style.backgroundPosition = "center";
    zombieElms.style.backgroundRepeat = "no-repeat";
    zombieElms.style.backgroundSize = "contain";
    zombieElms.style.width = "100px";
    zombieElms.style.height = "100px";
    zombieElms.style.position = "absolute";
    zombieElms.style.bottom = "124px";
    zombieElms.style.right = `${Math.random() * -10000 - 2}px`;
    bodyElm.appendChild(zombieElms);

    let j = 0;
    let dxZombie = 0;
    let zombieDie = false;

    const zombieWalkInterval = setInterval(() => {
        if (!zombieDie) {
            zombieElms.style.backgroundImage = `url('/image/enemy/zombie/${selectedGender}/Walk__00${j++}.png')`;
            if (j === 10) j = 0;
        }
    }, 1000 / 10);

    dxZombie = Math.random() * -5 - 5;
    zombieElms.classList.add('rotate');

    const zombieMoveInterval = setInterval(() => {
        const zombieLeft = zombieElms.offsetLeft + dxZombie;
        zombieElms.style.left = `${zombieLeft}px`;
    }, 100);

    const intervalForZombieSound = setInterval(() => {
        if (zombieElms.offsetLeft <= window.innerWidth) {
            zombieSound.play();
            clearInterval(intervalForZombieSound);
        }
    }, 1);

    const checkPositionForAttack = () => {
        //zombieDie = false;
        if(!zombieDie && zombieElms.classList.contains('zombie')){
            if ((characterElm.offsetLeft - 10 + characterElm.offsetWidth) > (zombieElms.offsetLeft + 10) &&
                (characterElm.offsetLeft + 10) < (zombieElms.offsetLeft - 10 + zombieElms.offsetWidth) &&
                characterElm.offsetTop - 10 + characterElm.offsetHeight > zombieElms.offsetTop + 10) {
                if (attack) {
                    zombieDie = true;
                    zombieElms.classList.remove('enemy');
                    j = 0;
                    const zombieDeathInterval = setInterval(() => {
                        zombieElms.style.bottom = "100px";
                        zombieElms.style.backgroundImage = `url('/image/enemy/zombie/${selectedGender}/Dead (${j++}).png')`;
                        if (j === 12) {
                            clearInterval(zombieWalkInterval);
                            clearInterval(zombieDeathInterval);
                            clearInterval(zombieMoveInterval);

                            setTimeout(() => {
                                let coinElm = document.createElement("div");
                                coinElm.classList.add('coin')
                                coinElm.style.position = "absolute";
                                coinElm.style.top = `${zombieElms.offsetTop + zombieElms.offsetHeight/2 - coinElm.offsetHeight/2}px`;
                                coinElm.style.left = `${zombieElms.offsetLeft + zombieElms.offsetWidth/2 - coinElm.offsetWidth/2}px`;
                                coinElm.style.height = "20px";
                                coinElm.style.width ="20px";
                                coinElm.style.backgroundImage = `url('/image/dollar.png')`;
                                coinElm.style.backgroundSize = "contain";
                                document.body.appendChild(coinElm);

                                zombieElms.remove();

                            }, 500);
                        }
                    }, 1000 / 30);
                }
            }
        }

    };

    setInterval(checkPositionForAttack, 1); // Check every 1ms
}

const enemyElms = document.querySelectorAll('.enemy');


setInterval(() => {
    const coinElms = document.querySelectorAll('.coin');
    coinElms.forEach(coinElm => {
        if(coinElm.offsetLeft <= (characterElm.offsetLeft + characterElm.offsetWidth) &&
            coinElm.offsetLeft + coinElm.offsetWidth >= characterElm.offsetLeft &&
            coinElm.offsetTop <= (characterElm.offsetTop + characterElm.offsetHeight) &&
            coinElm.offsetTop + coinElm.offsetHeight >= characterElm.offsetTop){
            const tmr4CoinElmMove = setInterval(() => coinElmMoveFn(coinElm), 1000/10);
            coins = coins + 1;
            score = score + 5;

        }
    });
}, 10);



function coinElmMoveFn(coinElm) {
    coinElm.style.top = `${coinElm.offsetTop - 10}px`;
}

// Jump
function doJump() {
    if (tmr4Jump || die) return;
    i = 0;
    jump = true;
    const initialTop = characterElm.offsetTop;
    tmr4Jump = setInterval(() => {
        const top = initialTop - (Math.sin(toRadians(angle++))) * 180;
        characterElm.style.top = `${top}px`;
        if (angle === 181) {
            clearInterval(tmr4Jump);
            tmr4Jump = undefined;
            jump = false;
            angle = 0;
            i = 0;
        }
    }, 1);
}

// Utility Fn (Degrees to Radians)
function toRadians(angle) {
    return angle * Math.PI / 180;
}

// Run
function doRun(left) {
    if (tmr4Run || die) return;
    run = true;
    i = 0;
    if (left) {
        dx = -10;
        characterElm.classList.add('rotate');
    } else {
        dx = 10;
        characterElm.classList.remove('rotate');
    }
    tmr4Run = setInterval(() => {
        if (dx === 0) {
            clearInterval(tmr4Run);
            tmr4Run = undefined;
            run = false;
            i = 0;
            return;
        }
        const left = characterElm.offsetLeft + dx;
        if (left + characterElm.offsetWidth >= innerWidth ||
            left <= 0) {
            if (left <= 0) {
                characterElm.style.left = '0';
            } else {
                characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`;
            }
            dx = 0;
            return;
        }
        characterElm.style.left = `${left}px`;
    }, 20);
}

// Die
function happenDie() {
    run = false;
    jump = false;
    die = true;
    deathSoundElm.play();
}

// Attack
function doAttack() {
    attack = true;
}

// Event Listeners
addEventListener('keydown', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            doRun(e.code === "ArrowLeft");
            break;
        case "Space":
            doJump();
            break;
        case "KeyQ":
            doAttack();
            break;
    }
});

addEventListener('keyup', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            dx = 0;
            break;
        case "KeyQ":
            attack = false;
    }
});

const resizeFn = () => {
    characterElm.style.top = `${innerHeight - 128 - characterElm.offsetHeight}px`;
    if (characterElm.offsetLeft < 0) {
        characterElm.style.left = '0';
    } else if (characterElm.offsetLeft >= innerWidth) {
        characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`;
    }
}

addEventListener('resize', resizeFn);
/* Fix screen orientation issue in mobile devices */
screen.orientation.addEventListener('change', resizeFn);

characterElm.addEventListener('touchmove', (e) => {
    if (!previousTouch) {
        previousTouch = e.touches.item(0);
        return;
    }
    const currentTouch = e.touches.item(0);
    doRun((currentTouch.clientX - previousTouch.clientX) < 0);
    if (currentTouch.clientY < previousTouch.clientY) doJump();
    previousTouch = currentTouch;
});

characterElm.addEventListener('touchend', (e) => {
    previousTouch = null;
    dx = 0;
});