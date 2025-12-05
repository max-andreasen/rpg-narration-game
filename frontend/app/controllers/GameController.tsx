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
    
    const { worldHistory, actionHistory, sendMessage } = api;

    // Client just sends messages. The websocket connection automatically handles responses. 
    const submitWorld = async (worldChat: string) => {
        if (!worldChat.trim()) return; // nothing inputted
        sendMessage("world", worldChat);
    };

    const submitAction = async (actionChat: string) => {
        if (!actionChat.trim()) return;
        sendMessage("action", actionChat);
    };

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
                // TODO: When having lobby, route to lobby instead?
                return;
            } 
            if (success) console.log(`Player ${savedPlayerID} reconnected.`);
        }
    }, [])

    return (
        <GameView
            worldHistory={worldHistory}
            actionHistory={actionHistory}
            submitWorld={submitWorld}
            submitAction={submitAction}
        />
    );
}