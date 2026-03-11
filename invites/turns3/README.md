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

### 2. Setup en Vercel (más fácil):

```bash
# Vercel hace automáticamente:
✅ npm install (detecta package.json)
✅ npm run build (si existe script)
✅ Deploy del servidor

# SOLO necesitas hacer manualmente:
🔧 Configurar variables de entorno en Vercel Dashboard:
   Settings > Environment Variables > Add estas variables:

   DATABASE_URL=postgresql://neondb_owner:npg_NjAkKl2Dy3gc@ep-frosty-credit-ahm8kov6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   POSTGRES_URL=postgresql://neondb_owner:npg_NjAkKl2Dy3gc@ep-frosty-credit-ahm8kov6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   
   POSTGRES_PRISMA_URL=postgresql://neondb_owner:npg_NjAkKl2Dy3gc@ep-frosty-credit-ahm8kov6-pooler.c-3.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
```

### 3. Deploy Process en Vercel:
1. **Git push** → Vercel detecta cambios
2. **Auto-install** → `npm install` (automático)
3. **Auto-build** → Ejecuta build scripts (automático)  
4. **Variables** → Solo configurar DATABASE_URL en dashboard (manual)
5. **Deploy** → ¡Listo! (automático)

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