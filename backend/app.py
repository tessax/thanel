from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from datetime import datetime
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Create uploads folder if not exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Store entries temporarily (acts like database)
entries = []

# Load model
model = tf.keras.models.load_model("thanel_model.h5")
IMG_SIZE = 224


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
        "status": "Pending"
    }

    entries.append(entry)

    return jsonify({"message": "Upload successful"})


# ================= GET ENTRIES =================
@app.route("/get_entries", methods=["GET"])
def get_entries():
    return jsonify(entries)


# ================= VERIFY =================
@app.route("/verify", methods=["POST"])
def verify():

    data = request.json
    filename = data["filename"]
    dob = data["dob"]
    upload_date = data["upload_date"]

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)

    img = image.load_img(filepath, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = model.predict(img_array)[0][0]
    ai_valid = prediction >= 0.5

    dob_date = datetime.strptime(dob, "%Y-%m-%d")
    upload_dt = datetime.strptime(upload_date, "%Y-%m-%d")

    diff_days = abs((upload_dt - dob_date).days)
    dob_valid = diff_days <= 10

    result = "VALID" if ai_valid and dob_valid else "INVALID"

    return jsonify({"result": result})


# ================= SERVE IMAGES =================
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


if __name__ == "__main__":
    app.run(debug=True)