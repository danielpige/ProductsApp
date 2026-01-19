# Products App

Aplicación web para **gestionar un catálogo de productos** (listado, búsqueda, paginación y operaciones CRUD) consumiendo endpoints `/products`.

---

## Tabla de contenido

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Scripts disponibles](#scripts-disponibles)
- [Stack y dependencias](#stack-y-dependencias)
- [Estándares de código](#estándares-de-código)
- [Testing](#testing)
- [Linting](#linting)
- [Build y despliegue](#build-y-despliegue)
- [Estructura sugerida del proyecto](#estructura-sugerida-del-proyecto)
- [Convenciones y buenas prácticas](#convenciones-y-buenas-prácticas)
- [Troubleshooting](#troubleshooting)
- [Licencia](#licencia)

---

## Requisitos

- **Node.js**: recomendado **LTS** (18+ o 20+).
- **npm**: recomendado 9+ (incluido con Node).
- **Angular CLI**: se utiliza vía scripts de npm (no es necesario instalarlo globalmente).

---

## Instalación

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Levantar el servidor de desarrollo:

   ```bash
   npm run start
   ```

3. Abrir en el navegador:
   - `http://localhost:4200`

---

## Scripts disponibles

Estos scripts están definidos en `package.json`:

- **Desarrollo**
  - `ng serve`
  - wrapper para ejecutar `ng ...` desde npm

- **Build**
  - `npm run build` → `ng build`
  - `npm run watch` → `ng build --watch --configuration development`

- **Calidad**
  - `npm run lint` → `ng lint`

- **Tests (Jest)**
  - `npm run test` → `jest`
  - `npm run test:watch` → `jest --watch`
  - `npm run test:coverage` → `jest --coverage`

---

## Stack y dependencias

### Frontend

- **Angular**: `^20.3.x`
  - `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`,
    `@angular/platform-browser`, `@angular/platform-browser-dynamic`
- **RxJS**: `~7.8.0`
- **Zone.js**: `~0.15.0`
- **tslib**: `^2.3.0`

### Tooling / Dev

- **Angular CLI / Build**:
  - `@angular/cli` `^20.3.6`
  - `@angular/build` `^20.3.6`
- **TypeScript**: `~5.9.2`
- **ESLint + Angular ESLint**:
  - `eslint` `^9.39.1`
  - `angular-eslint` `20.7.0`
  - `typescript-eslint` `8.46.4`
- **Testing con Jest**:
  - `jest` `^30.2.0`
  - `jest-preset-angular` `^16.0.0`
  - `jest-environment-jsdom` `^30.2.0`
  - `@angular-builders/jest` `^20.0.0`
  - `@types/jest` `^30.0.0`
  - `jsdom` `^27.4.0`

---

## Estándares de código

### Prettier

El proyecto define configuración de Prettier directamente en `package.json`:

- `printWidth`: **100**
- `singleQuote`: **true**
- Override para `*.html` usando parser `angular`

Recomendación: habilita el formateo automático en tu editor (extensión Prettier) y aplica formato al guardar.

---

## Testing

Este proyecto utiliza **Jest** (en lugar de Karma/Jasmine).

- Ejecutar tests:

  ```bash
  npm run test
  ```

- Ejecutar en modo watch:

  ```bash
  npm run test:watch
  ```

- Cobertura:

  ```bash
  npm run test:coverage
  ```

### Convención sugerida

- Tests unitarios cerca del código:
  - `*.spec.ts` junto al archivo que se prueba.
- Enfocar pruebas en:
  - Servicios (consumo de API, mapeos, manejo de errores)
  - Componentes “dumb” (render y eventos)
  - Facades/containers (estado y side effects)

---

## Linting

El lint corre con Angular ESLint:

```bash
npm run lint
```

Recomendación operativa:

- Ejecuta `lint` antes de cada PR.
- Configura tu editor para mostrar errores ESLint en tiempo real.

---

## Build y despliegue

### Build de producción

```bash
npm run build
```

Salida típica:

- `dist/` (según configuración del workspace Angular)

### Build en modo watch (desarrollo)

```bash
npm run watch
```

---

## Estructura sugerida del proyecto

> Ajusta esta sección a tu estructura real si ya la tienes definida.

Estructura común y mantenible para Angular:

```
src/
  app/
    core/                 # singletons: interceptors, guards, config, ui services (toast)
    shared/               # componentes reutilizables, pipes, directivas, UI genérica
    domain/               # entidades, interfaces, casos de uso (use-cases)
    data-access           # Comunicación con la API, mappers, repos, dto
    features/
      products/
        pages/            # smart/container pages (ej: product-list)
  assets/
  environments/
```

---

## Convenciones y buenas prácticas

### Estado con Signals

- Mantener `computed()` **puro** (sin `set()`/`update()` dentro).
- Usar `effect()` para ajustes derivados que impliquen escrituras (`set/update`).
- Exponer a la vista un `vm` (view-model) simple y serializable.

### RxJS y suscripciones

- Usar `takeUntilDestroyed(inject(DestroyRef))` para prevenir memory leaks.
- Manejar `loading` vía `finalize()` y errores en el `subscribe({ error })`.

### Separación de responsabilidades (Smart/Dumb)

- **Smart/Container**:
  - Orquesta casos de uso
  - Maneja navegación (Router)
  - Maneja side effects (load, delete, toasts)
  - Construye `vm` (view-model) para la vista

- **Dumb/Presentational**:
  - Renderiza UI
  - Recibe `@Input()` y expone `@Output()`
  - Estado UI local permitido (por ejemplo: menú de acciones por fila)

---

## Troubleshooting

### 1) `ng` o `ng serve` no funciona

Asegúrate de instalar dependencias y ejecutar vía npm scripts:

```bash
npm install
npm run start
```

### 2) Fallos de tests por entorno DOM

El proyecto usa `jest-environment-jsdom`. Si un test depende de APIs del navegador:

- Mockea `window`, `localStorage`, `matchMedia`, etc.
- Evita dependencias de layout real (JSDOM no implementa todo).

### 3) Errores de linting

Ejecuta:

```bash
npm run lint
```

y corrige los errores según reglas de ESLint/Angular ESLint.

---

## Licencia

Proyecto privado (`"private": true`). Define una licencia aquí si planeas hacerlo público.
