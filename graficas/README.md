# Graficas - Métricas y Gráficas camideambiente

Estructura de archivos para métricas y gráficas del dashboard. Cada card y cada gráfica en archivos separados.

## Estructura

```
graficas/
├── cards/           # JS de cada tarjeta de métricas
│   ├── seguidores.js
│   └── posts.js
├── charts/          # JS de cada gráfica
│   └── distribucionPerfiles.js   # Bubble: Seguidores vs Seguidos (tamaño=posts)
├── data/
│   ├── cardSeguidores.json
│   ├── cardPosts.json
│   └── chartDistribucionPerfiles.json
└── README.md
```

## Cards implementadas

| Card | Archivo | Fuente de datos |
|------|---------|-----------------|
| Total Seguidores | `cards/seguidores.js` | `csvjson/seguidoresCamilo.json` |
| Total Posts | `cards/posts.js` | `csvjson/postsCamilo.csv` |

## Gráficas

| Gráfica | Archivo | Fuente | Ejes |
|---------|---------|--------|------|
| Distribución perfiles | `charts/distribucionPerfiles.js` | perfilesSeguidores | Y: Seguidores (log), X: Seguidos, Tamaño: Posts |

## API

- `GET /api/metrics/seguidores` → `{ count, source }`
- `GET /api/metrics/posts` → `{ count, source }`
- `GET /api/metrics/perfiles-seguidores` → `{ data: [{x, y, r, posts, username}] }`
