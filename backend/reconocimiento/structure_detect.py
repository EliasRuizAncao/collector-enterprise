import sys
import json
import os
import cv2
import time
from ultralytics import YOLO

# Configuración
MODEL_PATH = 'structure_best.pt'
SAVE_DIR = os.path.join('recibidos', 'detecciones_structure')

# Reglas de puntuación (del código original)
PESOS_AVANCE = {
    0: 10.0,  # Techo
    1: 5.0,   # Detalles
    2: 30.0,  # Paredes/Pisos
    3: 20.0,  # Ventanas/Puertas
}

def get_status_text(max_score):
    if max_score < 20:
        return "🌱 Fase 1: Proyecto Iniciado"
    elif max_score < 40:
        return "🏗️ Fase 2: En Desarrollo Temprano"
    elif max_score < 60:
        return "🚧 Fase 3: Avance Medio"
    elif max_score < 80:
        return "🏠 Fase 4: En Etapa Final"
    else:
        return "✨ Fase 5: Proyecto Completado"

def process_image(model, image_path, output_name):
    # Predicción
    # YOLO guarda en project/name/filename
    results = model.predict(source=image_path, save=True, project='recibidos', name='detecciones_structure', exist_ok=True, conf=0.60)
    
    score_actual = 0.0
    objetos_en_cuadro = set()
    detections_list = []

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = model.names[cls_id]
        detections_list.append(class_name)
        
        if cls_id in PESOS_AVANCE and cls_id not in objetos_en_cuadro:
            score_actual += PESOS_AVANCE[cls_id]
            objetos_en_cuadro.add(cls_id)
    
    score_actual = min(score_actual, 100.0)
    status_text = get_status_text(score_actual)
    
    return {
        "type": "image",
        "score": score_actual,
        "status": status_text,
        "detections": detections_list,
        "processed_file": os.path.basename(image_path) 
    }

def process_video(model, video_path, output_name):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "No se pudo abrir el video"}

    # Propiedades del video
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # Configurar writer para guardar video procesado
    output_path = os.path.join(SAVE_DIR, output_name)
    os.makedirs(SAVE_DIR, exist_ok=True)
    
    # Codec para MP4 (h.264 es mejor para web, pero mp4v es más compatible por defecto en opencv)
    fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    max_score_visto = 0.0
    frames_con_deteccion = 0
    total_frames = 0
    all_detections = set()

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
            
        total_frames += 1
        
        # Predicción en el frame
        results = model(frame, conf=0.60, verbose=False)
        
        score_actual = 0.0
        objetos_en_cuadro = set()
        
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                class_name = model.names[cls_id]
                all_detections.add(class_name)
                
                if cls_id in PESOS_AVANCE and cls_id not in objetos_en_cuadro:
                    score_actual += PESOS_AVANCE[cls_id]
                    objetos_en_cuadro.add(cls_id)
        
        score_actual = min(score_actual, 100.0)
        
        if score_actual > 0:
            frames_con_deteccion += 1
        if score_actual > max_score_visto:
            max_score_visto = score_actual

        # Dibujar
        annotated_frame = results[0].plot(line_width=3)
        
        # Panel de datos
        cv2.rectangle(annotated_frame, (0, 0), (350, 80), (0, 0, 0), -1) 
        cv2.putText(annotated_frame, f"Avance: {score_actual:.0f}%", (20, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        out.write(annotated_frame)

    cap.release()
    out.release()
    
    status_text = get_status_text(max_score_visto)
    
    return {
        "type": "video",
        "score": max_score_visto,
        "status": status_text,
        "detections": list(all_detections),
        "processed_file": output_name,
        "stats": {
            "total_frames": total_frames,
            "frames_with_detection": frames_con_deteccion,
            "effective_time_percent": (frames_con_deteccion / total_frames * 100) if total_frames > 0 else 0
        }
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Falta la ruta del archivo"}))
        return

    file_path = sys.argv[1]
    filename = os.path.basename(file_path)
    
    # Cargar modelo
    try:
        model = YOLO(MODEL_PATH)
    except Exception as e:
        print(json.dumps({"error": f"Error al cargar modelo: {str(e)}"}))
        return

    # Determinar tipo de archivo
    ext = os.path.splitext(filename)[1].lower()
    
    try:
        if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
            result = process_image(model, file_path, filename)
        elif ext in ['.mp4', '.avi', '.mov', '.mkv']:
            result = process_video(model, file_path, filename)
        else:
            result = {"error": "Formato no soportado"}
            
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": f"Error en procesamiento: {str(e)}"}))

if __name__ == "__main__":
    main()
