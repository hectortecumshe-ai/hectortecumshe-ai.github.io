"""Genera las miniaturas de las apps para el portal (JPEG de 960 px)."""
import os
import subprocess

S = r'C:\Users\hmoji\AppData\Local\Temp\claude\G--Mi-unidad-CLAUDE\9e41e6fd-f4db-4ef0-ba86-5c516cfcb14b\scratchpad'
O = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'img')
PARES = [(r'D:\CLAUDE\RatioBos\instructivo\img\inicio-es.jpg', 'ratiobos'),
         (r'D:\CLAUDE\RatioBos\instructivo\img\mapa-es.jpg', 'ratiobos-mapa'),
         (r'D:\CLAUDE\RatioAvis\instructivo\img\inicio-es.jpg', 'ratioavis'),
         (r'D:\CLAUDE\RatioAvis\instructivo\img\mezclado-es.jpg', 'ratioavis-mezcla'),
         (os.path.join(S, 'formulaves.png'), 'formulaves')]
for ruta, nombre in PARES:
    r = subprocess.run(['powershell', '-ExecutionPolicy', 'Bypass', '-File', os.path.join(S, 'miniatura.ps1'),
                        '-In', ruta, '-Out', os.path.abspath(os.path.join(O, nombre + '.jpg'))], capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip()[:200])
