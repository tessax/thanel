import os

valid_path = "thanel/valid"
invalid_path = "thanel/invalid"

valid_images = len([
    f for f in os.listdir(valid_path)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
])

invalid_images = len([
    f for f in os.listdir(invalid_path)
    if f.lower().endswith((".jpg", ".jpeg", ".png"))
])

print("Valid images:", valid_images)
print("Invalid images:", invalid_images)
