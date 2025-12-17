export interface Race {
  id: "human" | "orc" | "elf";
  label: string;
  prefix: string;
}

export interface Gender {
  id: "m" | "f";
  label: string;
}

export interface Player {
  id: string;
  name: string;
  race: string;
  gender: string;
  status: "waiting" | "action_submitted" | "narrator_thinking";
}

// Primarily used for frontend, e.g. what is kept in the states. 
// This is then mapped onto the chat box.
export type ChatMessage = {
  sender: string; // player id (as string) or "narrator"
   // type: "action" | "question" | "narration" // TODO: Might want to add "jibberish", or "trash" to type
  message: string; 
  race: string | null;
  gender: string | null;
  name: string | null;
  createdAt?: number; // timestamp to be able to sort messages vertically
  status?: "loading" 
};
