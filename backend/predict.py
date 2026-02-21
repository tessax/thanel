import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model("thanel_model.h5")

IMG_SIZE = 224
TEST_FOLDER = "test_images"

for img_name in os.listdir(TEST_FOLDER):
    if img_name.lower().endswith((".jpg", ".jpeg", ".png")):
        img_path = os.path.join(TEST_FOLDER, img_name)

        img = image.load_img(img_path, target_size=(IMG_SIZE, IMG_SIZE))
        img_array = image.img_to_array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        pred = model.predict(img_array)[0][0]

        if pred >= 0.5:
            print(f"{img_name} → VALID ({pred:.2f})")
        else:
            print(f"{img_name} → INVALID ({1-pred:.2f})")
