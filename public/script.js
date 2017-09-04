var socket = io.connect();
var boardDimension = 10;
var thisPlayer = "";
var direction = { '38': 'up', '40': 'down', '37': 'left', '39': 'right'};
var pieces = {
    NONE :            {code: " "},
    gem :             {code: "\ud83d\udc8e"},
    poop :            {code: "\ud83d\udca9"},
    monster :          {code: "\ud83d\ude08"},
    pray :          {code: "\ud83d\udc8a"},
};
var playerCounter = 1;
var faces = {NONE : {name: "None",      code: " "}};

function checkPlayerCount() {
  $.post("/checkPlayerCount");
}

function setPlayername() {
    if ($("#playerNameInput").val() != "")
    {
      thisPlayer = $("#playerName").val();
      socket.emit('setPlayername', thisPlayer);
      $.post("/setPlayer", { name: thisPlayer }, function(data){
      console.log("THE PLAYER'S NAME IS: " + thisPlayer);
        // alert("okay");
        // console.log("client: " + $("#playerName").val());
      })

    }
}

function startPlay(){
  $('#leaderBoardContainer').show();
  $('#playerNameControls').hide();
  $('.header').show();
  $('.chat-interface').show();
  // $('#playerSet').hide();
  $(document).keydown(function(e){
   var key = e.keyCode;
   if(direction[key]){
     console.log(direction[key]);
     $.post("/move", { name: thisPlayer, direct: direction[key] }, function(data){
       // alert("okay");
     })
   }
  })
}

function sendMessage(){

  // get the playerMove input box, and make sure it isn't empty
  if($("#playerMove").val() != "")
  {
    socket.emit('message', $('#playerMove').val());
    addMessage("Me", $('#playerMove').val()); // add the message to our own chat
    $('#playerMove').val('') // clear text out of the message box
  }
}


// function addEncounterMessage(data){
//   socket.emit('encounter', data);
//   // $("#moveEntries").append('<div class= "encounter"><p>'  + "System: " + data['playerA'] + " vs " + data['playerB'] + '</p></div>');
//   $("#moveEntries").append('<li class="mdl-list__item encounter"><span class="mdl-list__item-primary-content">' + "System: " + data['playerA'] + " vs " + data['playerB'] + '</span></li>');
//
// }

function drawGrid(players, poops, monsters, prayers, gems) {

    var marginTop = 30,
        marginLeft = 30,
        fieldSize = 40,
        boardSize = boardDimension*fieldSize,
        row = boardDimension - 1;

    var board =[];

    var startPos = [0, row, row*boardDimension + 0, row*boardDimension + row];

    for(var i = 0; i < boardDimension*boardDimension; i++) {
        board.push({
            x: i % boardDimension,
            y: Math.floor(i / boardDimension),
            piece: 0
        });
    };

    for (var player in players){
      var code = {code: players[player].code};
      board[players[player].pos].piece = code;
    };

    poops.forEach(function(poop){
      board[poop].piece = pieces.poop;
    });

    monsters.forEach(function(monster){
      board[monster].piece = pieces.monster;
    });

    prayers.forEach(function(pray){
      board[pray].piece = pieces.pray;
    });

    gems.forEach(function(gem){
      board[gem].piece = pieces.gem;
    });

    // gem
    // board[5*boardDimension + 5].piece = pieces.gem

    var div = d3.select("#gridArea")
        .append("div")
        .attr("id","grid")
        .style("position", "relative")
        .style("top", marginTop + "px")
        .style("left", marginLeft + "px")
        .style("width", boardSize + "px")
        .style("height", boardSize + "px")
        .style("border-style", "solid")
        .style("border-width", "1px")
        .style("border-color", "white");

    var svg = div.append("svg")
         .attr("width", boardSize + "px")
         .attr("height", boardSize + "px")
         .selectAll(".fields")
         .data(board)
        .enter()
         .append("g");

    svg.append("rect")
         .style("class", "fields")
         .style("class", "rects")
         .attr("x", function (d) {
             return d.x*fieldSize;
         })
         .attr("y", function (d) {
             return d.y*fieldSize;
         })
         .attr("width", fieldSize + "px")
         .attr("height", fieldSize + "px")
         .style("fill", function (d) {
             if ( ((d.x%2 == 0) && (d.y%2 == 0)) ||
                  ((d.x%2 == 1) && (d.y%2 == 1))   )
                 return "#FFCC50";
             else
                 return "#E7E9EC";
         })
         .style("opacity", 0.3)
        .style("stroke", "white")
        .style("stroke-width", "1px");

    svg.append("text")
        .attr("x", function (d) {
            return d.x*fieldSize;
        })
        .attr("y", function (d) {
            return d.y*fieldSize;
        })
        .style("font-size", "40")
        .attr("text-anchor", "middle")
        .attr("dy", "37px")
        .attr("dx", "20px")
        .text(function (d) {
            return d.piece.code;
         });
        // .append("title")
        // .text(function(d) {
        //     return d.piece.name;
        // });

}

function eraseGrid() {
    d3.select("#grid").remove();
}

function updateStatus(update) {
  $("#emoji").text(update['emoji']);
  $("#username").text(update['username']);
  $("#hp").text("HP: " + update['hp']);
  $("#attack").text("Attack: " + update['attack']);
  $("#defense").text("Defense: " + update['defense']);
  console.log("updated!")
}

function updateLeaderboard(update) {
  console.log(update);
  $("#p1Name").text("🥇" + update[0].name);
  $("#p2Name").text("🥈" + update[1].name);
  $("#p3Name").text("🥉" + update[2].name);
  $("#p1").text("Killed " + update[0].number + " players");
  $("#p2").text("Killed " + update[1].number + " players");
  $("#p3").text("Killed " + update[2].number + " players");
}

socket.on('setPlayername', function (data) {
    socket.playerName = data;
})

// socket.on('encounter', function(data){
//   console.log('encounter data: ', data)
//   addEncounterMessage(data);
// })

socket.on('message', function(data) {
  addMessage(data['playerName'], data['message']);
})

socket.on('fight', function(data) {
  addFightMessage(data);
})

socket.on('winner', function(data){
  winnerMessage(data);
})

socket.on('dead', function(data){
  dieMessage(data['player'], data['players']);
})


socket.on('redraw', function(data){
  eraseGrid();
  drawGrid(data['playerProfile'], data['poops'], data['monsters'], data['prayers'], data['gems']);
  scrollChat();
  checkPlayerCount();
})

socket.on('updateLeaderboard', function(update){
  updateLeaderboard(update);
})

socket.on('updateStatus', function(update){
  console.log("ABOUT TO UPDATE");
  console.log("update['username'] = " + update['username']);
  console.log("thisPlayer = " + thisPlayer)
  if (update['username'] == thisPlayer) {
    updateStatus(update);
    console.log("UPDATED!!!");
  }
})

socket.on('updateSpectator', function(update){
  console.log("updating spectator...");
  spectator(update);
})

socket.on('checkPlayerCount', function (specData) {
  console.log("Received room full.");
  spectator(specData);
})

function spectator(players){
  if (!(thisPlayer in players)) {
    $('.sidebar').hide();
    $('.sidebar-spectator').show;
    $('#toAppend').empty();
    for(player in players) {
      console.log("Appending...")
      $('#toAppend').append(
        "<div class='append-container'>\
            <div id='emojiContainer'>\
              <p id='emoji' class='big-emoji'>" + players[player].code + "</p>\
            </div>\
            <div id='statusContainer'>\
                <p id='username' class='statusEntry'>" + player + "</p>\
                <p id='hp' class='statusEntry'>HP: " + players[player].hp + "</p>\
                <p id='attack' class='statusEntry'>Attack: " + players[player].attack + "</p>\
                <p id='defense' class='statusEntry'>Defense: " + players[player].defense + "</p>\
            </div>\
        </div>"
      )
    }
  }
}

socket.on('setAnotherName', function(data){
  if (data == thisPlayer) {
    setAnotherName(data);
    console.log("set another name!");
  }
})

socket.on('startPlay', function(data){
  if(data == thisPlayer){
      startPlay();
  }
})

function setAnotherName(data){
  $("#playerNameControls").append('<div id="notification"> <p>Please set another username as name <em>' + data + '</em> is taken. </p></div>');
}

function addMessage (player, move) {
  $("#moveEntries").append('<li class="mdl-list__item"><span class="mdl-list__item-primary-content">' + player + ": " + move + '</span></li>');
  $("#moveEntries-spectator").append('<li class="mdl-list__item"><span class="mdl-list__item-primary-content">' + player + ": " + move + '</span></li>');
}

function addFightMessage (message){
  $("#moveEntries").append('<li class="mdl-list__item fight"><span class="mdl-list__item-primary-content">' + message + '</span></li>');
  $("#moveEntries-spectator").append('<li class="mdl-list__item fight"><span class="mdl-list__item-primary-content">' + message + '</span></li>');
}

function winnerMessage(winner){
  for(var player in winner){
      $("#moveEntries").append('<li class="mdl-list__item winner"><span class="mdl-list__item-primary-content">' + winner[player].code + '  is Winner!!!!</span></li>');
      $("#moveEntries-spectator").append('<li class="mdl-list__item winner"><span class="mdl-list__item-primary-content">' + winner[player].code + '  is Winner!!!!</span></li>');
  }
}

function dieMessage(player, players){
      $("#moveEntries").append('<li class="mdl-list__item dead"><span class="mdl-list__item-primary-content"> ' + players[player].code + '  is DEAD </span></li>');
      $("#moveEntries-spectator").append('<li class="mdl-list__item dead"><span class="mdl-list__item-primary-content"> ' + players[player].code + '  is DEAD </span></li>');
}

$(function() {
  drawGrid({},[], [], [], []);
  $('#leaderBoardContainer').hide();
  $('.header').hide();
  $('.chat-interface').hide();
  $('.sidebar-spectator').hide;
  checkPlayerCount();
  $("#playerSet").click(function() {
    setPlayername();
    $('#notification').remove();
  });

  $("#moveSend").click(function() {
    sendMessage();
    scrollChat();
  });
})

function scrollChat() {
  $('#moveEntries').scrollTop($('#moveEntries')[0].scrollHeight);
  $('#moveEntries-spectator').scrollTop($('#moveEntries-spectator')[0].scrollHeight);
  console.log("scrolled!");
}
