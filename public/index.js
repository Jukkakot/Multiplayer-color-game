/*
p5.multiplayer - CLIENT

This 'client' sketch is intended to be run in either mobile or 
desktop browsers. It sends a basic joystick and button input data 
to a node server via socket.io. This data is then rerouted to a 
'host' sketch, which displays all connected 'clients'.

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

let interactButton
const tickrate = 100
var speed = 8
let playerColor;
let playerName;
let playerColorDim;
let players = {}
let joinInput
let joinButton
let joinName
let nameButton
let rX, rY, rW, rH
let roundColor
let hasSentName = false
let buttonWasPressed
let gameHasStarted = false

function endRound() {
  sendData("roundresult", {
    roundColor: roundColor,
    buttonPressed: buttonWasPressed
  })
  roundColor = color(0, 0, 0)
  buttonWasPressed = false
  redraw()
}

function startRound(color) {
  roundColor = color
  buttonWasPressed = false
  redraw()
}
function preload() {
  setupClient();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  buttonWasPressed = false
  gui = createGui();
  roundColor = color(0, 0, 0)
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}
// function playerNameGui() {

//   joinName.position(width / 2 - joinName.width / 2, height / 3);
//   joinName.size(width / 2, 80)
//   joinName.style('font-size', "30px");
//   joinName.attribute('placeholder', "Player name");
//   push()
//   fill(200);
//   textSize(40);
//   text("Setup player name (Optional)", joinName.x, joinName.y - joinName.height)
//   pop()
//   nameButton.position(joinName.x, joinName.y + joinName.height)
//   nameButton.size(joinName.width / 2, joinName.height)
//   nameButton.style('font-size', "40px");
//   nameButton.attribute('type', "submit");
//   nameButton.mousePressed(nameButtonPress)
//   joinName.show()
//   nameButton.show()
// }
// function nameButtonPress() {
//   if (joinName.value() !== "") {
//     sendData("playername", {
//       name: joinName.value()
//     })
//   }
//   hasSentName = true
//   joinName.remove()
//   nameButton.remove()
//   interactButton.show()
// }
function draw() {
  background(0);

  if (isClientConnected(display = true)) {
    drawGui();
    if (gameHasStarted && Object.keys(players).length === 0) {
      fill(0)
      rect(rX, rY, rW, rH)
      push()
      fill(255)
      textSize(100)
      textAlign(CENTER)
      text("Game ended!", width / 2, 200)
      pop()
      noLoop()
    } else if (Object.keys(players).length !== 0) {
      if (players[id] !== undefined) {
        fill(color(roundColor.levels))
        rect(rX, rY, rW, rH)
      } else {
        push()
        fill(255)
        textSize(100)
        textAlign(CENTER)
        text("You lost", width / 2, 200)
        printPlayerIds(width / 2, 200)
        pop()
        return
      }
      printPlayerIds(30, 10)
    }
  }
}
function printPlayerIds(x, y) {
  push();
  noStroke();
  fill(255);
  textSize(30);
  if (players === undefined) return
  y += 30;

  var sortedPlayers = Object.keys(players).map(function (key) {
    return [key, players[key].lives, players[key].name]
  });
  sortedPlayers.sort(function (a, b) {
    return b[1] - a[1];
  });
  push()
  fill(255)
  textSize(40)
  textAlign(CENTER)
  text("round:" + players[sortedPlayers[0][0]].roundCount + " speed: " + speed * tickrate + " ms", width / 2, 50)
  pop()

  for (var player of sortedPlayers) {
    var tempId = player[0]

    if (players[tempId].lives > 0) {

      fill(color(players[tempId].color.levels[0], players[tempId].color.levels[1], players[tempId].color.levels[2]));
      if (tempId === id) {
        text(">", x - 20, y)
      }
      text(players[tempId].name, x, y)
      text(players[tempId].lives, x + 130, y)
      if (tempId === id) {
        text("<", x + 150, y)
      }

      y += 30;
    }
  }

  pop();
}

function onReceiveData(data) {
  if (data.type === 'timestamp') {
    print(data.timestamp);
  }
  else if (data.type === 'playercolor') {
    console.log("playercolor", id, data)
    players = data.players
    if (data.playerId === id) {
      playerColor = data.color
      playerName = data.name
      setupUI()
    }
  }
  else if (data.type === 'gameroundStart') {
    gameHasStarted = true
    players = data.players
    if (players[id] !== undefined && players[id].roundCount % 5 === 0 && players[id].roundCount !== 0) {
      speed--
    }
    startRound(data.roundColor)
    setTimeout(function () {
      endRound()
    }, tickrate * speed);
  }
  else if (data.type === "result") {
    players = data.players
  }
}
function setupUI() {
  let bX, bY, bW, bH;

  bX = 0.05 * width;
  bY = 0.75 * height;
  bW = 0.9 * width;
  bH = 0.2 * height;


  rX = bX + bW * 0.15;
  rY = bY - bH * 0.1;
  rW = bW - bW * 0.3;
  rH = bH * -3;

  button = createButton(playerName, bX, bY, bW, bH);
  button.setStyle({
    textSize: 40,
    fillBg: color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2], 150),
    fillBgHover: color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2]),
    fillBgActive: color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2]),
    rounding: 50
  });
  button.onPress = onButtonPress;
}

function onButtonPress() {
  buttonWasPressed = true
  console.log("pressed")
}

function touchMoved() {
  return false;
}