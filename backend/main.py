
"""
Create the FastAPI app
Include the router. 
Initialize DB connections. 

(might want to refactor into seperate game file?)
When user sends a request for a response from the narrator,
this file handles the flow. Calls the narrator.py (model), 
uses that output as a response to the clients. Also calls
the other model (state_management.py) which handles the states. 
"""