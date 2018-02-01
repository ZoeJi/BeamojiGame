# Beamoji Game #

This is a web game with capacity of 4 players play together at the same time. 

We're aiming to implement this project as a non-ending game. The game allows at most 4 players at the same time, and late comers are directed into spectator mode. Each time a player's game is over, the server automatically kicks him/her into spectator mode, and opens one slot for a new player.

### Technology used:
Express, WebSockets, and MongoDB.

### See it live here: 
http://beamoji.heroku.com

### Game explained:
- Used a console to display information between server and client
- When you try to add two users with the same username in the same game (session), it rejects it and requests for you to add a new username
- Emoji locations (except players) are random and they will not appear on each other or on the players
- In the console, when monsters, poop, prayers, and diamonds are mentioned they will be represented by emojis and individual player icons will show as their player emojis
- When you attack a monster or player, a description of events of the encounter shows up on the console/chat box, showing up as 'rounds' or turn based combat.
- When a monster, diamond, prayer, or poop is stepped on/fought, it will disappear and a new emoji of the same type will appear randomly on the board.


__Worked with other team members:__

- jixxx181@umn.edu
- liux3401@umn.edu
- peces001@umn.edu
- lamxx204@umn.edu
