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
}

export type Message = {
  sender: string; // player id or "narrator"
  message: string;
  race: string | null;
  gender: string | null;
  name: string | null;
  createdAt?: number;
};
