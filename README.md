# La Cascarita - Plataforma de Quinielas

Plataforma web para quinielas de fútbol con sistema de usuarios, participaciones y rankings en tiempo real.

## 🚀 Características Implementadas

- ✅ Página de bienvenida con diseño moderno
- ✅ Sistema de registro de usuarios con validaciones
- ✅ Autenticación con Supabase
- ✅ Generación automática de ID único (LC-XXXXXX)
- ✅ Página de inicio de sesión
- ✅ Dashboard básico
- ✅ Diseño moderno y sobrio con Tailwind CSS

## 📋 Requisitos Previos

Antes de ejecutar el proyecto, necesitas configurar Supabase:

### 1. Crear cuenta en Supabase
- Ve a [supabase.com](https://supabase.com)
- Crea una cuenta gratuita
- Crea un nuevo proyecto

### 2. Configurar la base de datos
En el panel de Supabase, ejecuta el siguiente SQL en el SQL Editor:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id VARCHAR(20) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(10) NOT NULL,
  auth_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth_id ON users(auth_id);
```

### 3. Configurar autenticación
- En tu proyecto Supabase, ve a Authentication > Settings
- Habilita "Email auth" (ya viene habilitado por defecto)
- No necesitas configurar email verification ya que usamos emails temporales

### 4. Obtener credenciales
- Ve a Project Settings > API
- Copia tu `Project URL` y `anon public key`

### 5. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_proyecto_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 🛠️ Instalación y Ejecución

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
Copia el archivo `.env.example` a `.env` y completa las credenciales de Supabase.

3. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
├── pages/          # Páginas de la aplicación
│   ├── Welcome.jsx    # Página de bienvenida
│   ├── Register.jsx   # Formulario de registro
│   ├── Login.jsx      # Página de inicio de sesión
│   └── Dashboard.jsx  # Panel principal
├── lib/            # Utilidades y configuraciones
│   └── supabase.js    # Cliente de Supabase
└── styles/         # Estilos globales
```

## 🎨 Diseño

El diseño utiliza:
- **Tailwind CSS** para estilos
- **Gradientes oscuros** (slate-900 a slate-800)
- **Colores sobrios** con acentos en verde esmeralda
- **Glassmorphism** (efecto de vidrio esmerilado)
- **Responsive design** para móviles y escritorio

## 🔐 Funcionalidades de Registro

El sistema de registro incluye:
- **Usuario único**: Solo letras, números y guiones bajos (no modificable después)
- **Teléfono**: Validación de 10 dígitos
- **Contraseña**: Mínimo 6 caracteres con confirmación
- **Aceptación de términos**: Checkbox obligatorio
- **ID automático**: Generación de ID en formato LC-XXXXXX

## 📝 Próximos Pasos

Para completar el proyecto según el documento:

1. **Selección de Quinielas**
   - Media Semana (9 partidos)
   - Fin de Semana (9 partidos Liga MX)
   - Dominical (7 partidos)

2. **Captura de Pronósticos**
   - Selección Local/Empate/Visitante
   - Generación de folio (LC-FS-XXXXXX)

3. **Sistema de Pagos**
   - Integración con Mercado Pago
   - Validación automática de pagos

4. **Rankings en Tiempo Real**
   - Actualización después de cada partido
   - Publicación de participantes

5. **Cálculo de Ganadores**
   - Algoritmo automático de resultados
   - Publicación de premios

## 🤝 Soporte

Para dudas o soporte, contactar a través del canal oficial de WhatsApp de La Cascarita.

---

**Desarrollado con React + Vite + Supabase + Tailwind CSS**