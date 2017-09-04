___API Documentation___


Use `/checkPlayerCount` to check if the current number of players in the game is equal to or more than 4. Trigger spectator mode if true.

```
curl —data ‘’ /checkPlayerCount

Use `/setPlayer` with a new username to create a new player.

```
curl -X POST -H “Content-Type:application/json” -d ‘{ name: thisPlayer }’ /setPlayer

Use `/move` with username of `thisPlayer` and one of four arrow keys to control players’ movements. 

```
curl -X POST -H “Content-Type:application/json” -d ‘{ name: thisPlayer, direct: direction[key] }’ /move

