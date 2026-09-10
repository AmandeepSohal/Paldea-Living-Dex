from flask import Flask, render_template
import json
import os

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(BASE_DIR, "pokedex.json")

with open(json_path, "r", encoding="utf-8") as file:
    pokedex = json.load(file)

@app.route("/")
def home():
    return render_template("Paldea.html", pokedex=pokedex)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
