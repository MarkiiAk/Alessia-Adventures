# 🎂 Alessia's 3rd Birthday - Disney Adventure Invitation

Una invitación digital interactiva para el cumpleaños #3 de Alessia con funcionalidad RSVP y base de datos.

## 🚀 Deployment Instructions

### 1. Archivos a incluir en Git (deploy limpio):
```
✅ INCLUIR:
- turns3.html (página principal)
- css/ (todos los estilos)
- js/main.js (JavaScript original)
- src/ (imágenes y React components)
- fonts/ (fuentes Disney)
- api/ (endpoints backend)
- server.js (servidor Express)
- package.json (dependencias)
- webpack.config.js (configuración build)
- prisma/schema.prisma (esquema BD)
- README.md
- .gitignore

❌ EXCLUIR (via .gitignore):
- node_modules/ (~10k archivos - se instala automáticamente)
- .env.local (credenciales - configurar en producción)
- react-integration.js (build file - se regenera)
- package-lock.json (se regenera automáticamente)
```

### 2. Setup en Producción (Vercel/Netlify):

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crear .env.local con:
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb"

# 3. Generar bundle React
npm run build:dev

# 4. Iniciar servidor
npm start
```

### 3. Variables de entorno requeridas:
- `DATABASE_URL`: Connection string de Neon PostgreSQL
- `PORT`: Puerto del servidor (opcional, default: 3000)

### 4. Commands disponibles:
- `npm run build` - Build producción
- `npm run build:dev` - Build desarrollo  
- `npm start` - Iniciar servidor
- `npm run dev` - Build + start

### 5. Deploy size optimizado:
- **Sin optimización**: ~15MB (con node_modules)
- **Con .gitignore**: ~5MB (archivos esenciales únicamente)
- **Runtime**: Se instalan dependencias automáticamente

## 🗄️ Base de Datos

El proyecto usa PostgreSQL (Neon) con las siguientes tablas:
- `events` - Información del evento
- `guests` - Lista de invitados  
- `invitations` - RSVPs y respuestas

Schema auto-creado al hacer primer RSVP.

## 🎯 Features

- ✅ Diseño Disney responsivo
- ✅ React integration sin conflictos
- ✅ RSVP funcional con base de datos
- ✅ Sistema de transacciones
- ✅ CORS configurado
- ✅ Error handling robusto