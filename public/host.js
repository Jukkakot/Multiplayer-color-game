/*
p5.multiplayer - HOST

This 'host' sketch is intended to be run in desktop browsers. 
It connects to a node server via socket.io, from which it receives
rerouted input data from all connected 'clients'.

Navigate to the project's 'public' directory.
Run http-server -c-1 to start server. This will default to port 8080.
Run http-server -c-1 -p80 to start server on open port 80.

*/

////////////
// Network Settings
// const serverIp      = 'https://yourservername.herokuapp.com';
// const serverIp      = 'https://yourprojectname.glitch.me';
const serverIp = '192.168.0.101';
const serverPort = '3000';
const local = true;   // true if running locally, false
// if running on remote server

// Global variables here. ---->

// const velScale = 10;
const debug = true;
let game;
let colors = []
let defNames 
// <----
let isGameStarted = false
const tickRate = 100
var allPlayersReady = true
function preload() {
  setupHost();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Host/Game setup here. ---->
  setupColors()
  game = new Game(width, height);


  let bX, bY, bW, bH;

  bX = 0.30 * windowWidth;
  bY = windowHeight * 0.02;
  bW = 0.4 * windowWidth;
  bH = 0.1 * windowHeight;

  startButton = createButton("Start game");
  startButton.position(bX, bY)
  startButton.size(bW, bH)
  startButton.style('font-size', "40px");
  startButton.mousePressed(startGame);
  defNames = shuffle(["Ahven","Hauki","Silakka","Kuha","Lahna"])
  setInterval(function () {
    if (isGameStarted && allPlayersChecked()) {
      var currColors = []
      for (id in game.players) {
        currColors.push(game.players[id].color)
      }
      if (game.numPlayers < 3) {
        //if 1 or 2 players
        //add one extra color to possible colors
        for (c of colors) {
          if (!currColors.includes(c)) {
            currColors.push(c)
            break
          }
        }
        colors = shuffle(colors)
        currColors = shuffle(currColors)
      }
      sendData("gameroundStart", {
        roundColor: random(currColors)
      })
      // setTimeout(function () {
      //   sendData("gameroundEnd", {})
      // }, tickRate*5);
      game.roundCount++
      allPlayersReady = false

    }
  },
    tickRate*20);
  // <----
}
function startGame(bool) {
  if (game.numPlayers === 0) return
  startButton.remove()
  isGameStarted = !isGameStarted
  let bX, bY, bW, bH;

  bX = 0.30 * windowWidth;
  bY = windowHeight * 0.02;
  bW = 0.4 * windowWidth;
  bH = 0.1 * windowHeight;
  startButton = isGameStarted ? createButton("Pause game") : createButton("Continue game")
  startButton.position(bX, bY)
  startButton.size(bW, bH)
  startButton.style('font-size', "40px");
  startButton.mousePressed(startGame);
  // startButton.setLabel(isGameStarted ? "Pause game" : "Continue game") 
  // startButton.attribute("label","jahas")
}
function setupColors() {
  colorMode(HSB);
  for (var i = 0; i < 5; i++) {
    if (i === 4) {
      colors.push(color(5 * 62, 100, 100))
      continue
    }
    colors.push(color(i * 62, 100, 100))
  }
  colorMode(RGB);
  colors = shuffle(colors)
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);

  if (isHostConnected(display = true)) {
    if(game.roundCount > 0 && game.numPlayers === 0){
      isGameStarted = false
      startButton.hide()
      push()
      textSize(80);
      textAlign(CENTER, CENTER);
      fill(255)
      text("Game ended!", width/2, height/4);
      pop()
    }
    game.printPlayerIds(5, 30);
    displayAddress();
    // Host/Game draw here. --->
    // Display player IDs in top left corner

    // Update and draw game objects
    // game.draw();
    // <----
    // Display server address

  }
}

function onClientConnect(data) {
  // Client connect logic here. --->
  console.log(data.id + ' has connected. (Host)');

  if (!game.checkId(data.id) && colors.length > 0 && defNames.length > 0 && !isGameStarted) {
    isGameStarted = false
    game.add(data.id);
    var color = colors.shift()
    colors = shuffle(colors)
    sendData("playercolor", {
      color: color,
      name:game.players[data.id].name,
      playerId: data.id
    })
    game.setColor(data.id, color);
  }

  // <----
}

function onClientDisconnect(data) {
  // Client disconnect logic here. --->

  if (game.checkId(data.id)) {
    game.remove(data.id);
  }

  // <----
}

function onReceiveData(data) {
  // Input data processing here. --->
  // console.log(data);

  // if (data.type === 'joystick') {
  //   processJoystick(data);
  // }
  if (data.type === 'button') {
    processButton(data);
  }
  else if (data.type === 'playername') {
    game.setName(data.id, data.name);
  }
  else if (data.type === 'roundresult') {
    // roundColor: roundColor,
    // buttonPressed: buttonWasPressed
    var player = game.players[data.id]
    if (player === undefined) return
    player.roundCount ++
    if (
      (!isSameColor(data.roundColor, player.color) && !data.buttonPressed) ||
      (isSameColor(data.roundColor, player.color) && data.buttonPressed)
    ) {
      //Was right color and pressed button, OR was not right color and didin't press button
      print(player.name, "survived!")
    } else {
      //bad
      player.lives--
      print(player.name, "lost a life")
      if (player.lives === 0) {
        game.remove(data.id)
        print(player.name, "lost the game!")
      }
    }
  }
  // <----

  /* Example:
     if (data.type === 'myDataType') {
       processMyData(data);
     }

     Use `data.type` to get the message type sent by client.
  */
}

function allPlayersChecked() {
  
  for(p in game.players){
    if(game.players[p].roundCount !== game.roundCount){
      return false
    }
  }
  return true
}

// This is included for testing purposes to demonstrate that
// messages can be sent from a host back to all connected clients
function mousePressed() {
  sendData('timestamp', { timestamp: millis() });
  // var wasCorrect = roundColor.levels[0] === playerColor.levels[0]
  // sendData("round",{
  //   wasCorrect:wasCorrect
  // })
}

////////////
// Input processing
function processButton(data) {
  game.players[data.id].val = data.button;

  // game.createRipple(data.id, 300, 1000);fon

  if (debug) {
    console.log(data.id + ': ' +
      data.button);
  }
}

// ////////////
// // Game
// // This simple placeholder game makes use of p5.play
class Game {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.players = {};
    this.numPlayers = 0;
    this.id = 0;
    this.roundCount = 0
    // this.colliders	= new Group();
    // this.ripples    = new Riproples();
  }

  add(id) {
    this.players[id] = {}
    this.players[id].id = "player" + this.id;
    this.players[id].name = defNames.shift()
    // this.players[id].setCollider("rectangle", 0, 0, w, h);
    this.players[id].color = color(255, 255, 255);
    this.players[id].shapeColor = color(255, 255, 255);
    this.players[id].lives = 5
    this.players[id].roundCount = 0
    // this.players[id].lifes = 0
    // this.players[id].scale = 1;
    // this.players[id].mass = 1;
    // this.colliders.add(this.players[id]);
    print(this.players[id].id + " added.");
    this.id++;
    this.numPlayers++;
  }

  draw() {
    // this.checkBounds();
    // this.ripples.draw();
    // drawSprites();
  }

  setColor(id, r, g, b) {
    this.players[id].color = color(r, g, b);
    this.players[id].shapeColor = color(r, g, b);

    print(this.players[id].id + " color added.");
  }

  setName(id, name) {
    this.players[id].name = name

    print(this.players[id].id + " name added.");
  }
  remove(id) {
    // this.colliders.remove(this.players[id]);
    // this.players[id].remove();
    delete this.players[id];
    this.numPlayers--;
  }

  checkId(id) {
    if (id in this.players) { return true; }
    else { return false; }
  }

  printPlayerIds(x, y) {
    push();
    noStroke();
    fill(255);
    textSize(30);
    text("# players: " + this.numPlayers + " (lives)", x, y);
    if(game.numPlayers === 0) return
    y += 30;
    
    var sortedPlayers = Object.keys(game.players).map(function(key) {
      return [key,game.players[key].lives,game.players[key].name]
    });
    sortedPlayers.sort(function(a, b) {
      return b[1] - a[1];
    });
    
    for (var player of sortedPlayers) {
      var id = player[0]
      if (this.players[id].lives > 0) {
        fill(this.players[id].color);
        text(this.players[id].name , x, y);
        text(this.players[id].lives, x + 130,y)
        y += 30;
      }
    }

    pop();
  }
}
function isSameColor(c1, c2) {
  for (level in c1.levels) {
    if (c1.levels[level] !== c2.levels[level]) {
      return false
    }
  }
  return true
}
