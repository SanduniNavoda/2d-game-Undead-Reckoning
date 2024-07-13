const characterElm = document.querySelector('#character');
const bodyElm = document.querySelector("body");
const scoreBoardElm = document.querySelector(".lblScore");

document.querySelector("#end-screen").classList.add('hide')

const startScreenSoundElm = document.createElement("audio");
//startScreenSoundElm.setAttribute("preload", "auto");
startScreenSoundElm.setAttribute("src", "/sound/theme.mp3");
startScreenSoundElm.setAttribute("loop", "true");
startScreenSoundElm.volume = 0.5;


window.addEventListener('DOMContentLoaded', () => {
    startScreenSoundElm.play();
})

const backgroundSoundElm = document.createElement("audio");
backgroundSoundElm.setAttribute("preload", "auto");
backgroundSoundElm.setAttribute("src", "/sound/starry-night-sound.mp3");
backgroundSoundElm.setAttribute("loop", "true");
backgroundSoundElm.volume = 1.0;
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
zombieSound.volume = 1.0;
document.body.appendChild(zombieSound);

const attackSound = document.createElement("audio");
attackSound.setAttribute("preload", "auto");
attackSound.setAttribute("src", "/sound/attack.mp3");
attackSound.volume = 1.0;
document.body.appendChild(attackSound);

const zombieDeathSoundElm = document.createElement("audio");
zombieDeathSoundElm.setAttribute("preload", "auto");
zombieDeathSoundElm.setAttribute("src", "/sound/monster_death.mp3");
zombieDeathSoundElm.volume = 1.0;
document.body.appendChild(zombieDeathSoundElm);

const zombieLaugh = document.createElement("audio");
zombieLaugh.setAttribute("preload", "auto");
zombieLaugh.setAttribute("src", "/sound/zombie-laugh.mp3");
zombieLaugh.volume = 0.5;
document.body.appendChild(zombieLaugh);

const coinCollectSoundElm = document.createElement("audio");
coinCollectSoundElm.setAttribute("preload", "auto");
coinCollectSoundElm.setAttribute("src", "/sound/coin-collect.mp3");
coinCollectSoundElm.volume = 0.5;
document.body.appendChild(coinCollectSoundElm);

await new Promise((resolve) => {
    document.querySelector("#start-screen > button")
        .addEventListener('click', async () => {
            startScreenSoundElm.pause();
            startScreenSoundElm.remove();
            playButtonSound.play();
            await document.querySelector("html").requestFullscreen({
                navigationUI: 'hide'
            });
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
let tmr4SurvivalTime;
let tmr4Coins;
let tmr4CoinCollect;
let checkPosition;
let previousTouch;
let motion;
let die = false;
let lives = 5;
let health = 100;
let score = 0;
let survivalTime = 0;
let coins = 0;

/* Rendering Function */

backgroundSoundElm.play();

const resetGame = () => {
    document.querySelector("#end-screen").classList.add('hide');
    dx = 0;
    i = 0;
    t = 0;
    run = false;
    jump = false;
    attack = false;
    zombieDie = false;
    angle = 0;
    die = false;
    lives = 5;
    health = 100;
    score = 0;
    survivalTime = 0;
    coins = 0;

    // Clear intervals
    clearInterval(motion);
    clearInterval(tmr4CoinCollect);
    clearInterval(tmr4SurvivalTime);
    clearInterval(tmr4Coins);

    // Reset character position
    characterElm.style.top = `${innerHeight - 128 - characterElm.offsetHeight}px`;
    characterElm.style.left = '0';
    characterElm.classList.remove('rotate');

    // Reset score and survival time displays
    lblSurvivalTimeElm.textContent = `${survivalTime}`;
    lblCoinElm.textContent = `${coins}`;

    // Remove existing enemies and coins
    document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
    document.querySelectorAll('.coin').forEach(coin => coin.remove());

    // Reinitialize game elements
    initializeCharacter();
    initializeEnemies();
    enemyElms = document.querySelectorAll('.enemy');
    initializeTimers();
}


const lblSurvivalTimeElm = document.querySelector(".lblSurvivalTime");
const lblCoinElm = document.querySelector(".lblCoins");

const initializeTimers = () => {
    tmr4SurvivalTime = setInterval(() => {
        lblSurvivalTimeElm.textContent = `${++survivalTime}`;
    }, 1000);

    tmr4Coins = setInterval(() => {
        lblCoinElm.textContent = `${coins}`;
    }, 1);


    tmr4CoinCollect = setInterval(() => {
        const coinElms = document.querySelectorAll('.coin');
        coinElms.forEach(coinElm => {
            if(coinElm.offsetLeft <= (characterElm.offsetLeft + characterElm.offsetWidth) &&
                coinElm.offsetLeft + coinElm.offsetWidth >= characterElm.offsetLeft &&
                coinElm.offsetTop <= (characterElm.offsetTop + characterElm.offsetHeight) &&
                coinElm.offsetTop + coinElm.offsetHeight >= characterElm.offsetTop){
                const tmr4CoinElmMove = setInterval(() => coinElmMoveFn(coinElm), 1000/10);
                coinCollectSoundElm.play();

                if(!coinElm.classList.contains('collected')){
                    coinElm.classList.add('collected');
                    coins++;
                    score = score + 5;
                }


            }
        });
    }, 10);
}
initializeTimers();

const initializeCharacter = () => {
    checkPosition = setInterval(() => {
        enemyElms.forEach(enemyElm => {
            if ((characterElm.offsetLeft - 20 + characterElm.offsetWidth) > (enemyElm.offsetLeft + 20) &&
                (characterElm.offsetLeft + 20) < (enemyElm.offsetLeft - 20 + enemyElm.offsetWidth) &&
                (characterElm.offsetTop - 20 + characterElm.offsetHeight > enemyElm.offsetTop + 20) &&
                enemyElm.classList.contains('enemy')) {
                happenDie();
            } else {
                survivalTime = survivalTime + 0.001;
                survivalTime = Math.floor(survivalTime);
                console.log(Math.floor(survivalTime));
                score = score + 0.0001;//add one score for 10 second survival time
                score = Math.floor(score);
                console.log(Math.floor(score));
            }
        });
    });



    motion = setInterval(() => {
        if (die) {
            characterElm.style.width = "100px"
            characterElm.style.height = "100px"
            characterElm.style.backgroundImage = `url('/image/character/Dead__00${i++}.png')`;
            if (i === 10) {
                //clearInterval(motion);
                //clearInterval(positionInterval);
                setTimeout(() => {
                    document.querySelector("#end-screen").classList.remove('hide');
                    zombieLaugh.play();
                    scoreBoardElm.textContent = `${score}`;
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
}
initializeCharacter();

// Initially Fall Down
const tmr4InitialFall = setInterval(() => {
    const top = characterElm.offsetTop + (t++ * 0.2);
    if (characterElm.offsetTop >= (innerHeight - 128 - characterElm.offsetHeight)) {
        clearInterval(tmr4InitialFall);
        return;
    }
    characterElm.style.top = `${top}px`;
}, 20);

const initializeEnemies = () => {
    const deadBushElm1 = document.createElement("div");
    deadBushElm1.classList.add('enemy');
    deadBushElm1.style.backgroundSize = "contain";
    deadBushElm1.style.backgroundRepeat = "no-repeat";
    deadBushElm1.style.backgroundPosition = "center";
    deadBushElm1.style.width = "80px";
    deadBushElm1.style.height = "100px";
    deadBushElm1.style.position = "absolute";
    deadBushElm1.style.bottom = "100px";
    deadBushElm1.style.left = "500px";
    deadBushElm1.style.backgroundImage = "url('/image/enemy/DeadBush.png')";
    bodyElm.appendChild(deadBushElm1);


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
                        zombieDeathSoundElm.play();
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
}
initializeEnemies();

let enemyElms = document.querySelectorAll('.enemy');





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
    clearInterval(tmr4SurvivalTime);
    deathSoundElm.play();
}

// Attack
function doAttack() {
    attack = true;
    attackSound.play();
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

document.querySelector("#btnReplay").addEventListener('click', () => {
    resetGame();
    document.querySelector("#end-screen").classList.add('.hide');
    backgroundSoundElm.play();
})