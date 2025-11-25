from ultralytics import YOLO
import os
import cv2 

# --- CONFIGURACIÓN ---
# Usamos tu modelo EXPERTO (Train3)
ruta_modelo = os.path.join('runs', 'detect', 'train3', 'weights', 'best.pt')

# --- REGLAS DE PUNTUACIÓN ---
pesos_avance = {
    0: 10.0,  # Techo / Losa
    1: 5.0,   # Detalles estructurales
    2: 30.0,  # Paredes / Pisos (Obra Gruesa)
    3: 20.0,  # Ventanas / Puertas (Cerramientos)
}
# ----------------------

# Verificación de seguridad
if not os.path.exists(ruta_modelo):
    print(f"ERROR CRÍTICO: No encuentro el archivo del modelo en: {ruta_modelo}")
    exit()

print("Cargando modelo EXPERTO (Train3)...")
model = YOLO(ruta_modelo)
print("Modelo cargado correctamente.")

def calcular_progreso(imagen_path):
    print(f"\n--- Analizando imagen: {imagen_path} ---")
    
    # MODO EXPERTO: Confianza 0.50
    # En fotos estáticas podemos ser más exigentes que en video.
    results = model(imagen_path, conf=0.50) 
    
    progreso_total = 0.0
    objetos_detectados_ids = set() 
    detalles_encontrados = []

    # 1. ANÁLISIS MATEMÁTICO
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0]) 
            confianza = float(box.conf[0])
            nombre_clase = result.names[class_id] 
            
            # Si el objeto suma puntos
            if class_id in pesos_avance:
                # Solo sumamos una vez por tipo de objeto (Ej: 10 ventanas suman lo mismo que 1 para la fase)
                if class_id not in objetos_detectados_ids:
                    puntos = pesos_avance[class_id]
                    progreso_total += puntos
                    objetos_detectados_ids.add(class_id)
                    detalles_encontrados.append(f"✅ {nombre_clase.capitalize()} (+{puntos}%)")
                
    # Límite lógico 100%
    progreso_total = min(progreso_total, 100.0)

    # 2. INTERPRETACIÓN DEL ESTADO (Igual que en el video)
    estado_obra = "❓ No determinado"
    if progreso_total == 0:
        estado_obra = "⚠️ No se detectó construcción"
    elif progreso_total < 25:
        estado_obra = "🏗️  Inicio de Obra / Estructura"
    elif progreso_total < 55:
        estado_obra = "🧱  Obra Gruesa (Paredes/Losa)"
    elif progreso_total < 85:
        estado_obra = "🏠  Obra Gris (Con Cerramientos)"
    else:
        estado_obra = "✨  Terminaciones Avanzadas"

    # 3. REPORTE EN CONSOLA (Estilo Profesional)
    print("\n" * 1)
    print("╔══════════════════════════════════════════════════════╗")
    print("║           📸  REPORTE DE IMAGEN ESTÁTICA             ║")
    print("╚══════════════════════════════════════════════════════╝")
    print(f"\n🔎 HALLAZGOS:")
    if detalles_encontrados:
        for hallazgo in detalles_encontrados:
            print(f"   {hallazgo}")
    else:
        print("   (Ningún elemento reconocible detectado)")

    print("-" * 50)
    print(f"🏆 AVANCE CALCULADO: {progreso_total}%")
    print(f"📋 ESTADO ESTIMADO:  {estado_obra}")
    print("=" * 56 + "\n")
    
    # 4. VISUALIZACIÓN EN VENTANA
    # Dibujamos los cuadros
    imagen_resultado = results[0].plot(line_width=3)
    
    # Agregamos un cartel negro con el resultado en la imagen
    # (Coordenadas: x1, y1, x2, y2)
    cv2.rectangle(imagen_resultado, (0, 0), (450, 60), (0, 0, 0), -1) 
    
    # Texto del porcentaje
    texto_resultado = f"Avance: {progreso_total}%"
    cv2.putText(imagen_resultado, texto_resultado, (20, 40), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Resultado Analisis IA", imagen_resultado)
    cv2.waitKey(0)
    cv2.destroyAllWindows()
 
# --- EJECUCIÓN MANUAL ---
nombre_foto = "prueba.jpg"

if os.path.exists(nombre_foto):
    calcular_progreso(nombre_foto)
else:
    print(f"\n❌ ERROR: No encuentro el archivo '{nombre_foto}' en la carpeta.")
    print("PASO NECESARIO: Descarga una foto de internet, ponla en esta carpeta y llámala 'prueba.jpg'")