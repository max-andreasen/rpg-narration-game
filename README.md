# rpg-narration-game

# Set-up
How to set up localhost for development and optionally an ngrok tunnel for exposing frontend to testers. 

## Env variables
Create a .env file in root directory. Then paste your mongodb connection URL as well as your OpenAI (or any other LLM tool credentials). 
```
MONGO_URL=
OPENAI_API_KEY=
```

## Install requirements
Run; 
```bash
npm i
pip install requirements.txt
```

## Set-up client / frontend
Run in CLI;
```
cd frontend
npm run dev
```

## Set-up backend
Run in CLI;
```bash
fastapi dev ./backend/main.py
```
or
```bash
cd backend
fastapi dev main.py
```

## Set up ngrok
Install ngrok on your computer and set up authentication / login. 
The ngrok set-up guide for CLI: https://dashboard.ngrok.com/get-started/setup/windows

Expose your frontend localhost with CLI command:
```bash
ngrok http 3000
```

Then copy the address from the "forwarding" field, which can be sent to players to connect.

Make sure that the backend is up and running at localhost:8000.

# The program
How the program works, architechture etc. 

## Backend


## Frontend 

