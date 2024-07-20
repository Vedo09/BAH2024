from flask import Flask, request, jsonify
import nltk
from nltk import word_tokenize, pos_tag
import requests
import pandas as pd
data = pd.read_csv("/workspaces/BAH2024/maps_v3/data_in.csv")

app = Flask(__name__)

# Initialize NLTK data
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

# Function to parse commands
def parse_command(text):
    tokens = word_tokenize(text.lower())
    tagged = pos_tag(tokens)
    command = {
        "action": None,
        "location": None,
        "layer": None
    }

    # Define keywords
    location_commands = ["find", "go", "search", "locate"]
    layer_commands = ["switch", "change", "layer"]

    # Extracting action and nouns
    for word, tag in tagged:
        if word in location_commands:
            command["action"] = "geocode"
        elif word in layer_commands:
            command["action"] = "switch_layer"
        elif tag in ["NN", "NNS", "NNP", "NNPS"]:
            if command["action"] == "geocode":
                command["location"] = word
            elif command["action"] == "switch_layer":
                command["layer"] = word

    return command

# Function to get latitude and longitude from OpenCage Geocoding API
# def get_lat_lng(location):
#     api_key = 'c7981bbbf316460e9565524340f6a3f2'  # Your OpenCage API key
#     base_url = 'https://api.opencagedata.com/geocode/v1/json'
#     params = {'q': location, 'key': api_key}
#     response = requests.get(base_url, params=params)
#     data = response.json()
    
#     if data['results']:
#         lat_lng = data['results'][0]['geometry']
#         return lat_lng['lat'], lat_lng['lng']
#     else:
#         return None, None

def get_lat_lng(noun):
  """
  This function fetches the latitude and longitude of a place.

  Args:
    noun: A string representing the name of the place.

  Returns:
    A tuple containing the latitude and longitude of the place, or None if the place is not found.
  """

  # Convert the input to lowercase.
  noun = noun.title()

  # Filter the data frame to find the row with the matching city name.
  place_data = data[data["city_ascii"] == noun]

  # If the place is not found, return None.
  if place_data.empty:
    return None

  # Extract the latitude and longitude from the data frame.
  lat = place_data["lat"].values[0]
  lng = place_data["lng"].values[0]

  # Return the latitude and longitude.
  return lat, lng


# Route to handle commands
@app.route('/process-command', methods=['POST'])
def process_command():
    data = request.get_json()
    command_text = data['command']
    parsed_command = parse_command(command_text)
    
    if parsed_command['action'] == 'geocode':
        latitude, longitude = get_lat_lng(parsed_command['location'])
        result = {
            "action": "geocode",
            "location": parsed_command['location'],
            "latitude": latitude,
            "longitude": longitude
        }
    elif parsed_command['action'] == 'switch_layer':
        result = {
            "action": "switch_layer",
            "layer": parsed_command['layer']
        }
    else:
        result = {
            "action": "None"
        }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
