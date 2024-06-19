from dotenv import load_dotenv
import os
import requests
import json

load_dotenv()
connection_string = os.getenv('mongoDBURL')
PORT = os.getenv('PORT')
URL = f"http://localhost:{PORT}/users"

f = open('users.json');
users = json.load(f)

supers = ["thomasyousef", "tyrobison", "johnkim", "evanlapid", "timmccorry"]
eboard = ["yanapathak", "ryanchase", "sethculberson", "ryancheng", "amandaatlas", "fynnbuesnel", "jenniferji", "joshleeds", "cooperhassman", "nikkinemerson", "juliaflynn", "rohanhegde"]

for user in users:
    user['College'] = user['College'].split(", ")
    user['Colleges'] = user['College'].pop()
    user['Major'] = user['Major'].split(", ")
    user['Minor'] = user['Minor'].split(", ")
    user['FirstName'] = user['FirstName'].strip()
    user['LastName'] = user['LastName'].strip()

    fullName = user['FirstName'].lower() + user['LastName'].lower()
    if(fullName in supers):
        user['Position'] = 4
    elif(fullName in eboard):
        user['Position'] = 3
    else:
        user['Position'] = 2
    
    response = requests.post(URL, json=user)
    if(not response.status_code == 200):
        print(response.content)

'''
users = {
    "BUEmail": ["johndoe@bu.edu", "sammysmith"],
    "FirstName": ["John", "Sammy"],
    "LastName": ["Doe", "Smith"],
    "PhoneNumber": ["123-456-7890", "098-765-4321"],
    "GradYear": ["1999", "2000"],
    "Colleges": [["college 1", "college 2"], ["college 3", "college 4"]], 
    "Major": [["Data Science"], ["Computer Science"]],
    "Minor": [["Business"], ["Math"]],
    "Birthday": ["year-month-day", "year-month-day"],
    "Position": ["0", "0"],
}
'''

    

