from ultralytics import YOLO

# Opción A: Empezar de cero pero entrenar MUCHO más (Recomendado para mejor calidad)
model = YOLO('yolov8n.pt') 

# Opción B: Si quisieras seguir exactamente donde quedaste (Transfer Learning)
# model = YOLO('runs/detect/train2/weights/best.pt') 
# Pero para YOLO suele ser mejor hacer una corrida larga desde el base.

if __name__ == '__main__':
    print("Iniciando entrenamiento largo (esto tomará unos 15-20 mins)...")
    
    # epochs=100: Le dará 100 vueltas al libro.
    # patience=15: Si en 15 vueltas no mejora su nota, se detiene solo (ahorra tiempo).
    model.train(data='data.yaml', epochs=100, imgsz=640, patience=15)