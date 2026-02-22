# Cami de Ambiente

Plataforma web desarrollada con Node.js

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js (versión 14 o superior)
- npm (viene con Node.js)

### Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

3. Iniciar el servidor:
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

4. Abrir en el navegador:
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
camideambiente/
├── src/
│   ├── config/          # Configuraciones (BD, etc.)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Middlewares personalizados
│   ├── models/          # Modelos de datos
│   ├── routes/          # Definición de rutas
│   ├── utils/           # Utilidades y helpers
│   └── server.js        # Punto de entrada del servidor
├── public/              # Archivos estáticos (HTML, CSS, JS, imágenes)
├── .env                 # Variables de entorno (no subir a Git)
├── .env.example         # Ejemplo de variables de entorno
├── .gitignore          # Archivos ignorados por Git
├── package.json        # Dependencias y scripts
└── README.md           # Este archivo
```

## 🛠️ Tecnologías

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **dotenv** - Manejo de variables de entorno

## 📝 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con auto-reload

## 🔧 Próximos Pasos

- [ ] Definir funcionalidades de la plataforma
- [ ] Configurar base de datos
- [ ] Implementar autenticación (si es necesario)
- [ ] Crear API endpoints
- [ ] Desarrollar frontend

## 📄 Licencia

ISC
