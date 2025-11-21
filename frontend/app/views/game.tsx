"use client";

import { useState, useEffect } from "react";

export default function GameView() {
    const [messages, setMessages] = useState<string[]>([]);
    const playerId = 1; // fetching from localStorage later on. Or useContext maybe.

    useEffect(() => {
        const ws = new WebSocket(`ws://localhost:8000/ws?player_id=${playerId}`);

        ws.onopen = () => console.log("Connected!");
        ws.onmessage = (event) => {
            console.log("Received:", event.data);
            setMessages(prev => [...prev, event.data]); 
        };
        ws.onerror = (err) => console.error("WebSocket error:", err);
        ws.onclose = () => console.log("WebSocket closed");

        return () => ws.close();
    }, []);

    return (
        <div>
            <h1>This is the game view</h1>
            <ul>
                {messages.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
        </div>
    );
}
