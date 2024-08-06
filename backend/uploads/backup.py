import csv
from dotenv import load_dotenv
import os
import requests
import json

# Creating a backup CSV file with all user info just in case DB gets fucked
load_dotenv()
connection_string = os.getenv('mongoDBURL')
PORT = os.getenv('PORT')
URL = f"http://localhost:{PORT}/users"

users = requests.get(URL).json()

# Specify the path and filename for the CSV file
csv_file = ''

    
# Open the CSV file in write mode
with open(csv_file, 'w', newline='') as file:
    writer = csv.writer(file)

    # Write the header row
    writer.writerow(['Id', 'First_Name', 'Last_Name', 'Email', 'Grad_Year', 'Phone_Number', 'Birthday', 'Colleges', 'Major', 'Minor', 'Class'])  # Replace with your desired column names

    # Write each user's data as a row in the CSV file
    for user in users['data']:
        if 'PhoneNumber' not in user:
            user['PhoneNumber'] = ""
        if 'Birthday' not in user:
            user['Birthday'] = ""
            print(user['FirstName'])
        
        writer.writerow([user['_id'], user['FirstName'],user['LastName'], user['BUEmail'], user['GradYear'], user['PhoneNumber'], user['Birthday'], user['Colleges'], user['Major'], user['Minor'], user['Class']])  # Replace with the appropriate user data fields

        
    