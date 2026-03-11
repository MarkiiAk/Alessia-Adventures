# 🗄️ Database Schema - Alessia Adventures

## 📊 **Configuración de Base de Datos**

- **Provider:** PostgreSQL
- **Hosting:** Neon (Serverless)
- **ORM:** Prisma

---

## 📋 **Tablas**

### **1. 👥 `guests` - Invitados**

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, Auto-generated | ID único del invitado |
| `name` | VARCHAR(255) | NOT NULL | Nombre completo del invitado |
| `email` | VARCHAR(255) | NULLABLE | Email del invitado |
| `phone` | VARCHAR(20) | NULLABLE | Teléfono del invitado |
| `created_at` | TIMESTAMP(6) | DEFAULT now() | Fecha de creación |

**Relaciones:**
- `1:N` con `invitations`

---

### **2. 🎉 `events` - Eventos**

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, Auto-generated | ID único del evento |
| `name` | VARCHAR(255) | NOT NULL | Nombre del evento |
| `description` | TEXT | NULLABLE | Descripción detallada |
| `event_date` | TIMESTAMP(6) | NULLABLE | Fecha y hora del evento |
| `created_at` | TIMESTAMP(6) | DEFAULT now() | Fecha de creación |

**Relaciones:**
- `1:N` con `invitations`

---

### **3. 💌 `invitations` - Invitaciones**

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, Auto-generated | ID único de la invitación |
| `guest_id` | UUID | FOREIGN KEY, NOT NULL | Referencia a `guests.id` |
| `event_id` | UUID | FOREIGN KEY, NOT NULL | Referencia a `events.id` |
| `status` | INTEGER | DEFAULT 3 | Estado de la invitación |
| `responded_at` | TIMESTAMP(6) | NULLABLE | Fecha de respuesta |
| `created_at` | TIMESTAMP(6) | DEFAULT now() | Fecha de creación |

**Constraints:**
- `UNIQUE(guest_id, event_id)` - Un invitado por evento
- `CASCADE DELETE` - Al eliminar guest/event, se eliminan invitaciones

**Estados (status):**
- `1` = Confirmado ✅
- `2` = Declinado ❌  
- `3` = Pendiente ⏳ (default)

---

## 🔗 **Relaciones**

```
guests (1) ←→ (N) invitations (N) ←→ (1) events
```

- Un **invitado** puede tener múltiples **invitaciones**
- Un **evento** puede tener múltiples **invitaciones**  
- Un **invitado + evento** = combinación única

---

**📅 Última actualización:** 2026-03-11
