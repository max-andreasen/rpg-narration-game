# rpg-narration-game

## Set-up
How to set up localhost

### Set-up client / frontend
cd frontend
npm run dev

## Set-up backend
fastapi dev ./backend/main.py
or
cd backend
fastapi dev main.py

## The program
How the program works, architechture etc. 

### Backend
Main.py defines the routes / endpoints, which provides information to the frontend. 
A very basic session is kept as a class instance running locally on the backend server (currently, therefore not persistent session). 
The session keeps track of user IDs and user messages for each turn. The user ID is returned to the client for further use. 

The client can call the websocket endpoint to connect to the game. Using the websocket endpoint, the client receives messages directly from the server. 

### Frontend 
Hook up the client to the backend and join the session. 
Also call the websocket endpoint to establish a websocket connection, needed for the game. 
