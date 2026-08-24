# Documentación de Base de Datos - La Cascarita

## Resumen de Tablas

Esta base de datos está diseñada para soportar todas las funcionalidades del MES 1 de La Cascarita, incluyendo gestión de usuarios, quinielas, jornadas, y administración.

---

## 1. Tabla: `users`

### Propósito
Almacenar toda la información de los usuarios que se registran en la plataforma.

### Razón de Creación
- **Autenticación**: Permite el inicio de sesión con username y contraseña
- **Autorización**: El campo `role` distingue entre usuarios regulares y administradores
- **Personalización**: Almacena nombres, fotos de perfil para experiencia personalizada
- **Recuperación**: El campo `phone` es clave para recuperación por SMS
- **Trazabilidad**: `user_id` formato LC-XXXXXX para identificación única

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único interno del sistema |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario para login, no se puede cambiar |
| `phone` | VARCHAR(10) UNIQUE | Teléfono para recuperación de contraseña y contacto |
| `email` | VARCHAR(255) UNIQUE | Correo opcional para futuras funcionalidades |
| `auth_id` | UUID | Referencia a Supabase Auth para integración |
| `user_id` | VARCHAR(20) UNIQUE | ID visible al usuario (LC-XXXXXX) según especificaciones |
| `first_name` | VARCHAR(100) | Nombre del usuario para personalización |
| `last_name` | VARCHAR(100) | Apellido del usuario |
| `profile_picture_url` | TEXT | URL de foto de perfil del usuario |
| `balance` | DECIMAL(10,2) | Saldo disponible del usuario para recargas y premios |
| `role` | VARCHAR(20) | 'user' o 'admin' para control de acceso |
| `is_active` | BOOLEAN | Control de estado de cuenta (activa/desactivada) |
| `created_at` | TIMESTAMP | Fecha de registro del usuario |
| `updated_at` | TIMESTAMP | Última actualización del perfil |

---

## 2. Tabla: `leagues`

### Propósito
Almacenar información de las diferentes ligas de fútbol disponibles en la plataforma.

### Razón de Creación
- **Organización**: Permite clasificar partidos por liga
- **Escalabilidad**: Facilita agregar nuevas ligas en el futuro
- **Identidad Visual**: Logos de ligas para mejor UX
- **Clasificación**: Países para organizar por región

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único de la liga |
| `name` | VARCHAR(100) UNIQUE | Nombre de la liga (ej: "Liga MX") |
| `country` | VARCHAR(100) | País de origen de la liga |
| `logo_url` | TEXT | URL del logo de la liga para UI |
| `is_active` | BOOLEAN | Control de ligas activas/inactivas |
| `created_at` | TIMESTAMP | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 3. Tabla: `teams`

### Propósito
Almacenar información de los equipos que participan en las ligas.

### Razón de Creación
- **Identificación**: Nombres y logos de equipos para mostrar en partidos
- **Relación**: Vincula equipos a sus ligas correspondientes
- **Abreviaciones**: `short_name` para espacios limitados en UI
- **Gestión**: Control de equipos activos/inactivos

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del equipo |
| `name` | VARCHAR(100) UNIQUE | Nombre completo del equipo |
| `short_name` | VARCHAR(20) | Abreviatura para UI compacta |
| `logo_url` | TEXT | URL del logo del equipo |
| `league_id` | UUID FK | Liga a la que pertenece el equipo |
| `is_active` | BOOLEAN | Control de equipos activos/inactivos |
| `created_at` | TIMESTAMP | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 4. Tabla: `jornadas`

### Propósito
Representar las jornadas o rondas de quiniela donde los usuarios hacen sus pronósticos.

### Razón de Creación
- **Agrupación**: Organiza partidos en jornadas específicas
- **Control**: Gestiona fechas de apertura/cierre de registros
- **Economía**: Controla bolsa de premios y costo de participación
- **Estado**: Ciclo de vida: draft → open → closed → completed
- **Tipos**: Soporta media_semana, fin_de_semana, dominical

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único de la jornada |
| `name` | VARCHAR(100) | Nombre descriptivo de la jornada |
| `description` | TEXT | Detalles adicionales de la jornada |
| `type` | VARCHAR(20) | Tipo: media_semana, fin_de_semana, dominical |
| `league_id` | UUID FK | Liga principal de la jornada |
| `start_date` | TIMESTAMP | Fecha de inicio de la jornada |
| `end_date` | TIMESTAMP | Fecha de fin de la jornada |
| `registration_deadline` | TIMESTAMP | Fecha límite para registrarse |
| `prize_pool` | DECIMAL(10,2) | Bolsa total de premios |
| `participation_cost` | DECIMAL(10,2) | Costo por participación |
| `max_participants` | INTEGER | Límite máximo de participantes |
| `current_participants` | INTEGER | Contador actual de participantes |
| `status` | VARCHAR(20) | Estado: draft, open, closed, completed, cancelled |
| `created_by` | UUID FK | Administrador que creó la jornada |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 5. Tabla: `matches`

### Propósito
Almacenar información de los partidos individuales dentro de cada jornada.

### Razón de Creación
- **Base de Pronósticos**: Cada partido es un elemento para pronosticar
- **Resultados**: Almacena resultados finales para calcular aciertos
- **Programación**: Fechas y horarios de los partidos
- **Estado**: Seguimiento en tiempo real (scheduled, live, finished)
- **Ubicación**: Venue o estadio del partido

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del partido |
| `jornada_id` | UUID FK | Jornada a la que pertenece |
| `home_team_id` | UUID FK | Equipo local |
| `away_team_id` | UUID FK | Equipo visitante |
| `match_date` | TIMESTAMP | Fecha y hora del partido |
| `venue` | VARCHAR(200) | Estadio o lugar del partido |
| `round` | INTEGER | Número de ronda/jornada |
| `status` | VARCHAR(20) | Estado: scheduled, live, finished, etc. |
| `home_score` | INTEGER | Goles del equipo local |
| `away_score` | INTEGER | Goles del equipo visitante |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 6. Tabla: `participations`

### Propósito
Registrar cada participación de un usuario en una jornada específica.

### Razón de Creación
- **Historial**: Permite "Historial de participaciones" del usuario
- **Control de Pagos**: Gestiona estado de pago y confirmación
- **Folios**: Genera folios únicos (LC-FS-XXXXXX) según especificaciones
- **Resultados**: Almacena aciertos y posición en ranking
- **Premios**: Vincula con premios ganados

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único de la participación |
| `folio` | VARCHAR(20) UNIQUE | Folio visible al usuario |
| `user_id` | UUID FK | Usuario participante |
| `jornada_id` | UUID FK | Jornada en la que participa |
| `payment_status` | VARCHAR(20) | Estado: pending, paid, failed, refunded |
| `participation_status` | VARCHAR(20) | Estado: pending, confirmed, cancelled |
| `payment_method` | VARCHAR(50) | Método de pago usado |
| `payment_amount` | DECIMAL(10,2) | Monto pagado |
| `payment_date` | TIMESTAMP | Fecha del pago |
| `predictions_count` | INTEGER | Total de pronósticos hechos |
| `correct_predictions` | INTEGER | Total de aciertos |
| `position` | INTEGER | Posición en ranking de la jornada |
| `prize_amount` | DECIMAL(10,2) | Monto del premio ganado |
| `prize_status` | VARCHAR(20) | Estado del premio: none, pending, paid, claimed |
| `created_at` | TIMESTAMP | Fecha de registro |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 7. Tabla: `predictions`

### Propósito
Almacenar los pronósticos individuales de cada usuario por partido.

### Razón de Creación
- **Captura de Pronósticos**: Funcionalidad principal de la plataforma
- **Cálculo de Aciertos**: Compara predicción con resultado real
- **Puntuación**: Asigna puntos según aciertos
- **Unicidad**: Garantiza un pronóstico por usuario por partido

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del pronóstico |
| `participation_id` | UUID FK | Participación del usuario |
| `match_id` | UUID FK | Partido pronosticado |
| `prediction` | VARCHAR(10) | Predicción: home, draw, away |
| `is_correct` | BOOLEAN | Si el pronóstico fue correcto |
| `points` | INTEGER | Puntos asignados por acierto |
| `created_at` | TIMESTAMP | Fecha del pronóstico |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 8. Tabla: `prizes`

### Propósito
Registrar los premios ganados por los usuarios y su estado de pago.

### Razón de Creación
- **Seguimiento de Premios**: Permite "Mis premios" en el dashboard
- **Control de Pagos**: Gestiona proceso de pago de premios
- **Datos Bancarios**: Almacena información para transferencias
- **Auditoría**: Registro completo de transacciones de premios

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del premio |
| `participation_id` | UUID FK | Participación que generó el premio |
| `user_id` | UUID FK | Usuario ganador |
| `jornada_id` | UUID FK | Jornada correspondiente |
| `position` | INTEGER | Posición obtenida (1°, 2°, 3°) |
| `amount` | DECIMAL(10,2) | Monto del premio |
| `status` | VARCHAR(20) | Estado: pending, processing, paid, claimed, cancelled |
| `payment_method` | VARCHAR(50) | Método de pago del premio |
| `bank_name` | VARCHAR(100) | Banco del usuario |
| `account_number` | VARCHAR(50) | Número de cuenta |
| `clabe` | VARCHAR(18) | CLABE para transferencias |
| `paid_at` | TIMESTAMP | Fecha de pago del premio |
| `notes` | TEXT | Notas adicionales |
| `created_at` | TIMESTAMP | Fecha de registro |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 9. Tabla: `rankings`

### Propósito
Almacenar rankings históricos por jornada para optimizar consultas.

### Razón de Creación
- **Performance**: Optimiza consultas de ranking sin cálculos en tiempo real
- **Historial**: Mantiene registro de rankings pasados
- **Mi Ranking**: Permite al usuario ver su posición histórica
- **Ranking General**: Facilita mostrar top jugadores

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del registro de ranking |
| `jornada_id` | UUID FK | Jornada del ranking |
| `user_id` | UUID FK | Usuario en el ranking |
| `participation_id` | UUID FK | Participación correspondiente |
| `position` | INTEGER | Posición en el ranking |
| `points` | INTEGER | Puntos totales obtenidos |
| `correct_predictions` | INTEGER | Total de aciertos |
| `total_predictions` | INTEGER | Total de pronósticos |
| `accuracy` | DECIMAL(5,2) | Porcentaje de precisión |
| `created_at` | TIMESTAMP | Fecha de creación del registro |

---

## 10. Tabla: `notifications`

### Propósito
Almacenar notificaciones para usuarios individuales o globales.

### Razón de Creación
- **Comunicación**: Anuncios importantes y actualizaciones
- **Anuncios Globales**: Noticias para todos los usuarios (user_id = NULL)
- **Personalizadas**: Notificaciones específicas por usuario
- **UX**: Mejora experiencia con comunicación proactiva

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único de la notificación |
| `user_id` | UUID FK | Usuario destinatario (NULL = global) |
| `type` | VARCHAR(20) | Tipo: info, success, warning, error |
| `title` | VARCHAR(200) | Título de la notificación |
| `message` | TEXT | Contenido del mensaje |
| `icon` | VARCHAR(50) | Icono para visualización |
| `is_read` | BOOLEAN | Si el usuario la leyó |
| `action_url` | TEXT | URL para acción relacionada |
| `created_at` | TIMESTAMP | Fecha de creación |

---

## 11. Tabla: `settings`

### Propósito
Almacenar configuración global de la plataforma.

### Razón de Creación
- **Flexibilidad**: Ajustar parámetros sin modificar código
- **Mantenimiento**: Cambios de configuración sin despliegues
- **Costos**: Gestión dinámica de costos de participación
- **Reglas**: Distribución de premios configurable

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del setting |
| `key` | VARCHAR(100) UNIQUE | Clave única del setting |
| `value` | TEXT | Valor del setting |
| `description` | TEXT | Descripción del propósito |
| `updated_at` | TIMESTAMP | Última actualización |

---

## 12. Tabla: `audit_logs`

### Propósito
Registrar acciones administrativas para seguridad y trazabilidad.

### Razón de Creación
- **Seguridad**: Auditoría de cambios importantes
- **Trazabilidad**: Quién hizo qué y cuándo
- **Investigación**: Registro de IPs y user agents
- **Compliance**: Requisitos de auditoría y seguridad

### Campos y Su Propósito

| Campo | Tipo | Propósito |
|-------|------|-----------|
| `id` | UUID | Identificador único del log |
| `user_id` | UUID FK | Usuario que realizó la acción |
| `action` | VARCHAR(50) | Tipo de acción (CREATE, UPDATE, DELETE) |
| `table_name` | VARCHAR(50) | Tabla afectada |
| `record_id` | UUID | ID del registro afectado |
| `old_values` | JSONB | Valores antes del cambio |
| `new_values` | JSONB | Valores después del cambio |
| `ip_address` | VARCHAR(45) | IP del usuario |
| `user_agent` | TEXT | Navegador/dispositivo |
| `created_at` | TIMESTAMP | Fecha de la acción |

---

## Funciones Adicionales

### Triggers Automáticos
- **update_updated_at_column**: Actualiza automáticamente el campo `updated_at` en todas las tablas que lo tienen
- **Aplicado a**: users, leagues, teams, jornadas, matches, participations, predictions, prizes

### Vistas Optimizadas
- **user_rankings**: Vista agregada con estadísticas globales de usuarios
- **active_jornadas**: Vista de jornadas activas con estadísticas de partidos

### Índices Estratégicos
- Índices en campos frecuentemente usados en WHERE y JOIN
- Índices compuestos para optimizar consultas complejas
- Índices UNIQUE para garantizar integridad de datos

---

## Relaciones Principales

```
users (1) ─────── (N) participations
users (1) ─────── (N) prizes
users (1) ─────── (N) rankings
users (1) ─────── (N) notifications

leagues (1) ───── (N) teams
leagues (1) ───── (N) jornadas

teams (1) ─────── (N) matches (home_team_id)
teams (1) ─────── (N) matches (away_team_id)

jornadas (1) ──── (N) matches
jornadas (1) ──── (N) participations
jornadas (1) ──── (N) rankings

matches (1) ───── (N) predictions

participations (1) ─ (N) predictions
participations (1) ─ (N) prizes
```

---

## Notas de Implementación

1. **UUIDs vs INT**: Se usan UUIDs por seguridad y escalabilidad, especialmente para sistemas distribuidos
2. **Timestamps**: Todos usan TIMESTAMP WITH TIME ZONE para manejar zonas horarias correctamente
3. **Restricciones**: CHECK constraints aseguran validez de datos (enums, rangos)
4. **Soft Deletes**: Se usa `is_active` en lugar de DELETE físico para mantener historial
5. **JSONB**: Usado en audit_logs para flexibilidad en almacenar cambios

Esta estructura soporta completamente el flujo operativo especificado y las funcionalidades del MES 1.
