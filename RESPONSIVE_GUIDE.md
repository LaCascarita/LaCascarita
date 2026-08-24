# Guía de Diseño Responsive - La Cascarita

## Principios Generales

Todas las páginas de La Cascarita deben ser completamente responsive para funcionar en:
- **Móviles**: 320px - 640px
- **Tablets**: 641px - 1024px  
- **Desktop**: 1025px+

## Breakpoints de Tailwind CSS

```css
sm: 640px   // Small devices (landscape phones, tablets)
md: 768px   // Medium devices (tablets, small laptops)
lg: 1024px  // Large devices (desktops)
xl: 1280px  // Extra large devices (large desktops)
```

## Patrones Responsive Esenciales

### 1. Contenedores Flexibles

```jsx
// ❌ Mal - fijo
<div style={{ maxWidth: '400px' }}>

// ✅ Bien - responsive
<div className="max-w-md w-full">
```

### 2. Grids Adaptativos

```jsx
// ❌ Mal - solo desktop
<div className="grid grid-cols-3 gap-6">

// ✅ Bien - responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
```

### 3. Texto Escalable

```jsx
// ❌ Mal - tamaño fijo
<h1 className="text-3xl">

// ✅ Bien - responsive
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
```

### 4. Padding Ajustable

```jsx
// ❌ Mal - padding fijo
<div className="p-8">

// ✅ Bien - responsive
<div className="p-4 sm:p-6 md:p-8">
```

### 5. Flexbox Responsive

```jsx
// ❌ Mal - siempre horizontal
<div className="flex gap-4">

// ✅ Bien - responsive
<div className="flex flex-col sm:flex-row gap-4">
```

## Componentes Base

### Botones

```jsx
<button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all text-sm sm:text-base">
  Botón
</button>
```

### Inputs

```jsx
<input className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base" />
```

### Cards

```jsx
<div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
  <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Título</h3>
</div>
```

### Headers

```jsx
<div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
  <div className="text-center sm:text-left">
    <h1 className="text-2xl sm:text-3xl font-bold text-white">Título</h1>
  </div>
</div>
```

## Tablas Responsive

```jsx
<div className="overflow-x-auto">
  <table className="w-full text-xs sm:text-sm">
    <thead>
      <tr className="border-b border-white/10">
        <th className="text-left text-slate-400 pb-3 px-2">Columna</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-white/5">
        <td className="py-3 px-2">Dato</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Imágenes Responsive

```jsx
<img 
  className="w-full h-auto object-cover rounded-lg"
  src="imagen.jpg"
  alt="Descripción"
/>
```

## Navegación Responsive

```jsx
<nav className="flex flex-wrap gap-2 mb-6 sm:mb-8">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      className={`px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
        activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-300'
      }`}
    >
      {tab.label}
    </button>
  ))}
</nav>
```

## Checklist para Nuevas Páginas

- [ ] Usar `min-h-screen` para contenedores principales
- [ ] Agregar `p-4 sm:p-6` al contenedor principal
- [ ] Usar `max-w-7xl mx-auto` para centrar contenido
- [ ] Aplicar `text-2xl sm:text-3xl` para títulos principales
- [ ] Usar `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` para grids
- [ ] Aplicar `flex flex-col sm:flex-row` para layouts flex
- [ ] Usar `w-full sm:w-auto` para botones y elementos de acción
- [ ] Agregar `text-xs sm:text-sm` para texto secundario
- [ ] Usar `p-4 sm:p-6` para cards y contenedores
- [ ] Probar en móvil (320px), tablet (768px), y desktop (1024px+)

## Errores Comunes a Evitar

### ❌ No usar estilos inline fijos
```jsx
// Mal
<div style={{ fontSize: '20px', padding: '20px' }}>

// Bien
<div className="text-base sm:text-lg p-4 sm:p-5">
```

### ❌ No usar valores de ancho fijos
```jsx
// Mal
<div style={{ width: '400px' }}>

// Bien
<div className="max-w-md w-full">
```

### ❌ No olvidar overflow en tablas
```jsx
// Mal
<table className="w-full">

// Bien
<div className="overflow-x-auto">
  <table className="w-full">
```

### ❌ No usar media queries CSS
```jsx
// Mal
<style>
  @media (max-width: 640px) {
    .container { padding: 1rem; }
  }
</style>

// Bien
<div className="p-4 sm:p-6">
```

## Herramientas de Prueba

1. **Chrome DevTools**: Toggle device toolbar (F12)
2. **Responsively App**: https://responsively.app/
3. **BrowserStack**: Para testing en dispositivos reales

## Referencias

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile First Design](https://www.smashingmagazine.com/2016/12/mobile-first-responsive-web-design/)
