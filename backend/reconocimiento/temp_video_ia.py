from ultralytics import YOLO
import cv2
import time
import os

# --- CONFIGURACIÓN ---
ruta_modelo = os.path.join('runs', 'detect', 'train3', 'weights', 'best.pt')
ruta_video = "video_prueba.mp4" 

# REGLAS DE PUNTUACIÓN (CALIBRACIÓN REALISTA)
pesos_avance = {
    0: 10.0,  # Techo
    1: 5.0,   # Detalles
    2: 30.0,  # Paredes/Pisos
    3: 20.0,  # Ventanas/Puertas
}

# Cargar modelo
print("Cargando modelo en GPU...")
model = YOLO(ruta_modelo)

# Abrir video
cap = cv2.VideoCapture(ruta_video)
if not cap.isOpened():
    print("Error: No encuentro el video.")
    exit()

# VARIABLES PARA ESTADÍSTICAS
scores_por_frame = []
max_score_visto = 0.0
frames_con_deteccion = 0
total_frames = 0

print("Procesando video... Presiona 'q' para terminar y ver el reporte.")

while cap.isOpened():
    success, frame = cap.read()
    if success:
        inicio = time.time()
        total_frames += 1

        # MODO EXIGENTE (Confianza 0.60)
        results = model(frame, conf=0.60)
        
        # CÁLCULO DE AVANCE EN ESTE CUADRO
        score_actual = 0.0
        objetos_en_cuadro = set()
        
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                if cls_id in pesos_avance and cls_id not in objetos_en_cuadro:
                    score_actual += pesos_avance[cls_id]
                    objetos_en_cuadro.add(cls_id)
        
        # Limitar a 100%
        score_actual = min(score_actual, 100.0)
        
        # Guardar datos
        scores_por_frame.append(score_actual)
        if score_actual > 0:
            frames_con_deteccion += 1
        if score_actual > max_score_visto:
            max_score_visto = score_actual

        fps = 1 / (time.time() - inicio)

        # DIBUJAR EN PANTALLA
        annotated_frame = results[0].plot(line_width=3)
        
        # Panel de Datos en el video
        cv2.rectangle(annotated_frame, (0, 0), (350, 80), (0, 0, 0), -1) 
        cv2.putText(annotated_frame, f"FPS: {fps:.0f}", (20, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(annotated_frame, f"Avance: {score_actual:.0f}%", (20, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

        cv2.imshow("Auditoria IA", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    else:
        break

cap.release()
cv2.destroyAllWindows()

# --- REPORTE FINAL INTERPRETADO (AQUÍ ESTÁ EL CAMBIO) ---
print("\n" * 2)
print("╔══════════════════════════════════════════════════════╗")
print("║           📊  RESULTADOS DE LA INSPECCIÓN            ║")
print("╚══════════════════════════════════════════════════════╝")

if total_frames > 0:
    # Cálculo de porcentajes
    tiempo_efectivo = (frames_con_deteccion / total_frames) * 100
    
    # Interpretación automática del estado de la obra
    estado_obra = "❓ No determinado"
    if max_score_visto == 0:
        estado_obra = "⚠️ No se detectó construcción"
    elif max_score_visto < 20:
        estado_obra = "🏗️  Inicio de Obra / Limpieza"
    elif max_score_visto < 50:
        estado_obra = "🧱  Obra Gruesa (Paredes/Losa)"
    elif max_score_visto < 80:
        estado_obra = "🏠  Obra Gris (Cerramientos/Instalaciones)"
    else:
        estado_obra = "✨  Terminaciones / Obra Blanca"

    print(f"\n🔎 RESUMEN EJECUTIVO:")
    print(f"   La IA analizó el video y logró identificar elementos")
    print(f"   de construcción el {tiempo_efectivo:.1f}% del tiempo.")

    print(f"\n🏆 CONCLUSIÓN DEL AVANCE:")
    print(f"   El nivel máximo de construcción detectado fue: {max_score_visto}%")
    print(f"   Interpretación: {estado_obra}")

    print(f"\n📉 CALIDAD DEL VIDEO:")
    if tiempo_efectivo < 30:
        print("   ⚠️ Baja visibilidad (Cámara muy rápida o borrosa).")
        print("      Recomendación: Grabar más lento para mejor precisión.")
    else:
        print("   ✅ Buena visibilidad. La IA pudo ver claramente.")

else:
    print("⚠️ No se procesaron cuadros.")

print("\n" + "="*60)