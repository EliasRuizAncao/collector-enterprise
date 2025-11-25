# Módulo de Reconocimiento EPP

Este módulo contiene el script de Python para detección de Equipos de Protección Personal (EPP) usando YOLOv8.

## Instalación

### Opción 1: Instalación directa (recomendado)
```bash
pip install ultralytics
```

### Opción 2: Desde requirements.txt
```bash
pip install -r requirements.txt
```

### Nota sobre Python 3.14
Si tienes Python 3.14 y encuentras problemas con numpy, considera:
- Usar Python 3.11 o 3.12 (versiones más estables)
- O instalar numpy desde source (requiere compilador C)

## Uso

El script se ejecuta automáticamente desde el backend de Node.js cuando se recibe una imagen.

```bash
python detect.py <ruta_imagen>
```

## Estructura

- `detect.py`: Script principal de detección
- `best.pt`: Modelo YOLOv8 entrenado
- `recibidos/detecciones/`: Carpeta donde se guardan las imágenes procesadas




