
import cv2
import os

IMG_SIZE = 224
folders = ["valid", "invalid"]

for folder in folders:
    path = os.path.join(folder)
    for img_name in os.listdir(path):
        img_path = os.path.join(path, img_name)

        img = cv2.imread(img_path)
        if img is None:
            continue

        img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
        cv2.imwrite(img_path, img)

print("All images resized successfully")
