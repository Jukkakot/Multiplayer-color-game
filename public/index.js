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

let interactButton = null;
const tickrate = 1000

// Initialize Game related variables
let playerColor;
let playerColorDim;

//Dom elements
let joinInput
let joinButton
let joinName
let nameButton
let rX, rY, rW, rH
let roundColor
let hasSentName = false
let buttonWasPressed
// <----
function endRound() {
  sendData("roundresult", {
    roundColor: roundColor,
    buttonPressed: buttonWasPressed
  })
  roundColor = color(0,0,0)
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
  // Client setup here. ---->

  // gui = createGui();
  joinName = createInput();
  nameButton = createElement('button', "start");
  joinName.hide()
  nameButton.hide()

  // setupUI();
  // setPlayerColors();
  drawButton()
  joinInput = createInput("test");

  joinInput.position(width / 2 - joinInput.width * 1.3, height / 3);
  joinInput.size(width / 2, 80)
  joinInput.style('font-size', "40px");
  joinInput.attribute('placeholder', "Room id");
  // joinInput.attribute('type', "text");



  joinButton = createElement('button', "join");
  joinButton.position(joinInput.x, joinInput.y + joinInput.height)
  joinButton.size(joinInput.width / 2, joinInput.height)
  joinButton.style('font-size', "40px");
  // joinButton.style("background-color", color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2]))
  // joinButton.attribute('type', "submit");
  joinButton.mousePressed(() => {
    if (joinInput.value() !== "") {
      window.location.href = "?=" + joinInput.value()
    }
  })
  // colorMode(HSB)
  roundColor = color(0,0,0)
  
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}
function playerNameGui() {

  joinName.position(width / 2 - joinName.width / 2, height / 3);
  joinName.size(width / 2, 80)
  joinName.style('font-size', "30px");
  joinName.attribute('placeholder', "Player name");
  push()
  fill(200);
  textSize(40);
  text("Setup player name (Optional)", joinName.x, joinName.y - joinName.height)
  pop()
  nameButton.position(joinName.x, joinName.y + joinName.height)
  nameButton.size(joinName.width / 2, joinName.height)
  nameButton.style('font-size', "40px");
  nameButton.attribute('type', "submit");
  // nameButton.style("background-color", color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2]))
  nameButton.mousePressed(nameButtonPress)
  joinName.show()
  nameButton.show()
}
function nameButtonPress() {
  // var name = joinName.value()
  if (joinName.value() !== "") {
    sendData("playername", {
      name: joinName.value()
    })
  }
  hasSentName = true
  joinName.remove()
  nameButton.remove()
  interactButton.show()
}
function draw() {
  background(0);
  
  if (isClientConnected(display = true)) {
    if (joinInput || joinButton) {
      joinInput.remove()
      joinButton.remove()
      
    }
    if(buttonWasPressed){
      interactButton.hide()
    } else {
      interactButton.show()
    }
    if (!hasSentName) {
      playerNameGui()
      interactButton.hide()
    } else {
      interactButton.style("background-color", color(playerColor.levels[0], playerColor.levels[1], playerColor.levels[2]))
      
      //push()
      fill(color(roundColor.levels))
      rect(rX, rY, rW, rH)
      //pop()
    }




    // Client draw here. ---->



    // <---
  }
}

// Messages can be sent from a host to all connected clients
function onReceiveData(data) {
  // Input data processing here. --->

  if (data.type === 'timestamp') {
    print(data.timestamp);
  }
  else if (data.type === 'playercolor') {
    console.log("playercolor", id, data)
    if (data.playerId === id) {
      playerColor = data.color
    }
  }
  else if (data.type === 'gameroundStart') {
    // colorMode(HSB);
    startRound(data.roundColor)
    // setTimeout(function () {
    //   endRound()
    // }, tickrate);
    // colorMode(RGB);
  }
  else if (data.type === 'gameroundEnd') {
    // colorMode(HSB);
    endRound()
    // setTimeout(function () {
      
    // }, tickrate);
    // colorMode(RGB);
  }  
  // <----

  /* Example:
     if (data.type === 'myDataType') {
       processMyData(data);
     }

     Use `data.type` to get the message type sent by host.
  */
}

////////////
// GUI setup
function drawButton() {
  // Temp variables for calculating GUI object positions
  let bX, bY, bW, bH;

  // Rudimentary calculation based on portrait or landscape 

  bX = 0.05 * width;
  bY = 0.75 * height;
  bW = 0.9 * width;
  bH = 0.2 * height;

  rX = 0.05 * width;
  rY = 0.05 * height;
  rW = 0.9 * width;
  rH = 0.9 * width;

  interactButton = createButton("Interact");
  interactButton.position(bX, bY)
  interactButton.size(bW, bH)
  interactButton.style('font-size', "40px");

  interactButton.hide()
  interactButton.mousePressed(onButtonPress)}
 



// ////////////
// // Input processing

function onButtonPress() {
  buttonWasPressed = true
  console.log("pressed")
}

/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
  // do some stuff
  return false;
}