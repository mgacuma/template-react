import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

const cellWidth = 1024 / 16
const cellHeight = 768 / 16

class Food {
    x
    y
    gameObject

    constructor(){
        this.x = 11
        this.y = 1
        this.gameObject = {}
    }

    respawn(snakePosition) {
        let x,y
        do {
            x = Math.floor(Math.random() * 16)
            y = Math.floor(Math.random() * 16)
        } while (snakePosition.some(segment => segment.x === x && segment.y === y));
        
        this.x = x
        this.y = y
        this.gameObject.x = x * cellWidth
        this.gameObject.y = y * cellHeight
        
        return { x, y };
    }
}

class Snake {
    length
    direction
    position

    constructor() {
        this.length = 5
        this.direction = 'RIGHT',
        this.position = [
            {
                x: 1,
                y: 1,
                gameObject: {}
            },
            {
                x: 2,
                y: 1,
                gameObject: {}
            },
            {
                x: 3,
                y: 1,
                gameObject: {}
            },
            {
                x: 4,
                y: 1,
                gameObject: {}
            },
            {
                x: 5,
                y: 1,
                gameObject: {}
            }
        ]
    } 
    move() {
        let { x,y } = this.getHead()
        const oldSegment = this.position.shift()
        switch(this.direction){
            case 'LEFT':
                oldSegment.x = x - 1
                oldSegment.y = y
                oldSegment.gameObject.x = oldSegment.x * cellWidth
                oldSegment.gameObject.y = oldSegment.y * cellHeight
                this.position.push(oldSegment)
                break;
            case 'RIGHT':
                oldSegment.x = x + 1
                oldSegment.y = y
                oldSegment.gameObject.x = oldSegment.x * cellWidth
                oldSegment.gameObject.y = oldSegment.y * cellHeight
                this.position.push(oldSegment)
                break;
            case 'UP':
                oldSegment.x = x
                oldSegment.y = y - 1
                oldSegment.gameObject.y = oldSegment.y * cellHeight
                oldSegment.gameObject.x = oldSegment.x * cellWidth
                this.position.push(oldSegment)
                break;
            case 'DOWN':
                oldSegment.x = x
                oldSegment.y = y + 1
                oldSegment.gameObject.y = oldSegment.y * cellHeight
                oldSegment.gameObject.x = oldSegment.x * cellWidth
                this.position.push(oldSegment)
                break;
        }
    }

    grow({x,y,gameObject}) {
        this.length = this.position.unshift({x,y,gameObject})
        return this.length
    }

    getTail() {
        return {x: this.position[0].x, y: this.position[0].y}
    }

    getHead() {
        return {x: this.position[this.position.length - 1].x, y: this.position[this.position.length - 1].y}
    }
}

export class Game extends Scene
{
    
    score;
    food;
    snake;


    // conversion

    // x => cols => j
    // y => rows => i

    // array[y][x]

    
    // width: 1024,
    // height: 768,

    constructor ()
    {
        super('Game');

        this.score = 0

        this.food = new Food()

        this.snake = new Snake()
        
    }

    create ()
    {
        this.input.keyboard.on('keydown-W', () => {
            if(this.snake.direction !== 'DOWN'){
                this.snake.direction = 'UP'
            }
        });
        this.input.keyboard.on('keydown-A', () => {
            if(this.snake.direction !== 'RIGHT'){
                this.snake.direction = 'LEFT'
            }
        });
        this.input.keyboard.on('keydown-S', () => {
            if(this.snake.direction !== 'UP'){
                this.snake.direction = 'DOWN'
            }
        });
        this.input.keyboard.on('keydown-D', () => {
            if(this.snake.direction !== 'LEFT'){
                this.snake.direction = 'RIGHT'
            }
        });
        this.cameras.main.setBackgroundColor(0x00ffff);

        this.snake.position.forEach((segment) => {
            segment.gameObject = this.add.rectangle(segment.x * cellWidth, segment.y * cellHeight, cellWidth, cellHeight, 0xff0000).setOrigin(0,0)
        })

        this.food.gameObject = this.add.rectangle(this.food.x * cellWidth, this.food.y * cellHeight, cellWidth, cellHeight, 0x0000ff).setOrigin(0,0)

        this.tickRate = 128; // Adjust tick rate as needed
        this.tickTimer = this.time.addEvent({
            delay: this.tickRate,
            callback: this.onTick,
            callbackScope: this,
            loop: true
        });

        EventBus.emit('current-scene-ready', this);
    }

    onTick ()
    {
        let { x,y } = this.snake.getTail()

        this.snake.move();
        
        switch(this.checkCollision()){
            case 'CollisionState.GOAL':
                this.score += 1
                console.log(this.score)
                this.events.emit('scoreChange', this.score);
                if(this.snake.grow({x,y,gameObject: this.add.rectangle(x * cellWidth, y * cellHeight, cellWidth, cellHeight, 0xff0000).setOrigin(0,0)}) === 256){
                    throw Error('WINNER')
                }
                this.food.respawn(this.snake.position)
                break;

            case 'CollisionState.WALL':
            case 'CollisionState.SELF': 
                throw Error('GAME OVER')
                break;
            default: break;
        }
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }

    checkCollision(){
        const head = this.snake.getHead()
        if(head.x === this.food.x && head.y === this.food.y){
            return 'CollisionState.GOAL'
        }
        if(head.x > 16 || head.x < 0 || head.y > 16 || head.y < 0){
            return 'CollisionState.WALL'
        } 
        if(this.snake.position.slice(0,this.snake.position.length - 2).some(segment => segment.x === head.x && segment.y === head.y)){
            return 'CollisionState.SELF'
        }
        return false
    }
}
