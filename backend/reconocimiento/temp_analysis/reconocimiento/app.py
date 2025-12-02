from ultralytics import YOLO
import cv2

# 1. Cargamos el modelo base
# 'yolov8n.pt' es el modelo "Nano", el más rápido y ligero para empezar.
# Al correrlo la primera vez, se descargará automáticamente de internet.
print("Cargando modelo...")
model = YOLO('yolov8n.pt') 

# 2. Hacemos una predicción de prueba
# Usaremos una imagen de ejemplo que viene en internet
print("Realizando detección de prueba...")
results = model('https://ultralytics.com/images/bus.jpg')

# 3. Mostrar resultados
# Esto guardará la imagen con las detecciones en tu carpeta
for result in results:
    result.save(filename='resultado_prueba.jpg')  # Guarda la imagen detectada
    print("¡Detección completada! Revisa la imagen 'resultado_prueba.jpg'")