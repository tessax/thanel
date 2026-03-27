from flask import Flask, request, jsonify, render_template, send_from_directory
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
DATA_FILE = "data.json"
IMG_SIZE = 224

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER): 
    os.makedirs(UPLOAD_FOLDER)

if not os.path.exists(DATA_FILE):
    with open(DATA_FILE, "w") as f:
        json.dump([], f)

import gdown

model_path = "thanel_model.h5"

if not os.path.exists(model_path):
    url = "https://drive.google.com/uc?id=1Aeiq3j6irysqOhbL_mm0U3Ig9UH4z4EQ"
    gdown.download(url, model_path, quiet=False)

model = tf.keras.models.load_model(model_path)

# ================= LOGIN =================
@app.route("/login", methods=["POST"])
def login():

    username = request.json.get("username")
    password = request.json.get("password")
    role = request.json.get("role")

    # Simple hardcoded credentials (you can change)
    credentials = {
        "uc": {"username": "ucadmin", "password": "1234"},
        "rc": {"username": "rcadmin", "password": "1234"}
    }

    if role in credentials:
        if (username == credentials[role]["username"] and
            password == credentials[role]["password"]):

            return jsonify({"success": True})

    return jsonify({"success": False, "message": "Invalid credentials"})

# ================= HOME =================
@app.route("/")
def home():
    return render_template("index.html")


# ================= UPLOAD =================
@app.route("/upload", methods=["POST"])
def upload():

    file = request.files["image"]
    name = request.form["name"]
    dob = request.form["dob"]
    unit = request.form["unit"]
    college = request.form["college"]
    plant = request.form["plant"]

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    entry = {
        "name": name,
        "dob": dob,
        "unit": unit,
        "college": college,
        "plant": plant,
        "filename": filename,
        "uploadDate": datetime.now().strftime("%Y-%m-%d"),
        "status": "pending"
    }

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    data.append(entry)

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

    return jsonify({"message": "Upload successful"})




# ================= GET ENTRIES =================
@app.route("/get_entries")
def get_entries():
    with open(DATA_FILE, "r") as f:
        return jsonify(json.load(f))

from datetime import timedelta
## ================= VERIFY =================
@app.route("/verify/<filename>", methods=["POST"])
def verify(filename):

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    img = image.load_img(filepath, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)[0][0]
    ai_valid = prediction >= 0.5

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    result = "INVALID"

    for entry in data:
        if entry["filename"] == filename:

            dob_date = datetime.strptime(entry["dob"], "%Y-%m-%d")
            upload_dt = datetime.strptime(entry["uploadDate"], "%Y-%m-%d")

            birthday_this_year = dob_date.replace(year=upload_dt.year)

            start_date = birthday_this_year - timedelta(days=10)
            end_date = birthday_this_year + timedelta(days=10)

            dob_valid = start_date <= upload_dt <= end_date

            result = "VALID" if ai_valid and dob_valid else "INVALID"
            entry["status"] = result

            break  # stop loop once found

    # ✅ Save AFTER loop
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

    return jsonify({"result": result})
# ================= APPROVE =================
@app.route("/approve/<filename>", methods=["POST"])
def approve(filename):

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    for entry in data:
        if entry["filename"] == filename:
            entry["status"] = "Approved"

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

    return jsonify({"message": "Approved"})


# ================= SERVE IMAGES =================
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


ARCHIVE_FILE = "archive.json"

@app.route("/remove/<filename>", methods=["POST"])
def remove_entry(filename):

    with open(DATA_FILE, "r") as f:
        data = json.load(f)

    with open(ARCHIVE_FILE, "r") as f:
        archive = json.load(f)

    new_data = []

    for entry in data:
        if entry["filename"] == filename:
            archive.append(entry)   # Move to archive
        else:
            new_data.append(entry)

    # Save updated main data
    with open(DATA_FILE, "w") as f:

        
        json.dump(new_data, f, indent=4)

    # Save archive
    with open(ARCHIVE_FILE, "w") as f:
        json.dump(archive, f, indent=4)

    return jsonify({"success": True})




if __name__ == "__main__":
    import os

port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port)
