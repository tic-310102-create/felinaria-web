# Inventario y optimización de imágenes

WebP a calidad 86, sin reducir resolución. El canal alfa se comprobó píxel por píxel; los perfiles ICC presentes se conservaron.

| Original | Formato | Antes (kB) | Optimizada | Después (kB) | Reducción |
|---|---|---:|---|---:|---:|
| `images/aprendiz1.png` | PNG | 1146.66 | `images/aprendiz1.webp` | 155.68 | 86.42 % |
| `images/aprendiz2.png` | PNG | 978.35 | `images/aprendiz2.webp` | 131.84 | 86.52 % |
| `images/aprendiz3.png` | PNG | 1003.83 | `images/aprendiz3.webp` | 133.78 | 86.67 % |
| `images/aprendiz4.png` | PNG | 1068.65 | `images/aprendiz4.webp` | 144.09 | 86.52 % |
| `images/maestro.png` | PNG | 1154.82 | `images/maestro.webp` | 160.59 | 86.09 % |
| `images/rastrojo.png` | PNG | 1246.96 | `images/rastrojo.webp` | 167.82 | 86.54 % |
| `images/rosa.png` | PNG | 1039.70 | `images/rosa.webp` | 152.55 | 85.33 % |
| `images/perros-salvajes.png` | PNG | 1982.10 | `images/perros-salvajes.webp` | 308.76 | 84.42 % |
| `images/colonia-sol.png` | PNG | 3197.45 | `images/colonia-sol.webp` | 437.84 | 86.31 % |
| `images/colonia-de-la-luna.png` | PNG | 3207.25 | `images/colonia-de-la-luna.webp` | 419.28 | 86.93 % |
| `images/colonia-del-oleaje.png` | PNG | 3361.66 | `images/colonia-del-oleaje.webp` | 490.05 | 85.42 % |
| `images/manada-del-colmillo.png` | PNG | 3035.94 | `images/manada-del-colmillo.webp` | 326.57 | 89.24 % |
| `images/icono_felinaria.png` | PNG | 1146.66 | `images/icono_felinaria.webp` | 121.75 | 89.38 % |
| `images/combate.png` | PNG | 955.71 | `images/combate.webp` | 70.92 | 92.58 % |
| `images/crear-protagonista.png` | PNG | 836.15 | `images/crear-protagonista.webp` | 65.14 | 92.21 % |
| `images/moral.png` | PNG | 1063.13 | `images/moral.webp` | 113.29 | 89.34 % |
| `images/dialogos_narrativos.png` | PNG | 1037.88 | `images/dialogos-narrativos.webp` | 94.60 | 90.89 % |
| `images/interactualr con npc.png` | PNG | 1064.48 | `images/interaccion-npc.webp` | 92.16 | 91.34 % |

**Total:** 28.53 MB → 3.59 MB; reducción de **87.43 %**.

## Originales y recursos técnicos

Respaldos originales: `originales-locales/20261105-112609/images/`. Las rutas y los SHA-256 de cada original están en `image-optimization.json`.

`originales-locales/` está excluido de Git y del build. Los originales no se publican. `public/icons/icon-192.png` y `public/icons/icon-512.png` siguen siendo PNG y no se han convertido. Los SVG existentes se conservan.

## Asignación de capturas a mecánicas

- Exploración e interacción: `dialogos-narrativos.webp` (investigación de huellas junto al río).
- Diálogos y personajes: `interaccion-npc.webp` (conversación con el mentor en el campamento).
- Decisiones y moral: `moral.webp` (tres respuestas y sus consecuencias).
- Combate y supervivencia: `combate.webp` (ataque durante un enfrentamiento).
- Creación: `crear-protagonista.webp` y las cuatro ilustraciones `aprendiz1.webp` a `aprendiz4.webp`.

Las capturas conservan sus rótulos originales en español. Los textos HTML que las acompañan, sus alternativas accesibles y las instrucciones para ampliarlas están traducidos. No se ha alterado el texto dibujado en las imágenes.
