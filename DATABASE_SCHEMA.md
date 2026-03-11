# 🗄️ Database Schema - Alessia Adventures

## 📊 **Esquema de Base de Datos**

### **Configuración**
- **Provider:** PostgreSQL
- **Hosting:** Neon (Serverless)
- **ORM:** Prisma
- **Connection:** `@neondatabase/serverless`

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
- `1:N` con `invitations` (Un invitado puede tener múltiples invitaciones)

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
- `1:N` con `invitations` (Un evento puede tener múltiples invitaciones)

---

### **3. 💌 `invitations` - Invitaciones**

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, Auto-generated | ID único de la invitación |
| `guest_id` | UUID | FOREIGN KEY, NOT NULL | Referencia al invitado |
| `event_id` | UUID | FOREIGN KEY, NOT NULL | Referencia al evento |
| `status` | INTEGER | DEFAULT 3 | Estado de la invitación |
| `responded_at` | TIMESTAMP(6) | NULLABLE | Fecha de respuesta |
| `created_at` | TIMESTAMP(6) | DEFAULT now() | Fecha de creación |

**Restricciones:**
- `UNIQUE(guest_id, event_id)` - Un invitado solo puede tener una invitación por evento
- `CASCADE DELETE` - Si se elimina un invitado o evento, se eliminan sus invitaciones

**Estados de Invitación:**
- `1` = **Confirmado** ✅
- `2` = **Declinado** ❌  
- `3` = **Pendiente** ⏳ (default)

---

## 🔗 **Relaciones del Schema**

```
guests (1) ←→ (N) invitations (N) ←→ (1) events
```

- **Guest → Invitations:** Un invitado puede recibir múltiples invitaciones
- **Event → Invitations:** Un evento puede tener múltiples invitados
- **Guest + Event:** Combinación única (no duplicados)

---

## 🚀 **APIs Disponibles**

### **📊 GET `/api/events`**
```sql
SELECT name FROM events ORDER BY created_at DESC;
```

### **✉️ POST `/api/rsvp`** 
```sql
-- Busca o crea evento
SELECT id, name FROM events WHERE LOWER(name) LIKE LOWER('%alessia%');

-- Busca o crea invitado  
SELECT id, name FROM guests WHERE LOWER(name) = LOWER(?);

-- Crea o actualiza invitación
INSERT INTO invitations (guest_id, event_id, status, responded_at, created_at)
VALUES (?, ?, ?, NOW(), NOW())
ON CONFLICT (guest_id, event_id) 
DO UPDATE SET status = EXCLUDED.status, responded_at = NOW();
```

---

## 📈 **Datos de Ejemplo**

### **Evento Actual:**
```
name: "Cumpleaños #3 de Alessia - Aventura Disney"
description: "Celebración del tercer cumpleaños de Alessia en Disneyland"  
event_date: "2026-08-31T07:25:00"
```

### **Estados RSVP:**
- ✅ **Confirmados:** `status = 1`
- ❌ **Declinados:** `status = 2`  
- ⏳ **Pendientes:** `status = 3`

---

## 🛠️ **Tecnologías Usadas**

- **Database:** Neon PostgreSQL (Serverless)
- **ORM:** Prisma 
- **Runtime:** Node.js + Vercel Functions
- **Driver:** `@neondatabase/serverless` 
- **Frontend:** Vanilla HTML/JS + React Components

---

**📅 Actualizado:** $(date)  
**🔗 Deploy:** https://alessia-adventures.vercel.app/