"use client";

import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import GameView from "../views/game";
import { GameApiContext } from "../GameAPIContext";


// Should render gameview and lobby-view. And connect the logic between the lobby and the game.
export default function GameController() {

    const api = useContext(GameApiContext);
    if (!api) throw new Error("GameApiContext not provided");
    const router = useRouter();
    
    const { chatHistory, systemMessage, sendMessage, players, hasPlayerActed } = api;

    // This means we already have all data needed here in the Controller, no need to check the form event data, we 
    // can just use the chatState to see what the user has inputted. 
    const [chatState, setChatState] = useState(""); 

    // When player hits 'act' button in chat interface
    const onSubmitPlayerMessage = (e: any) => {
        e.preventDefault();
        if (!chatState.trim()) return;
        submitPlayerMessage(chatState);
        setChatState("");
    };

    // Uses API to handle the message in history and to send to backend. 
    const submitPlayerMessage = async (actionChat: string) => {
        if (!actionChat.trim()) return;
        sendMessage("action", actionChat);
    };

    const resetGame = async () => {
        const confirmed = window.confirm("Are you sure you want to reset the game?");
        if (!confirmed) return;
        api.reset();
        router.push("/");
    }

    // Loads on mount.
    useEffect(() => {
        const savedPlayerID = localStorage.getItem("playerID");
        let savedSession = true;
        if (savedPlayerID == null || !savedPlayerID) {
            savedSession = false;
        }
        const connected = api.connected(); // if already have websocket connection.
        if (connected) {
            console.log("Player is already connected to the game");
            return;
        }
        if (savedSession) { // if player is not connected, but have a saved session in localStorage
            console.log("Reconnecting...");
            const success: boolean = api.reconnect();
            if (!success) {
                router.push("/"); // if reconnecting fails, route back to home page
                return;
            } 
            if (success) console.log(`Player ${savedPlayerID} reconnected.`);
        }
    }, [])

    return (
        <GameView
            chatHistory={chatHistory}
            systemMessage={systemMessage}
            resetGame={resetGame}
            players={players}
            chatState={chatState}
            setChatState={setChatState}
            onSubmitPlayerMessage={onSubmitPlayerMessage}
            hasPlayerActed={hasPlayerActed}
        />
    );
}