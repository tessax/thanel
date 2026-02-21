from tensorflow.keras.preprocessing.image import ImageDataGenerator

datagen = ImageDataGenerator(rescale=1./255)

generator = datagen.flow_from_directory(
    "thanel",          # 👈 ONLY dataset folder
    target_size=(224, 224),
    batch_size=1,
    class_mode="binary"
)

print(generator.class_indices)
