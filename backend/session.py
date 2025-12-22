
class GameSession:
    def __init__(self):
        self.players = {} # id: race gender name 
        self.messages = {}
        self.turn = 0

    def _generate_player_id(self):
        if self.players:
            max_pid = max(int(pid) for pid in self.players)
            return str(max_pid + 1)
        else:
            return str(1)
        
    def add_player(self, name: str, race: str, gender: str): 
        pid = self._generate_player_id()
        player_object = {"name": name, "race": race, "gender": gender, "status": "waiting"}
        self.players[pid] = player_object
        return pid

    def set_player_status(self, pid, status):
        pid = str(pid)
        print(self.players.keys())
        if pid in self.players.keys():
            self.players[pid]["status"] = status
        else:
            print(f"Player ID {pid} was not found in players")
    
    def set_all_players_status(self, status):
        for pid in self.players:
            self.players[pid]["status"] = status

    def get_players(self):
        return self.players
    
    def get_turn(self):
        """
        Returns the current turn of the game. 
        """
        return self.turn

    def add_message(self, pid, message):
        if pid not in self.players:
            raise ValueError("Player does not exist in session..")
        if pid in self.messages.keys():
            raise Exception("DON'T SPAM PLEASE")

        self.messages[pid] = message
        self.set_player_status(pid, "action_submitted")

        if len(self.players) <= len(self.messages):
            return self.messages
        else:
            return None
        
    def get_state_for_player(pid):
        # returns the info needed for the frontend 
        return

    def new_turn(self):
        self.turn += 1
        self.messages = {}

    def delete_player(self, pid):
        self.players.pop(pid)

    def clear_session(self):
        self.players = {}
        self.messages = {}
        self.turn = 0


game_session = GameSession()
