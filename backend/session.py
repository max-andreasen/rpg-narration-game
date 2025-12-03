import random


class GameSession:
    def __init__(self):
        self.players = set()
        self.messages = {}
        self.turn = 0

    def generate_player_id(self):
        if self.players:
            max_pid = max(int(pid) for pid in self.players)
            return str(max_pid + 1)
        else:
            return str(1)

    def get_players(self):
        return self.players

    def add_message(self, pid, message):
        if pid not in self.players:
            raise ValueError("Player does not exist in session..")
        if pid in self.messages.keys():
            raise Exception("DON'T SPAM PLEASE")

        self.messages[pid] = message

        if len(self.players) <= len(self.messages):
            return self.messages
        else:
            return None

    def new_turn(self):
        self.turn += 1
        self.messages = {}

    def delete_player(self, pid):
        self.players.pop(pid)

    def clear_session(self):
        self.players = set()
        self.messages = {}
        self.turn = 0


game_session = GameSession()
