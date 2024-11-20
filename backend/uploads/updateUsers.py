import csv
from dotenv import load_dotenv
import os
import requests
import json

load_dotenv()
connection_string = os.getenv('mongoDBURL')
PORT = os.getenv('APP_PORT')
URL = f"https://api-pq35yjnshq-uc.a.run.app/users"

users = requests.get(URL).json()

pledges = [user for user in users['data'] if user['Position'] == 1]

for pledge in pledges:
    pledge['Position'] = 2

for pledge in pledges:
    response = requests.put(f"{URL}/{pledge['_id']}", json=pledge)
    if response.status_code != 200:
        print(f"Failed to update user {pledge['_id']}: {response.text}")