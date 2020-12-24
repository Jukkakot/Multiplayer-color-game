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
const serverIp = '192.168.3.15';
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

//Start button location on screen
let bX, bY, bW, bH;

function preload() {
  setupHost();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  //Game colors used (Currently we use 5 colors so max player count is 5)
  setupColors()
  game = new Game();
  

  bX = 0.30 * windowWidth;
  bY = windowHeight * 0.02;
  bW = 0.4 * windowWidth;
  bH = 0.1 * windowHeight;

  startButton = createButton("Start game");
  startButton.position(bX, bY)
  startButton.size(bW, bH)
  startButton.style('font-size', "40px");
  startButton.mousePressed(startButtonClick);

  //Default game names (can be changed)
  defNames = shuffle(["Ahven", "Hauki", "Silakka", "Kuha", "Lahna"])

  //Main game loop, sends new color to clients
  setInterval(function () {
    if (isGameStarted && allPlayersChecked()) {
      var currColors = []
      for (id in game.players) {
        currColors.push(game.players[id].color)
      }
      if (game.numPlayers < 3) {
        //add one extra color to possible colors
        for (c of colors) {
          if (!currColors.includes(c)) {
            currColors.push(c)
            break
          }
        }
        colors = shuffle(colors)
      }
      sendData("gameroundStart", {
        roundColor: random(currColors),
        players: game.players
      })
      game.roundCount++
      allPlayersReady = false
    }
  }, tickRate * 10);
}

function startButtonClick() {
  //Cant start or pause game with no players in it
  if (game.numPlayers === 0) return
  isGameStarted = !isGameStarted

  startButton.remove()
  //Couldn't figure out how to rename button label so we just create a new one each time unfortunately
  startButton = isGameStarted ? createButton("Pause game") : createButton("Continue game")
  startButton.position(bX, bY)
  startButton.size(bW, bH)
  startButton.style('font-size', "40px");
  startButton.mousePressed(startButtonClick);
}

//Generates 5 colors used during the game
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
    if (game.roundCount > 0 && game.numPlayers === 0) {
      startButton.hide()
      push()
      textSize(80);
      textAlign(CENTER, CENTER);
      fill(255)
      text("Game ended!", width / 2, height / 4);
      pop()
      noLoop()
      return
    }
    game.printPlayerIds(5, 30);
    displayAddress();
  }
}

function onClientConnect(data) {
  console.log(data.id + ' has connected.');
  if (!game.checkId(data.id) && colors.length > 0 && defNames.length > 0 && !isGameStarted) {
    game.add(data.id);
  }
}

function onClientDisconnect(data) {
  if (game.checkId(data.id)) {
    game.remove(data.id);
  }
}

function onReceiveData(data) {
  //Not used currently
  // if (data.type === 'playername') {
  //   game.setName(data.id, data.name);
  // }
  if (data.type === 'roundresult') {
    var player = game.players[data.id]
    if (player === undefined) return
    player.roundCount++
    if ((!isSameColor(data.roundColor, player.color) && !data.buttonPressed) ||
      (isSameColor(data.roundColor, player.color) && data.buttonPressed)) {
      //Was right color and pressed button, OR was not right color and didin't press button
      //Good
      // print(player.name, "survived!")
    } else {
      //Bad
      player.lives--
      print(player.name, "lost a life")
      if (player.lives === 0) {
        game.remove(data.id)
        print(player.name, "lost the game!")
      }
    }
    allPlayersChecked()
  }
}

function allPlayersChecked() {

  for (p in game.players) {
    if (game.players[p].roundCount !== game.roundCount) {
      return false
    }
  }
  //Send round result to clients if all clients has been checked
  sendData('result', {
    players: game.players
  });
  return true
}

class Game {
  constructor() {
    this.players = {};
    this.numPlayers = 0;
    //Id for players
    this.id = 0;
    this.roundCount = 0
  }

  add(id) {
    this.players[id] = {}
    this.players[id].id = "player" + this.id;
    this.players[id].name = defNames.shift()
    this.players[id].lives = 5
    this.players[id].roundCount = 0
    print(this.players[id].id + " added.");
    this.id++;
    this.numPlayers++;

    //Give the player a color
    this.setColor(id,  colors.shift());
    colors = shuffle(colors)
    //Send the color to player client
    sendData("playercolor", {
      color: this.players[id].color,
      name: this.players[id].name,
      playerId: id,
      players: this.players
    })
  }

  setColor(id, r, g, b) {
    this.players[id].color = color(r, g, b);
    print(this.players[id].id + " color added.");
  }
  //Not used currently
  // setName(id, name) {
  //   this.players[id].name = name
  //   print(this.players[id].id + " name added.");
  // }
  remove(id) {
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
    if (game.numPlayers === 0) return
    y += 30;
    
    //Sorting the players by their lives
    var sortedPlayers = Object.keys(game.players).map(function (key) {
      return [key, game.players[key].lives, game.players[key].name]
    });
    sortedPlayers.sort(function (a, b) {
      return b[1] - a[1];
    });

    for (var player of sortedPlayers) {
      var id = player[0]
      if (this.players[id].lives > 0) {
        fill(this.players[id].color);
        text(this.players[id].name, x, y);
        text(this.players[id].lives, x + 130, y)
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
