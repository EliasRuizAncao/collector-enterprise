import sys
import json
import os
from ultralytics import YOLO

# Cargar el modelo
model = YOLO('best.pt')

# Obtener ruta de la imagen recibida
image_path = sys.argv[1]

# Ejecutar predicción
# save=True le dice a YOLO que guarde la foto con los cuadros dibujados
# project='recibidos', name='detecciones' define dónde se guardan
results = model.predict(source=image_path, save=True, project='recibidos', name='detecciones', exist_ok=True, verbose=False, conf=0.15)

# IMPORTANTE: Clases exactas del dataset de Roboflow
# El orden debe coincidir con el data.yaml de entrenamiento
# Incluye clase '0' por si hay desplazamiento en los IDs
detections = {
    "casco": 0,
    "chaleco": 0,
    "guante": 0,
    "zapato": 0,
    "no casco": 0,
    "no chaleco": 0,
    "no guante": 0
}

for box in results[0].boxes:
    class_id = int(box.cls[0])
    class_name = model.names[class_id]
    if class_name in detections:
        detections[class_name] += 1

# Imprimir JSON para que Node.js lo lea
print(json.dumps(detections))