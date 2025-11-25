#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script de prueba para verificar que las dependencias estén instaladas"""

try:
    from ultralytics import YOLO
    print("OK: ultralytics importado correctamente")
except ImportError as e:
    print(f"ERROR: Error al importar ultralytics: {e}")
    print("\nSolucion: Instala ultralytics con:")
    print("  pip install ultralytics")
    exit(1)

try:
    import cv2
    print("OK: opencv-python importado correctamente")
except ImportError:
    print("WARNING: opencv-python no esta instalado (se instalara con ultralytics)")

try:
    import numpy
    print(f"OK: numpy {numpy.__version__} importado correctamente")
except ImportError:
    print("WARNING: numpy no esta instalado (se instalara con ultralytics)")

print("\nOK: Todas las dependencias criticas estan instaladas")

