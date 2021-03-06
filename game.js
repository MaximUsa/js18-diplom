'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(plusVector) {
        if (!(plusVector instanceof Vector)) {
            throw new Error('Передан не вектор, сложение не выполнено.');
        }
        return new Vector(this.x + plusVector.x, this.y + plusVector.y);
    }

    times(multiplierVector = 1) {
        return new Vector(this.x * multiplierVector, this.y * multiplierVector);
    }
}

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
            throw new Error('Передан не вектор.');
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }

    act() {}

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return 'actor';
    }

    isIntersect(moveActor) {
        if (!(moveActor instanceof Actor)) {
            throw new Error('Передан не актер.');
        }
        if (this === moveActor) {
            return false;
        }
        return this.left < moveActor.right && this.top < moveActor.bottom &&
            this.right > moveActor.left && this.bottom > moveActor.top;
    }
}

class Level {
    constructor(grid = [], actors = [], numLives = 3) {
        this.actors = actors;
        this.immmortal = false;
        this.numLives = numLives;
        this.livesActors = [
            new Live(new Vector(15.5, 1)),
            new Live(new Vector(17, 1)),
            new Live(new Vector(18.5, 1)),
        ]
        this.actors = actors.slice();
        //this.actors = this.actors.concat(this.livesActors);
        this.status = null;
        this.finishDelay = 1;
        this.grid = grid.slice();
        this.height = this.grid.length;
        this.width = Math.max(0, ...this.grid.map(element => element.length));
        this.player = this.actors.find(actor => actor.type === 'player');
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(moveActor) {
        if (!(moveActor instanceof Actor)) {
            throw new Error('Неверный аргумент.');
        }
        return this.actors.find(actor => actor.isIntersect(moveActor));
    }

    obstacleAt(position, size) {
        if (!((position instanceof Vector) && (size instanceof Vector))) {
            throw new Error('Передан не вектор.');
        }

        const topBorder = Math.floor(position.y);
        const bottomBorder = Math.ceil(position.y + size.y);
        const leftBorder = Math.floor(position.x);
        const rightBorder = Math.ceil(position.x + size.x);

        if (leftBorder < 0 || rightBorder > this.width || topBorder < 0) {
            return 'wall';
        }
        if (bottomBorder > this.height) {
            return 'lava';
        }

        for (let y = topBorder; y < bottomBorder; y++) {
            for (let x = leftBorder; x < rightBorder; x++) {
                const cell = this.grid[y][x];
                if (cell) {
                    return cell;
                }
            }
        }
    }

    removeActor(actor) {
        const findInd = this.actors.indexOf(actor);
        if (findInd !== -1) {
            this.actors.splice(findInd, 1)
        }
    }

    noMoreActors(typeActor) {
        return !this.actors.some(actor => actor.type === typeActor);
    }

    playerTouched(touched, actor) {
        if (this.status !== null) {
            return
        }

        if (['lava', 'fireball'].some(element => element === touched)) {
            this.status = 'lost';
        }

        // if (!this.immmortal) {
        //     if (['lava', 'fireball'].some(element => element === touched)) {
        //         //this.immmortal = true;
        //         //this.status = "immmortal";
        //         //this.numLives--;
        //         //const live = this.livesActors.pop();
        //         //this.removeActor(live);
        //         //console.log(this.numLives);

        //         if (this.numLives <= 0) {
        //             this.status = 'lost';

        //         } else {
        //             setTimeout(() => {
        //                 //console.log(this.immmortal)
        //                 this.immmortal = false;
        //                 //console.log(this.immmortal)
        //             }, 2000);
        //         }
        //     }
        // }

        if (touched === 'coin' && actor.type === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors('coin')) {
                this.status = 'won';
            }
        }
    }
}

const obstaclesDict = {
    'x': 'wall',
    '!': 'lava'
};

class LevelParser {
    constructor(charsDict = {}) {
        this.actorsLibrary = Object.assign({}, charsDict);
    }

    actorFromSymbol(char) {
        return this.actorsLibrary[char];
    }

    obstacleFromSymbol(char) {
        return obstaclesDict[char];
    }

    createGrid(arrayGrid = []) {
        return arrayGrid.map(line => line.split('').map(char => this.obstacleFromSymbol(char)));
    }

    createActors(arrayActors = []) {
        const actors = [];
        arrayActors.forEach((itemY, y) => {
            itemY.split('').forEach((itemX, x) => {
                const constructorActors = this.actorFromSymbol(itemX);
                if (typeof constructorActors !== 'function') {
                    return;
                }
                const result = new constructorActors(new Vector(x, y));
                if (result instanceof Actor) {
                    actors.push(result);
                }
            });
        });
        return actors;
    }

    parse(plan /*, numLives = 3*/ ) {
        return new Level(this.createGrid(plan), this.createActors(plan) /*, numLives*/ );
    }
}
class Live extends Actor {
    constructor(position = new Vector(0, 0)) {
        super(position, new Vector(1, 1), new Vector(0, 0));
    }
    get type() {
        return 'live';
    }
    getNextPosition(time = 1) {}
    handleObstacle() {}
    act(time, level) {}
}
class Fireball extends Actor {
    constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
        super(position, new Vector(1, 1), speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        return this.pos.plus(this.speed.times(time));
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, level) {
        const nextPosition = this.getNextPosition(time);
        if (level.obstacleAt(nextPosition, this.size)) {
            this.handleObstacle();
        } else {
            this.pos = nextPosition;
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(position) {
        super(position, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(position) {
        super(position, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(position) {
        super(position, new Vector(0, 3));
        this.beginPosition = position;
    }

    handleObstacle() {
        this.pos = this.beginPosition;
    }
}

class Coin extends Actor {
    constructor(position = new Vector(0, 0)) {
        const pos = position.plus(new Vector(0.2, 0.1));
        super(pos, new Vector(0.6, 0.6));
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
        this.startPos = this.pos;
    }

    get type() {
        return 'coin';
    }

    updateSpring(number = 1) {
        this.spring += this.springSpeed * number;
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(number = 1) {
        this.updateSpring(number);
        return this.startPos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(position = new Vector(0, 0)) {
        super(position.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
    }

    get type() {
        return 'player';
    }
}

// const schemas = [
//         [
//         "     v                 ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "  |                    ",
//         "  o                 o  ",
//         "  x               = x  ",
//         "  x          o o    x  ",
//         "  x  @       xxxxx  x  ",
//         "  xxxxx             x  ",
//         "      x!!!!!!!!!!!!!x  ",
//         "      xxxxxxxxxxxxxxx  ",
//         "                       "
//     ],
//     [
//         "        |           |  ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "                       ",
//         "     |                 ",
//         "                       ",
//         "         =      |      ",
//         " @ |  o            o   ",
//         "xxxxxxxxx!!!!!!!xxxxxxx",
//         "                       "
//     ],
//     [
//         "                       ",
//         "                       ",
//         "                       ",
//         "    o                  ",
//         "    x      | x!!x=     ",
//         "         x             ",
//         "                      x",
//         "                       ",
//         "                       ",
//         "                       ",
//         "               xxx     ",
//         "                       ",
//         "                       ",
//         "       xxx  |          ",
//         "                       ",
//         " @                     ",
//         "xxxxxxxxxxx!!!!!!!!!!!!",
//         "                       "
//     ], [
//         "   v         v",
//         "              ",
//         "         !o!  ",
//         "              ",
//         "              ",
//         "              ",
//         "              ",
//         "         xxx  ",
//         "          o   ",
//         "        =     ",
//         "  @           ",
//         "  xxxx        ",
//         "  |           ",
//         "      xxx    x",
//         "              ",
//         "          !   ",
//         "              ",
//         "              ",
//         " o       x    ",
//         " x      x     ",
//         "       x      ",
//         "      x       ",
//         "   xx         ",
//         "              "
//     ]
// ];




const actorDict = {
    '@': Player,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball,
    'v': FireRain
};

const parser = new LevelParser(actorDict);

loadLevels().then(json =>
        runGame(JSON.parse(json), parser, DOMDisplay))
    .then(() => alert('Вы выйграли приз!'));