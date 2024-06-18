from dotenv import load_dotenv
import os
import requests
import pandas as pd

load_dotenv()
connection_string = os.getenv('mongoDBURL')
PORT = os.getenv('PORT')
URL = f"http://localhost:{PORT}/users"

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

df = pd.DataFrame(users)
users = df.to_dict(orient='records')

for user in users:
    response = requests.post(URL, json=user)
    print(response.json())
    

