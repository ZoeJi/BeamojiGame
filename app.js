var MongoClient = require('mongodb').MongoClient;
var mongoURI = 'mongodb://127.0.0.1:27017/beamoji';
if(process.env.MLAB_USERNAME_BEAMOJI) {
  var username = process.env.MLAB_USERNAME_BEAMOJI;
  var password = process.env.MLAB_PASSWORD_BEAMOJI;
  mongoURI = 'mongodb://' + username + ':' + username + '@ds121464.mlab.com:21464/heroku_pjnh0n71';
}

MongoClient.connect(mongoURI, function(err, db){
  if (err) {
    throw err;
  }
  else {
		    console.log('Successfully connected to database');

        var express = require('express');
        var app = express();

        // TO-DO: sync boardDimension value on server and client.
        var boardDimension = 10; // for test
        var row = boardDimension - 1; // for test
        var playerCounter = 1;

        var playerProfile = {};
        var findPlayer = {};
        var findMonster = {};
        var monsterProfile = {};
        var direction = { 'up': -boardDimension, 'down': boardDimension, 'left': -1, 'right': 1};
        var startPos = { '1': 0, '2': row, '3': row*boardDimension + 0, '4': row*boardDimension + row};
        var faces = {'1': "\ud83d\ude1c", '2': "\ud83d\ude02", '3': "\ud83d\ude31", '4': "\ud83d\ude44"}
        var availableProfile = {};

        var poopSet = new Set();
        var playerSet = new Set();
        var monsterSet = new Set();
        var praySet = new Set();
        var gemSet = new Set();

        var attack = 10;
        var defense = 10;
        var hp = 10;


        // initialize and random place poops in grid
        for(var i = 0; i < Math.floor(boardDimension/3); i++){

          var k = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          var l = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          var m = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);

          monsterSet.add(k);
          praySet.add(l);
          gemSet.add(m);
          findMonster[i] = k;
          monsterProfile[k] = {pos: k, attack : Math.floor((Math.random() * 15) + 1), defense : Math.floor((Math.random() * 15) + 1), hp : 10};
        }

        for(var i = 0; i < Math.floor(boardDimension); i++){
          var j = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);

          poopSet.add(j);
        }

        app.use(express.static('public')) // We will want this later
        app.set('view engine', 'ejs')

        app.get('/', function(req, res){
            res.sendFile( __dirname + '/' + 'index.html' );
        })

        var bodyParser = require('body-parser');
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        app.post('/move', function(req, res) {
          res.json({
            'success' : true,
          });
          var direct = req.body.direct;
          var player = req.body.name;
          var current;

          // do things below only this user exist
          if(player in playerProfile){
            // playerSet.delete(playerProfile[player].pos);
            // delete findPlayer[playerProfile[player].pos];
            current = determineConstraint(playerProfile[player].pos, direction[direct]);
            // console.log("poopSet: ", poopSet);
            // console.log("monsterSet: ", monsterSet);
            // console.log("praySet: ", praySet);
            // console.log("playerSet: ", playerProfile);
            // console.log("monsterProfile: ", monsterProfile);

            //----------CODE IF ENCOUNTERS WITH POOP (POTION)---------------
            if(poopSet.has(current)){
              poopSet.delete(current);
              newPoop();
              var newDefense = playerProfile[player].defense - 4;
          	  playerProfile[player].defense = newDefense;

              /*
               db.collection('poops').insertMany(playerProfile, function(err, result){
                   if(err) console.log(err);
                   else console.log('Documents inserted successfully');
               });
               */

              /*
               var insertDocument = function(db, callback) {
               db.collection('poops').insertOne( {
                 playerProfile
               }, function(err, result) {
                   assert.equal(err, null);
                   console.log("Inserted a document into the restaurants collection.");
                   callback();
                 });
               };
             */

            // var playerInsertionPoops = player
             //db.collection('playerEatsPoop').insert({playerInsertionPoops});
              //    --------QUERY-------
            /* db.getCollection('playerEatsPoop').count({playerInsertionPoops: {
              "player" : "zoo"
              }})
              */

              var eatPoop = playerProfile[player].code + ' eat a ' + '\ud83d\udca9';
              io.sockets.emit('fight', eatPoop);
              playerMove(player, current);
            }

            //----------CODE IF ENCOUNTERS WITH GEM (POTION)---------------
            if(gemSet.has(current)){
              gemSet.delete(current);
              newGem();
              var newDefense = playerProfile[player].defense + 3;
          	  playerProfile[player].defense = newDefense;

              var eatGem = playerProfile[player].code + ' eat a ' + '\ud83d\udc8e';
              io.sockets.emit('fight', eatGem);
              playerMove(player, current);
            }

            //----------CODE IF ENCOUNTERS WITH MONSTER---------------
            else if(monsterSet.has(current)){

            var round = 0;

            var mes1 = playerProfile[player].code + " vs " + "\ud83d\ude08" + "--- starts FIGHTING";
            io.sockets.emit('fight', mes1);

            while (playerProfile[player].hp>0 && monsterProfile[current].hp>0){
                round++;
                // console.log("player.hp: ", playerProfile[player].hp)
                // console.log("monster.hp: ", monsterProfile[current].hp)
                // console.log("in")
                var mes2 = '-------- round: ' + round + '------- <br><br>';
                io.sockets.emit('fight', mes2);

              if((playerProfile[player].attack - monsterProfile[current].defense) > 0){
                monsterProfile[current].hp = monsterProfile[current].hp - (playerProfile[player].attack - monsterProfile[current].defense);
                // console.log("attack player greater than defense monster")
                // console.log(monsterProfile[current].hp)
                var mes3 = playerProfile[player].code + ' HP: ' + playerProfile[player].hp + '<br>';
                var mes4 = "\ud83d\ude08" + ' HP: ' + monsterProfile[current].hp + '<br>'
                io.sockets.emit('fight', mes3);
                io.sockets.emit('fight', mes4);
              }
              else{/*WHY WHEN IT ENTERS HERE IT DOES NOT CONTINUE EVALUATING THE OTHER CONDITIONS!!!!!!*/
                // console.log("attack player less than defense monster")

                var mes4 = playerProfile[player].code + ' could not attack' + "\ud83d\ude08" + '<br>';
                io.sockets.emit('fight', mes4);

              }

              if((monsterProfile[current].attack - playerProfile[player].defense) > 0){
                playerProfile[player].hp = playerProfile[player].hp - (monsterProfile[current].attack - playerProfile[player].defense);
                // console.log("attack monster greater than defense player")
                // console.log(playerProfile[player].hp)
                var mes5 = playerProfile[player].code + ' HP: ' + playerProfile[player].hp + '<br>' ;
                var mes6 = "\ud83d\ude08" + ' HP: ' + monsterProfile[current].hp + '<br>';
                io.sockets.emit('fight', mes5);
                io.sockets.emit('fight', mes6);
              }
              else{/*WHY WHEN IT ENTERS HERE IT DOES NOT CONTINUE EVALUATING THE OTHER CONDITIONS!!!!!!*/
                // console.log("attack monster less than defense player")
                var mes6 = "\ud83d\ude08 could not attack" + playerProfile[player].code + '<br>';
                io.sockets.emit('fight', mes6);
              }


              if((playerProfile[player].attack - monsterProfile[current].defense) <= 0 && (monsterProfile[current].attack - playerProfile[player].defense) <= 0){
                // console.log("they cannot hurt each other, had to finish!!")
                var mes7 = 'They cannot hurt each other!!<br>';
                io.sockets.emit('fight', mes7);
                break;
              }
              if((monsterProfile[current].attack == playerProfile[player].defense)){
                // console.log("attack monster equals than defense player")
                /*var mes8 = 'Attack monster equals than defense player<br>';
                io.sockets.emit('fight', mes8);*/


              }
              if((playerProfile[player].attack == monsterProfile[current].defense)){
                // console.log("attack player equals than defense monster")
              }
            }

            if(playerProfile[player].hp <= 0){
              die(player);
              // console.log("player :", player,"is dead")
              // console.log(playerProfile[player])
            }

            if(monsterProfile[current].hp <= 0){
              monsterSet.delete(current);
              delete monsterProfile[current];
              delete findMonster[current];
              playerProfile[player].hp = playerProfile[player].hp + 5;
              // console.log("monster: ",current," is dead")
              newMonster();

            // var playerInsertionMonster = {"player": player}
             //db.collection('playerKillsMonster').insert({playerInsertionMonster});
            /* db.collection('playerKillsMonster').count({playerInsertionMonster: {
                 "player" : "zoo"
               }})*/

              var mes4 = '******* \ud83d\ude08 dead ************';
              io.sockets.emit('fight', mes4);
            }
          }

            //----------CODE IF ENCOUNTERS WITH PRAYER (SWORD)---------------
            else if(praySet.has(current)){
          	// console.log(player,"LET´S PRAY BITCHES");
          	praySet.delete(current);
          	// console.log(praySet);
            newPray();

          	var newAttack = playerProfile[player].attack + 4;
          	playerProfile[player].attack = newAttack;

            //var playerInsertionPray = player
            //db.collection('playerPrays').insert({playerInsertionPray});
            /*
            db.getCollection('playerPrays').count({playerInsertionPray: {
            "player" : "po"
            }})
            */

            var eatPray = playerProfile[player].code + ' eat a ' + '\ud83d\udc8a';
            io.sockets.emit('fight', eatPray);

            playerMove(player, current);
            }

            //----------CODE IF ENCOUNTERS WITH ANOTHER PLAYER---------------
            else if(playerSet.has(current) && current != playerProfile[player].pos){
              var fighter = findPlayer[current];

              // console.log(player,"---- starts FIGHTING");
              var mes1 = playerProfile[player].code + " vs " + playerProfile[fighter].code + "---- starts FIGHTING";
              io.sockets.emit('fight', mes1);

              var round = 0;

              if((playerProfile[player].attack - playerProfile[fighter].defense) > 0 || (playerProfile[fighter].attack - playerProfile[player].defense)> 0){
                while (playerProfile[player].hp > 0 && playerProfile[fighter].hp > 0){
                  round++;
                  // console.log("entro")
                  if((playerProfile[player].attack - playerProfile[fighter].defense) > 0){
                  playerProfile[fighter].hp = playerProfile[fighter].hp - (playerProfile[player].attack - playerProfile[fighter].defense);
                  }
                  if((playerProfile[fighter].attack - playerProfile[player].defense) > 0){
                  playerProfile[player].hp = playerProfile[player].hp - (playerProfile[fighter].attack - playerProfile[player].defense);
                  }
                  // console.log('round: ', round, '| new player hp: ', playerProfile[player].hp)
                  // console.log('round: ', round, '| new fighter hp: ', playerProfile[fighter].hp)
                  var mes2 = '-------- round: ' + round + '------- <br><br>';
                  var mes3 = playerProfile[player].code + ' HP: ' + playerProfile[player].hp;
                  var mes4 = playerProfile[fighter].code + ' HP: ' + playerProfile[fighter].hp;
                  io.sockets.emit('fight', mes2);
                  io.sockets.emit('fight', mes3);
                  io.sockets.emit('fight', mes4);
                }

                var looser = '';
                if((playerProfile[player].hp - playerProfile[fighter].hp)>0){
                  // console.log('******* ', fighter, ' dead ************')

                  var playerInsertionPlayer = player
                  db.collection('playerPlay').insert({playerInsertionPlayer});

                 /*
                 db.getCollection('playerPlay').count({playerInsertionPlayer: {
                 "player" : "blibebe"
                  }})
                 */
                  die(fighter);
                }
                else if((playerProfile[player].hp - playerProfile[fighter].hp)<0){
                  // console.log('******* ', playerProfile[player], ' dead ************')
                  var playerInsertionFighter = fighter
                   db.collection('playerFight').insert({playerInsertionFighter});

                   /*
                   db.getCollection('playerFight').count({playerInsertionFighter: {
                   "player" : "alibaba"
                    }})
                   */
                  die(player);
                }
                else{
                  // console.log('******* both dead *******')
                  // console.log('playerProfile', playerProfile);
                  die(player);
                  die(fighter);
                }
              }
              else {
                // console.log('******* both survive *******')
                var mes6 = '******* both survive *******';
                io.sockets.emit('fight', mes6);
                // console.log('playerProfile: ', playerProfile)
              }
            }
            else{
              playerMove(player, current);
            }

            if(typeof playerProfile[player] != 'undefined'){
                // playerSet.add(playerProfile[player].pos);
                // update player status box
                var update = { 'emoji' : playerProfile[player].code, 'username' : player, 'hp' : playerProfile[player].hp, 'attack' : playerProfile[player].attack, 'defense' : playerProfile[player].defense };
                io.sockets.emit('updateStatus', update);
            }

            // console.log(playerSet);
            // console.log("current: " + playerProfile[player].pos);
            redraw();
          }

          // winnerCheck();
        });

        // TO-DO: use database to save chat history

        app.post('/setPlayer', function(req, res) {
          res.json({
            'success' : true,
          });
          var playerName = req.body.name;

          // do not allow two players have same username
          if(playerName in playerProfile){
            var data = playerName;
            io.sockets.emit('setAnotherName', data);
          }
          else {
            io.sockets.emit('startPlay', playerName);
            if (playerCounter < 5) {
              playerProfile[playerName] = {pos : startPos[playerCounter], attack : 10, defense : 10, hp : 10, code: faces[playerCounter]};
              playerSet.add(startPos[playerCounter]);
              findPlayer[startPos[playerCounter]] = playerName;
            } else {
              playerProfile[playerName] = {pos : availableProfile[Object.keys(availableProfile)[0]].pos, attack : 10, defense : 10, hp : 10, code : availableProfile[Object.keys(availableProfile)[0]].code }
              playerSet.add(availableProfile[Object.keys(availableProfile)[0]].pos);
              findPlayer[availableProfile[Object.keys(availableProfile)[0]].pos] = playerName;
              delete availableProfile[Object.keys(availableProfile)[0]];
            }
            // console.log(findPlayer);
            playerCounter++;
            if (playerCounter > 4) {
              playerCounter == 5;
            }
            // console.log(playerSet);
            // console.log(playerProfile);
            redraw();

            updateStatus(playerName);
          }
        })

        function updateStatus(playerName){
          var initialStatus = { 'emoji' : playerProfile[playerName].code, 'username' : playerName, 'hp' : playerProfile[playerName].hp, 'attack' : playerProfile[playerName].attack, 'defense' : playerProfile[playerName].defense };
          io.sockets.emit('updateStatus', initialStatus);
        }


        function die(player){
            var data = { 'player': player, 'players': playerProfile};
            io.sockets.emit('dead', data);

            updateStatus(player);
            io.sockets.emit('updateSpectator', playerProfile);

            availableProfile[player] = { 'pos': playerProfile[player].pos, 'code' : playerProfile[player].code };

            playerSet.delete(playerProfile[player].pos);
            delete findPlayer[playerProfile[player].pos];
            delete playerProfile[player];
        }

        function playerMove(player, current){
            playerSet.delete(playerProfile[player].pos);
            delete findPlayer[playerProfile[player].pos];

            playerSet.add(current);
            playerProfile[player].pos = current;
            findPlayer[current] = player;
        }

        function winnerCheck(){
          if(Object.keys(playerProfile).length == 1){
            io.sockets.emit('winner', playerProfile);
            for(var player in playerProfile){
              die(player);
            }
          }
        }

        function newPoop(){
          var j = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          poopSet.add(j);
        }

        function newMonster(){
          var k = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          monsterSet.add(k);
          findMonster[i] = k;
          monsterProfile[k] = {pos: k, attack : Math.floor((Math.random() * 15) + 1), defense : Math.floor((Math.random() * 20) + 1), hp : 10};
        }

        function newPray(){
          var l = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          praySet.add(l);
        }

        function newGem(){
          var j = Math.floor((Math.random() * (Math.pow(boardDimension,2) - 2*boardDimension - 1)) + boardDimension);
          gemSet.add(j);
        }

        function redraw(){
          var data = { 'playerProfile' : playerProfile, 'poops': Array.from(poopSet.keys()) , 'monsters': Array.from(monsterSet.keys()), 'prayers': Array.from(praySet.keys()), 'gems': Array.from(gemSet.keys())}
          io.sockets.emit('redraw', data);
        }

        function dbquery(){
          var sol = {};
          sol[0] = { 'name': "NA", 'number': "0"};
          sol[1] = { 'name': "NA", 'number': "0"};
          sol[2] = { 'name': "NA", 'number': "0"};

            var a = db.collection('playerPlay').aggregate(([
            {"$group" : {_id:"$playerInsertionPlayer", count:{$sum:1}}}
            , {$sort:{"count":-1}}
          ]), function (err, result){
            if(err){
              console.log(err);
            }
             else{
              //  console.log(result);
             }

             for(var player in result){
               if(player<3){
                 sol[player] = { 'name': result[player]._id, 'number': result[player].count};
                //  console.log(sol);
               }
             }
          });

          return sol;
        }

        app.post('/checkPlayerCount', function(req, res){
          res.json({
            'success' : true,
          });
          if(Object.keys(playerProfile).length > 3){
            io.sockets.emit('checkPlayerCount', playerProfile);
            console.log("Room is full!!!");
          }

          var leader = dbquery();
            var sol = {};
              var a = db.collection('playerPlay').aggregate(([
              {"$group" : {_id:"$playerInsertionPlayer", count:{$sum:1}}}
              , {$sort:{"count":-1}}
            ]), function (err, result){
              if(err){
                console.log(err);
              }
               else{
                //  console.log(result);
               }
               for(var player in result){
                 if(player<3){
                   sol[player] = { 'name': result[player]._id, 'number': result[player].count};
                  //  console.log(sol);
                 }
               }
              io.sockets.emit('updateLeaderboard', sol);
            });

        })

        function determineConstraint(current, pos){
          if(pos == -1){
            if(current %  boardDimension == 0){
              return current;
            }
          }
          else if (pos == 1){
            if(current % boardDimension == boardDimension - 1) {
              return current;
            }
          }
          else if (pos == -boardDimension) {
            if(Math.floor(current/boardDimension) == 0) {
              return current;
            }
          }
          else if (pos == boardDimension ) {
            if(Math.floor(current/boardDimension) == (boardDimension - 1)) {
              return current;
            }
          }
          current = +current + +pos;
          // console.log(current);
          return current;
        }


        var port = process.env.PORT || 3000; // For when we deploy to Heroku
        var server = app.listen(port);

        // setup sockets
        var io = require('socket.io').listen(server);
        io.sockets.on('connection', function (socket) {
            redraw();

            socket.on('setPlayername', function (data) {
                socket.playerName = data;
            })
            socket.on('message', function (message) {
              var data = { 'message' : message, 'playerName': socket.playerName }
              socket.broadcast.emit('message', data);
            })
            socket.on('disconnect', function() {
              // playerCounter = 1;
            })
        })

  }
})
