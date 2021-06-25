// Game setup
window.onload = function() {

    // Create the game board
    var canvasElement = document.getElementById("canvas");
    canvasElement.width = document.body.clientWidth;
    canvasElement.height = document.body.clientHeight;

    var gameBoard = new GameBoard(canvasElement);


    // Set up UI
    document.getElementById("toggle").addEventListener("click", function(event) {
        console.log("Toggle simulation: ", event);

        gameBoard.toggleSimulation(); 
        
        let button = event.target;
        button.innerText = gameBoard.active ? 'Stop' : 'Start';
    });

    document.getElementById("step").addEventListener("click", function(event) {
        console.log("Step simulation: ", event);
        gameBoard.simulationStep();
    });

    document.getElementById("randomise").addEventListener("click", function(event) {
        console.log("Randomise", event);
        gameBoard.randomiseCells();
    });

    document.getElementById("scale").addEventListener("change", function(event) {
        console.log("Scale", event);

        canvasElement = document.getElementById("canvas");
        canvasElement.width = document.body.clientWidth;
        canvasElement.height = document.body.clientHeight;

        gameBoard = new GameBoard(canvasElement, event.target.value);
    });


    document.getElementById("delay").addEventListener("change", function(event) {
        console.log("Delay", event);
        gameBoard.simulationDelay = event.target.value;
        //gameBoard.toggleSimulation();
    });


    document.getElementById("canvas").addEventListener("click", function(event) {
        // console.log("Canvas clicked: ", event);
        // console.log(gameBoard);

        gameBoard.changeCellByPosition(event.clientX,  event.clientY);
    });
}

const directions = [
    [0, -1], //up
    [1, -1], //right-up
    [1, 0],  //right etc.
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1]
];



class Cell {
    constructor(index) {
        this.position = index;
        this.index = index;
        this.neighbours = [];
        this.alive = false;
        this.nextAlive = false;
    }

    countNeighbours(gameBoard) {
        //console.log(`countNeighbours(${this.index})`);
        //let count = Math.floor(Math.random() * 9);

        let count = 0;
        let currentCellPosition = gameBoard.findPosition(this.index);
        let position = [0,0];

        for (let i = 0; i < directions.length; i++) {
            position[0] = currentCellPosition[0] + directions[i][0];
            position[1] = currentCellPosition[1] + directions[i][1];
            let cellIndex = gameBoard.findIndex(position[0], position[1]);
            if (cellIndex >= 0) { // Cell exists
                if (gameBoard.cellArray[cellIndex].alive) {
                    count++;
                }
            }
        }
        
        return count;
    }

    toggleAlive() {
        this.alive = !this.alive;
    }

}

class GameBoard {
    constructor(canvasElement, tileSize = 10, simulationDelay = 200) {
        this.tiledCanvasSettings = {
            chunkSize: 2048,
            fadeTime: 500,
            maxLoadChunks: 100
        };
        this.cellColor = '#00b300';
        this.active = false;
        this.tiledCanvas = new TiledCanvas(canvasElement, this.tiledCanvasSettings);
        // https://github.com/Squarific/TiledCanvas
        this.tileSize = tileSize;
        this.width = Math.floor(canvasElement.width / this.tileSize);
        this.height = Math.floor(canvasElement.height / this.tileSize);
        this.cellArray = [];
        this.newCellArray = [];
        this.simulationDelay = simulationDelay; //ms
        this.canvasElement = canvasElement;

        let size = this.width * this.height;
        for (let i = 0; i < size; i++) {
            let newCell = new Cell(i);
            this.cellArray.push(newCell);
        }        
        // For canvas debugging
        //this.checkCellsAreWorking();
    }

    // constructor(existingBoard) {
    //     this.tiledCanvasSettings = existingBoard.tiledCanvasSettings;
    //     this.canvasElement = existingBoard.canvasElement;

    //     this.cellColor = existingBoard.cellColor;
    //     this.active = existingBoard.active;
    //     this.tiledCanvas = new TiledCanvas(this.canvasElement, this.tiledCanvasSettings);
    //     // https://github.com/Squarific/TiledCanvas
    //     this.tileSize = existingBoard.tileSize;
    //     this.width = Math.floor(this.canvasElement.width / this.tileSize);
    //     this.height = Math.floor(this.canvasElement.height / this.tileSize);
    //     this.cellArray = existingBoard.cellArray;
    //     this.newCellArray = existingBoard.newCellArray;
    //     this.simulationDelay = existingBoard.simulationDelay; //ms
        
    //     let size = existingBoard.size;    
    // }

    // Helper funcitons
    findPosition(index) {
        // index += 1;
        let x = index % this.width;
        let y = Math.floor(index / this.width);
        return[x, y];
    }

    findIndex(x, y) {
        if (x >= this.width || y >= this.height || x < 0 || y < 0) {
            return -1;
        }
        return this.width * y + x;
    }

    fillCell(x, y) {
        //console.log(`GameBoard.fillCell(${x}, ${y})`);
        this.tiledCanvas.context.beginPath();
        this.tiledCanvas.context.fillStyle = this.cellColor;
        this.tiledCanvas.context.fillRect(x, y, this.tileSize, this.tileSize);
        this.tiledCanvas.context.stroke();
        this.tiledCanvas.drawingRegion(0, 0, 20, 20);
        this.tiledCanvas.execute();
    }

    unfillCell(x, y) {
        //console.log(`GameBoard.unfillCell(${x}, ${y})`);
        this.tiledCanvas.context.beginPath();
        this.tiledCanvas.context.fillStyle = '#000000';
        this.tiledCanvas.context.fillRect(x, y, this.tileSize, this.tileSize);
        this.tiledCanvas.context.stroke();
        this.tiledCanvas.drawingRegion(0, 0, 20, 20);
        this.tiledCanvas.execute();
    }

    toggleSimulation() {
        console.log("GameBoard.toggleSimulation()");
        this.active = !this.active;

        if (this.active) { this.startSimulation(); } 

    }

    startSimulation() {
        console.log("GameBoard.startSimulation()");
        let gameBoard = this;

        const simulation = setInterval(function() {
            console.log("simulation interval function", gameBoard.active);
            if (gameBoard.active) { gameBoard.simulationStep(); }
            else { clearInterval(simulation); }
        }, this.simulationDelay);
    }

    simulationStep(){
        console.log("GameBoard.simulationStep()");

        for (let i = 0; i < this.cellArray.length; i++) {
            let cell = this.cellArray[i]; // The same at this point
            
            let count = cell.countNeighbours(this);

            // Stay alive
            if (cell.alive && (2 <= count && count <= 3)) { cell.nextAlive = true; continue; }

            // Become alive
            else if (!cell.alive && count == 3) { cell.nextAlive = true; }

            // Die
            else if (cell.alive && (count < 2 || count > 3)) { cell.nextAlive = false; }

            //Stay dead
            else { cell.nextAlive = false; continue; }
        }

        for (let i = 0; i < this.cellArray.length; i++) {
            let cell = this.cellArray[i];
            if (cell.nextAlive != cell.alive) {
                this.changeCellByCell(cell);
            }
        }
    }

    randomiseCells() {
        for (let i = 0; i < this.cellArray.length; i++) {
            if (Math.random() - 0.5 > 0) {
                this.changeCellByCell(this.cellArray[i]);
            }
        }
    }


    changeCellByPosition(x, y) {
        //console.log(`GameBoard.changeCellByPosition(${x}, ${y})`);
        x = Math.floor(x / this.tileSize);
        y = Math.floor(y / this.tileSize);
        //console.log(`Cell position: (${x}, ${y})`);
        
        let cell = this.cellArray[this.findIndex(x,y)];

        this.changeCellByCell(cell);

        // let alive = this.cellArray[this.findIndex(x,y)].alive;
        // if (alive) { this.unfillCell(x * this.tileSize, y * this.tileSize); }
        // else { this.fillCell(x * this.tileSize, y * this.tileSize); }
        // this.cellArray[this.findIndex(x,y)].alive = !this.cellArray[this.findIndex(x,y)].alive;
    }

    changeCellByCell(cell) {
        //console.log(`GameBoard.changeCellByCell(${cell.index})`);
        let position = this.findPosition(cell.index);
        let x = position[0];
        let y = position[1];

        if (cell.alive) { this.unfillCell(x * this.tileSize, y * this.tileSize); }
        else { this.fillCell(x * this.tileSize, y * this.tileSize); }
        cell.toggleAlive()
    }

    checkCellsAreWorking() {
        for (let i = 0; i < this.cellArray.length; i++) {
            let cell  = this.cellArray[i];
            if (i % 2 == 0) {
                let position = this.findPosition(cell.index);
                this.fillCell(position[0] * this.tileSize, position[1] * this.tileSize);
            }
        }
    }
}
