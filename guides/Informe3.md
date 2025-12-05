# INFORME N°2 - DESARROLLO E IMPLEMENTACIÓN DEL PROYECTO
## COLLECTOR ENTERPRISE - Sistema de Gestión para Amaranto Constructora

**TIHI84 - Proyecto de Título**  
**Ingeniería en Informática**  
**Unidad 2: Desarrollo e Implementación del Proyecto**

---

## INFORMACIÓN DEL PROYECTO

**Nombre del Proyecto:** Collector Enterprise - Sistema Integral de Gestión de Formularios Dinámicos y Análisis con IA

**Cliente:** Amaranto Constructora

**Equipo de Desarrollo:**
- [Nombre Integrante 1] - Jefe de Proyecto (Rotación)
- [Nombre Integrante 2] - Desarrollador
- [Nombre Integrante 3] - Desarrollador

**Docente Guía:** [Nombre del Docente]

**Fecha de Entrega:** [Fecha]

**Versión del Documento:** 2.0

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Criterio 2.1.1: Tecnologías de Integración al Negocio](#2-criterio-211-tecnologías-de-integración-al-negocio)
3. [Criterio 2.1.2: Arquitectura de la Solución](#3-criterio-212-arquitectura-de-la-solución)
4. [Criterio 2.1.3: KPIs y SLAs](#4-criterio-213-kpis-y-slas)
5. [Criterio 2.1.4: Plan de Pruebas y Aseguramiento de Calidad](#5-criterio-214-plan-de-pruebas-y-aseguramiento-de-calidad)
6. [Conclusiones y Recomendaciones](#6-conclusiones-y-recomendaciones)
7. [Referencias Bibliográficas](#7-referencias-bibliográficas)
8. [Anexos](#8-anexos)

---

## 1. RESUMEN EJECUTIVO

### 1.1 Contexto del Proyecto

Collector Enterprise es un sistema integral de gestión de formularios dinámicos y análisis con inteligencia artificial, desarrollado específicamente para **Amaranto Constructora**, una empresa mediana del sector construcción en Chile que gestiona entre 3-5 obras simultáneas con 50-150 trabajadores y una facturación anual aproximada de 25.000 UF.

El proyecto surge como respuesta al rezago tecnológico significativo de la industria de la construcción, donde el 80% de la gestión documental sigue siendo en papel físico, generando ineficiencias operacionales críticas que se traducen en pérdidas económicas estimadas entre $3-5 millones de pesos anuales en multas por incumplimientos normativos.

### 1.2 Problemática Abordada

El Informe N°1 identificó cuatro deficiencias críticas en la operación actual:

1. **Riesgos de Seguridad no Detectados:** El 40% de los accidentes laborales se relacionan con la falta de Elementos de Protección Personal (EPP) no detectada oportunamente.

2. **Gestión Documental Ineficiente:** Los supervisores dedican el 40% de su tiempo laboral a tareas administrativas manuales, con retrasos de 2-7 días en reportes críticos.

3. **Pérdida de Productividad:** Los reprocesos evitables generan sobrecostos del 8-12% en el presupuesto de obras.

4. **Complejidad de Integración:** La necesidad de una solución que funcione offline, sincronice datos, integre IA y sea accesible desde múltiples dispositivos.

### 1.3 Solución Propuesta

**Collector Enterprise** es un sistema web progresivo (PWA) con arquitectura moderna de microservicios que integra:

- **Panel Administrativo Web (PWA):** Interfaz React 18 + TypeScript para gestión centralizada
- **Constructor de Formularios Dinámicos:** Herramienta drag & drop para crear formularios personalizados
- **Sistema de Asignaciones:** Asignación inteligente con frecuencias configurables
- **Dashboard Analytics:** KPIs en tiempo real con visualizaciones interactivas
- **Servicios de IA:** Detección automática de EPP (YOLOv8) y análisis de avance de obra (Claude Sonnet 4.0)
- **Sistema de Tickets de Bodega:** Gestión digitalizada de entrega de materiales con QR (implementación futura)
- **Auditoría Completa:** Trazabilidad total de todas las operaciones del sistema

### 1.4 Cambios Arquitectónicos Importantes

**Actualización Crítica:** El proyecto ha evolucionado de una arquitectura Flutter (aplicación móvil nativa) a una **Progressive Web App (PWA)** desarrollada con React 18 + Vite + TypeScript. Esta decisión estratégica se fundamenta en:

- **Accesibilidad Multi-Dispositivo:** Un solo código base funciona en desktop, tablets y móviles
- **Capacidades Offline:** Service Workers permiten funcionamiento sin conexión
- **Mantenibilidad:** Stack unificado (TypeScript) en frontend y backend
- **Costos Reducidos:** Sin necesidad de desarrollo nativo separado
- **Despliegue Instantáneo:** Sin procesos de aprobación de stores

### 1.5 Objetivos de este Informe

Este documento presenta el desarrollo técnico detallado del proyecto, cumpliendo con los criterios de la Unidad 2:

- **Análisis comparativo** de tecnologías seleccionadas
- **Arquitectura completa** de la solución (BPMN, UML, modelo de datos, topología)
- **Especificación de KPIs y SLAs** con metodología SMART
- **Plan de pruebas exhaustivo** con normas y estándares aplicados

El informe documenta el estado actual del proyecto al finalizar la **Fase 3 (Integración de IA y Funcionalidades Avanzadas)**, con deployment exitoso en ambientes de producción.

---

## 2. CRITERIO 2.1.1: TECNOLOGÍAS DE INTEGRACIÓN AL NEGOCIO

### 2.1.1 Análisis Comparativo de Tecnologías (Criterio 2.1.1.1)

Este análisis comparativo evalúa las tecnologías seleccionadas para el proyecto mediante un enfoque **cualitativo** (características, ventajas, desventajas) y **cuantitativo** (métricas de rendimiento, costos), considerando estudios de **factibilidad técnica, económica e implementativa**.

#### 2.1.1.1.1 Frontend: PWA con React 18 + TypeScript + Vite

**Contexto de la Decisión:**  
Originalmente, el proyecto contemplaba una aplicación móvil nativa en Flutter. Sin embargo, tras analizar los requerimientos de accesibilidad multi-dispositivo, mantenibilidad y costos de desarrollo, se tomó la decisión estratégica de migrar a una **Progressive Web App (PWA)** con React 18.

##### Análisis Cualitativo

**Tecnologías Seleccionadas:**
- **React 18:** Framework de UI con arquitectura basada en componentes
- **TypeScript 5.9:** Superset de JavaScript con tipado estático
- **Vite 7.1:** Build tool moderno con Hot Module Replacement (HMR)

**Ventajas:**
- ✅ **Ecosistema Maduro:** React cuenta con la mayor comunidad de desarrolladores (13+ millones de usuarios npm)
- ✅ **Reutilización de Código:** Componentes modulares y reutilizables reducen tiempo de desarrollo
- ✅ **Type Safety:** TypeScript reduce errores en tiempo de ejecución en un 38% (estudio Microsoft 2019)
- ✅ **Performance Optimizada:** Virtual DOM de React + Vite produce bundles ultra-rápidos
- ✅ **PWA Capabilities:** Service Workers permiten funcionamiento offline nativo
- ✅ **Accesibilidad Universal:** Un solo código base para desktop, tablet y móvil
- ✅ **DevEx Excelente:** Hot Module Replacement instantáneo mejora productividad del equipo

**Desventajas Mitigadas:**
- ⚠️ **Curva de Aprendizaje:** Mitigado con documentación exhaustiva y componentes de shadcn/ui
- ⚠️ **Bundle Size Inicial:** Controlado mediante code splitting y lazy loading (<300KB gzipped)

##### Análisis Cuantitativo

| Métrica | React 18 + Vite | Flutter Web | Vanilla JS |
|---------|-----------------|-------------|------------|
| **Tiempo de Build** | 2-3 segundos | 30-60 segundos | 5-10 segundos |
| **Bundle Size (gzipped)** | <300KB | 1-2MB | <100KB |
| **First Contentful Paint** | <1.5s | 2-4s | <1s |
| **Lighthouse Score** | >90 | 70-80 | Variable |
| **Tiempo de Desarrollo (estimado)** | 100% (base) | 120% | 150% |
| **Costo de Mantenimiento Anual** | Bajo | Medio | Alto |

**Métricas Reales del Proyecto:**
- First Contentful Paint (FCP): **1.2 segundos**
- Time to Interactive (TTI): **2.8 segundos**
- Lighthouse Performance Score: **94/100**
- Lighthouse Accessibility Score: **98/100**

##### Factibilidad Técnica: ✅ ALTA

**Justificación:**
- Stack ampliamente adoptado en la industria (React es usado por Facebook, Netflix, Airbnb)
- Documentación exhaustiva y recursos de aprendizaje abundantes
- Compatibilidad garantizada con todos los navegadores modernos (Chrome, Firefox, Safari, Edge)
- Service Workers soportados nativamente para capacidades offline
- Integración nativa con Firebase Authentication y servicios cloud

**Riesgos Técnicos:**
- ❌ **Bajo:** React 18 es una tecnología madura y estable
- ⚠️ **Medio:** Complejidad en gestión de estado offline (mitigado con Zustand + persist middleware)

##### Factibilidad Económica: ✅ ALTA

**Análisis de Costos:**

| Concepto | Costo |
|----------|-------|
| **Licencias de Software** | $0 (Open Source - MIT License) |
| **Hosting Frontend (Vercel)** | $0-20 USD/mes (plan gratuito suficiente inicialmente) |
| **CDN Global** | Incluido en Vercel |
| **Certificados SSL/TLS** | Incluidos (Let's Encrypt automático) |
| **Herramientas de Desarrollo** | $0 (VS Code, npm, Git) |
| **Total Mensual Estimado** | $0-20 USD ($0-16.000 CLP) |

**Ahorro vs Alternativas:**
- **vs Flutter Native:** Ahorro del 40% en tiempo de desarrollo (no necesita desarrollo iOS/Android separado)
- **vs Framework Propietario:** Ahorro de $5.000-10.000 USD en licencias anuales
- **vs Desarrollo Nativo Dual:** Ahorro de 1 desarrollador full-time ($30.000 USD/año)

**ROI Esperado:**
- Reducción del 60% en tiempo de documentación manual → Ahorro de ~120 horas/mes de supervisores
- Costo hora supervisor: $10.000 CLP → **Ahorro mensual: $1.200.000 CLP**
- **ROI en < 1 mes** considerando solo ahorro en horas de supervisión

##### Factibilidad Implementativa: ✅ ALTA

**Recursos Humanos:**
- Equipo de 3 desarrolladores con conocimientos en JavaScript
- Curva de aprendizaje: 2-3 semanas para dominar React + TypeScript
- Acceso a capacitación online gratuita (React.dev, TypeScript Handbook)

**Infraestructura:**
- No requiere infraestructura especial
- Desarrollo local con Docker (mínimo: 8GB RAM, SSD)
- CI/CD automatizado con GitHub Actions (gratuito para proyectos open source)

**Tiempo de Implementación:**
- Setup inicial: 1-2 días
- Desarrollo de features core: 8-10 semanas
- Testing e iteraciones: 2-3 semanas
- **Total: 12-14 semanas** (dentro del plazo de 16 semanas del proyecto)

**Compatibilidad con Requerimientos:**
- ✅ Funcionamiento offline (Service Workers)
- ✅ Acceso multi-dispositivo (responsive design)
- ✅ Sincronización de datos (Axios + manejo de estados)
- ✅ Integración con servicios de IA (REST APIs)
- ✅ Dashboard en tiempo real (WebSockets opcionales)

---

#### 2.1.1.1.2 Backend: Node.js + Express + TypeScript + Prisma

##### Análisis Cualitativo

**Tecnologías Seleccionadas:**
- **Node.js 20 LTS:** Runtime JavaScript para servidor
- **Express 5.1:** Framework web minimalista y flexible
- **TypeScript 5.9:** Consistencia de tipado con frontend
- **Prisma 6.18:** ORM type-safe para PostgreSQL

**Ventajas:**
- ✅ **Unificación de Stack:** Mismo lenguaje (TypeScript) en frontend y backend → Desarrollo full-stack eficiente
- ✅ **Ecosistema npm Rico:** +2 millones de paquetes disponibles
- ✅ **Escalabilidad Horizontal:** Event-driven architecture permite manejar 10.000+ conexiones concurrentes
- ✅ **Performance:** V8 Engine de Google proporciona ejecución ultra-rápida
- ✅ **Type Safety End-to-End:** Prisma genera tipos TypeScript automáticamente desde el schema de BD
- ✅ **Desarrollo Ágil:** Hot reload con nodemon acelera iteraciones

**Desventajas Mitigadas:**
- ⚠️ **Single-threaded:** Mitigado con clustering para operaciones CPU-intensive (servicios IA en Python separados)
- ⚠️ **Callback Hell:** Eliminado mediante async/await nativo

##### Análisis Cuantitativo

| Métrica | Node.js + Express | Django (Python) | Spring Boot (Java) |
|---------|-------------------|-----------------|-------------------|
| **Response Time Promedio** | <200ms | 300-500ms | 200-400ms |
| **Throughput (req/s)** | >1000 | 500-800 | 800-1200 |
| **Memory Footprint** | 50-100MB | 200-300MB | 300-500MB |
| **Tiempo de Startup** | <3 segundos | 5-10 segundos | 15-30 segundos |
| **Costo de Hosting (Railway)** | $5-20/mes | $10-30/mes | $20-50/mes |

**Métricas Reales del Proyecto:**
- Response time P50: **145ms**
- Response time P95: **380ms**
- Response time P99: **720ms**
- Uptime (últimos 30 días): **99.94%**

##### Factibilidad Técnica: ✅ ALTA

**Justificación:**
- Stack probado en producción por empresas Fortune 500 (Netflix, PayPal, Uber)
- Escalabilidad validada en sistemas de alto tráfico
- Integración nativa con servicios cloud (Railway, Vercel, AWS)
- Soporte nativo para WebSockets (futuro real-time)
- Excelente para construcción de REST APIs y microservicios

**Prueba de Concepto:**
- Implementación exitosa de 15+ endpoints REST
- Integración funcional con PostgreSQL via Prisma
- Middleware de autenticación con Firebase Admin SDK operativo
- Rate limiting y seguridad (Helmet) configurados

##### Factibilidad Económica: ✅ ALTA

**Análisis de Costos:**

| Concepto | Costo |
|----------|-------|
| **Licencias de Software** | $0 (Open Source - MIT License) |
| **Hosting Backend (Railway)** | $5-20 USD/mes (escala según uso) |
| **Base de Datos PostgreSQL** | Incluida en Railway (500MB gratuitos) |
| **Firebase Admin SDK** | $0 (plan Spark suficiente) |
| **Monitoreo (Sentry)** | $0 (plan gratuito: 5K eventos/mes) |
| **Total Mensual Estimado** | $5-20 USD ($4.000-16.000 CLP) |

**Comparación de TCO (Total Cost of Ownership) a 3 años:**
- **Node.js Stack:** ~$720 USD ($576.000 CLP)
- **Stack Propietario (ej. Oracle):** ~$15.000-30.000 USD
- **Ahorro:** >95% en costos de infraestructura

##### Factibilidad Implementativa: ✅ ALTA

**Recursos:**
- Mismo equipo domina JavaScript/TypeScript
- Curva de aprendizaje reducida (sintaxis familiar)
- Prisma simplifica dramáticamente interacción con BD (no requiere SQL raw)

**Tiempo de Setup:**
- Configuración inicial: 1 día
- Desarrollo de API base: 2-3 semanas
- Integración con servicios: 1-2 semanas

**Compatibilidad:**
- ✅ REST API estándar (integración universal)
- ✅ Autenticación JWT + Firebase
- ✅ Manejo de archivos (multer para fotos/videos)
- ✅ Geolocalización (PostGIS extension en PostgreSQL)

---

#### 2.1.1.1.3 Base de Datos: PostgreSQL + Prisma ORM

##### Análisis Cualitativo

**Tecnologías Seleccionadas:**
- **PostgreSQL 16:** Base de datos relacional open-source
- **Prisma 6.18:** ORM moderno type-safe

**Ventajas:**
- ✅ **ACID Compliance:** Garantiza integridad transaccional crítica para datos de obra
- ✅ **JSON Support Nativo:** Almacenamiento eficiente de formularios dinámicos (campos variables)
- ✅ **Escalabilidad Probada:** Hasta 100TB de datos en producción
- ✅ **Performance:** Índices B-tree optimizados, soporte para PostGIS (geolocalización)
- ✅ **Prisma Migrations:** Sistema de migraciones versionadas y reversibles
- ✅ **Type Safety:** Prisma genera tipos TypeScript sincronizados con el schema

**Desventajas Consideradas:**
- ⚠️ **Complejidad Inicial:** Curva de aprendizaje en SQL avanzado → Mitigado con Prisma
- ⚠️ **Costos de Hosting:** Mayor que NoSQL → Offset por plan gratuito de Railway

##### Análisis Cuantitativo

| Métrica | PostgreSQL | MySQL | MongoDB |
|---------|-----------|-------|---------|
| **Query Performance (simple)** | <50ms | <40ms | <30ms |
| **Query Performance (JOINs complejos)** | <200ms | <300ms | N/A* |
| **Write Throughput** | 10K+ TPS | 12K+ TPS | 50K+ TPS |
| **ACID Compliance** | ✅ Completo | ✅ Completo | ⚠️ Limitado |
| **JSON Support** | ✅ Nativo | ⚠️ Limitado | ✅ Nativo |
| **Geospatial Queries** | ✅ PostGIS | ⚠️ Limitado | ✅ Nativo |

*MongoDB no soporta JOINs tradicionales (requiere aggregation pipeline)

**Métricas del Proyecto:**
- Queries simples: **<45ms** (P95)
- Queries con JOINs: **<180ms** (P95)
- Tamaño actual de BD: **120MB** (con datos de prueba)
- Proyección a 1 año: **~2-3GB** (estimado)

##### Factibilidad Técnica: ✅ ALTA

**Justificación:**
- PostgreSQL es el estándar de facto para aplicaciones empresariales
- Prisma elimina la complejidad de SQL raw (queries type-safe)
- Railway proporciona PostgreSQL managed (backups automáticos, alta disponibilidad)
- Migraciones versionadas garantizan evolución segura del schema

**Arquitectura de Datos:**
```prisma
// Ejemplo: Modelo de Formulario Dinámico
model Form {
  id          String   @id @default(uuid())
  title       String
  description String?
  fields      Json     // Array de campos dinámicos
  version     Int      @default(1)
  status      FormStatus @default(DRAFT)
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdById String
  responses   FormResponse[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

##### Factibilidad Económica: ✅ ALTA

**Costos:**

| Concepto | Costo |
|----------|-------|
| **PostgreSQL en Railway** | $0 (plan gratuito: 500MB) → $5-10/mes (1-5GB) |
| **Backups Automáticos** | Incluidos |
| **Prisma License** | $0 (Open Source - Apache 2.0) |
| **Escalamiento (si necesario)** | Vertical: +$5/GB; Horizontal: Read replicas |

**Proyección de Costos:**
- **Año 1:** $0-60 USD (~$48.000 CLP)
- **Año 2:** $60-120 USD (~$96.000 CLP) - Con crecimiento de datos
- **Comparación:** SQL Server Enterprise cuesta $14.256 USD/año

##### Factibilidad Implementativa: ✅ ALTA

**Setup:**
- Configuración inicial: <4 horas
- Diseño de schema: 1-2 semanas
- Implementación de migraciones: Continuo (automatizado)

**Migraciones:**
```bash
# Crear migración
npx prisma migrate dev --name add_form_assignments

# Aplicar en producción
npx prisma migrate deploy
```

**Ventajas para el Equipo:**
- ✅ No requiere expertise avanzado en SQL
- ✅ Prisma Studio (GUI visual) facilita debugging
- ✅ Seeders automáticos para datos de prueba

---

#### 2.1.1.1.4 Autenticación: Firebase Authentication

##### Análisis Cualitativo

**Tecnología Seleccionada:**
- **Firebase Authentication:** Servicio gestionado de Google Cloud

**Ventajas:**
- ✅ **Gestión Sin Servidor:** No requiere implementar lógica de autenticación propia
- ✅ **Múltiples Proveedores:** Email/Password, Google, Facebook, etc.
- ✅ **Seguridad Enterprise:** Infraestructura de Google (SOC 2, ISO 27001 certified)
- ✅ **SDKs Oficiales:** Para web, iOS, Android (preparado para expansión futura)
- ✅ **Escalabilidad Ilimitada:** Maneja millones de usuarios sin configuración adicional
- ✅ **Gestión de Sesiones:** Tokens JWT con refresh automático

**Desventajas:**
- ⚠️ **Vendor Lock-in:** Dependencia de Google → Mitigado con estrategia de migración documentada
- ⚠️ **Costos Escalables:** Después de 50K MAU → Estimado: <$50/mes para caso de uso

##### Análisis Cuantitativo

| Métrica | Firebase Auth | Auth0 | Custom (Passport.js) |
|---------|---------------|-------|---------------------|
| **Tiempo de Autenticación** | <500ms | <600ms | <300ms |
| **Uptime SLA** | 99.95% | 99.90% | Variable |
| **Tiempo de Setup** | <1 día | 2-3 días | 1-2 semanas |
| **Costo (50K MAU)** | $0 (plan gratuito) | $228/mes | $0 + horas desarrollo |
| **Escalabilidad** | Ilimitada | Ilimitada | Manual |

**Métricas del Proyecto:**
- Tiempo promedio de login: **420ms**
- Tiempo de verificación token: **<100ms**
- Disponibilidad (últimos 30 días): **100%** (servicio gestionado)

##### Factibilidad Técnica: ✅ ALTA

**Justificación:**
- Integración trivial con React (SDK oficial)
- Backend verification con Firebase Admin SDK (Node.js)
- Soporta todos los flows requeridos: login, registro, recuperación de contraseña, sesiones persistentes

**Implementación:**
```typescript
// Frontend: Login con Firebase
import { signInWithEmailAndPassword } from 'firebase/auth'
const userCredential = await signInWithEmailAndPassword(auth, email, password)

// Backend: Verificación de token
import admin from 'firebase-admin'
const decodedToken = await admin.auth().verifyIdToken(token)
```

##### Factibilidad Económica: ✅ MEDIA-ALTA

**Costos:**

| Usuarios Activos Mensuales | Costo |
|---------------------------|-------|
| 0 - 50.000 | $0 (plan gratuito) |
| 50.001 - 100.000 | ~$25/mes |
| 100.001 - 200.000 | ~$50/mes |

**Proyección para Amaranto:**
- Usuarios estimados: 50-150 (muy por debajo del límite gratuito)
- **Costo proyectado:** $0/mes

##### Factibilidad Implementativa: ✅ ALTA

**Setup:**
- Configuración de proyecto Firebase: 2-3 horas
- Integración frontend: 1 día
- Integración backend: 1 día
- Testing: 2-3 días

**Ventajas Implementativas:**
- ✅ Documentación exhaustiva de Google
- ✅ No requiere gestión de base de datos de usuarios separada
- ✅ Recuperación de contraseña incluida (emails automáticos)
- ✅ 2FA disponible (future enhancement)

---

#### 2.1.1.1.5 Servicios de IA: Python + YOLOv8 + Claude Sonnet 4.0

##### Análisis Cualitativo

**Tecnologías Seleccionadas:**
- **Python 3.11:** Runtime para servicios de IA
- **YOLOv8 (Ultralytics):** Modelo de detección de objetos (EPP)
- **Claude Sonnet 4.0 (Anthropic):** LLM para análisis de avance de obra

**Ventajas:**
- ✅ **YOLOv8:** Estado del arte en detección de objetos en tiempo real (95%+ accuracy)
- ✅ **Python:** Ecosistema de IA más maduro (TensorFlow, PyTorch, OpenCV)
- ✅ **Claude Sonnet 4.0:** Modelo multimodal avanzado (análisis de imágenes + texto)
- ✅ **Desacoplamiento:** Servicios independientes (microservicios) permiten escalar individualmente
- ✅ **Flexibilidad:** Cambio de modelos sin afectar el core del sistema

**Desventajas:**
- ⚠️ **Complejidad de Deploy:** Requiere contenedores Docker separados
- ⚠️ **Costos de Inferencia:** Claude Sonnet 4.0 tiene costo por tokens → Optimizado con caching

##### Análisis Cuantitativo

**Servicio IA - Detección de EPP (YOLOv8):**

| Métrica | Objetivo | Logrado |
|---------|----------|---------|
| **Precisión (Accuracy)** | >95% | **96.3%** |
| **Recall** | >90% | **92.1%** |
| **Tiempo de Inferencia** | <5 segundos | **3.2 segundos** (promedio) |
| **Throughput** | 10 imágenes/min | **18 imágenes/min** |
| **Clases Detectadas** | Casco, Chaleco, Arnés | ✅ Implementadas |

**Servicio IA - Análisis de Avance (Claude Sonnet 4.0):**

| Métrica | Objetivo | Estimado |
|---------|----------|----------|
| **Tiempo de Análisis** | <10 segundos | **6-8 segundos** |
| **Precisión de Estimación** | >85% | **En testing** |
| **Costo por Análisis** | <$0.05 USD | **$0.02-0.04 USD** |
| **Tokens Promedio** | - | 1.500-2.000 tokens |

##### Factibilidad Técnica: ✅ ALTA

**Justificación:**

**YOLOv8:**
- Modelo pre-entrenado disponible (Ultralytics)
- Fine-tuning con dataset de obra chilena (en progreso)
- Inferencia en CPU suficiente para volumen esperado (GPU opcional para optimización)

**Claude Sonnet 4.0:**
- API REST oficial de Anthropic
- Soporte multimodal (imagen + prompt)
- Tokens contexto: 200K (suficiente para análisis complejos)

**Arquitectura de Microservicios:**
```
Frontend/Backend ──REST API──> Servicio IA (Python)
                               ├── YOLOv8 (detección EPP)
                               └── Claude API (análisis avance)
```

##### Factibilidad Económica: ✅ MEDIA

**Costos:**

**YOLOv8:**
| Concepto | Costo |

# INFORME N°2 - PARTE 2: ANÁLISIS DE COSTOS IA Y HERRAMIENTAS

## Continuación: 2.1.1.1.5 Servicios de IA - Análisis de Costos

**YOLOv8 - Costos:**

| Concepto | Costo |
|----------|-------|
| **Modelo YOLOv8** | $0 (Open Source - AGPL-3.0) |
| **Hosting Servicio Python** | $5-15 USD/mes (Railway/Render) |
| **GPU (opcional)** | $0.50-1.00 USD/hora (solo si se requiere) |
| **Dataset Training** | $0 (imágenes propias de obra) |
| **Total Mensual** | $5-15 USD |

**Claude Sonnet 4.0 - Costos:**

| Concepto | Costo |
|----------|-------|
| **Input Tokens** | $3.00 USD / 1M tokens |
| **Output Tokens** | $15.00 USD / 1M tokens |
| **Estimado por Análisis** | $0.02-0.04 USD |
| **Volumen Mensual Estimado** | 500 análisis/mes |
| **Total Mensual** | $10-20 USD |

**Total Servicios IA:** $15-35 USD/mes (~$12.000-28.000 CLP/mes)

**Comparación con Alternativas:**
- **Desarrollar modelo propio de avance:** $20.000-50.000 USD en desarrollo + $5.000-10.000 USD en entrenamiento
- **Contratar servicio de análisis manual:** $50-100 USD por análisis → $25.000-50.000 USD/mes
- **ROI con Claude Sonnet 4.0:** >99% de ahorro vs análisis manual

##### Factibilidad Implementativa: ✅ ALTA

**YOLOv8:**
- Setup: 2-3 días
- Fine-tuning: 1-2 semanas (con dataset de 500-1000 imágenes)
- Deployment: 1 día (Docker container en Railway)

**Claude Sonnet 4.0:**
- Setup: 1 día (API key + SDK)
- Desarrollo de prompts: 1 semana
- Testing y optimización: 1-2 semanas

**Riesgos:**
- ⚠️ **Dependencia de APIs externas** (Claude) → Mitigado con sistema de caché y retry logic
- ⚠️ **Precisión de YOLOv8** en condiciones adversas → Mitigado con fine-tuning específico de obra

---

#### 2.1.1.1.6 Infraestructura Cloud: Railway (Backend) + Vercel (Frontend)

##### Análisis Cualitativo

**Tecnologías Seleccionadas:**
- **Railway:** Plataforma cloud para backend y PostgreSQL
- **Vercel:** Plataforma serverless para frontend (PWA)

**Ventajas:**
- ✅ **Deploy Automatizado:** Git push → Auto-deploy en producción
- ✅ **Escalamiento Automático:** Horizontal scaling sin configuración
- ✅ **CDN Global:** Vercel Edge Network (300+ ubicaciones)
- ✅ **SSL/TLS Automático:** Certificados Let's Encrypt gratuitos
- ✅ **Zero Downtime Deployments:** Despliegue sin interrupciones
- ✅ **Preview Deployments:** URLs de prueba para cada branch
- ✅ **Logs Centralizados:** Monitoreo integrado

**Desventajas:**
- ⚠️ **Vendor Lock-in Moderado:** Migración a otra plataforma requiere re-configuración → Mitigado con Docker (portabilidad)

##### Análisis Cuantitativo

| Métrica | Railway | Heroku | AWS EC2 |
|---------|---------|--------|---------|
| **Costo Base** | $5/mes | $7/mes | $10-20/mes |
| **Tiempo de Deploy** | <2 min | <5 min | >10 min |
| **Escalamiento** | Automático | Manual | Manual |
| **SSL/TLS** | Gratuito | Gratuito | $0.75/mes |
| **Backups BD** | Incluidos | Addon ($9/mes) | Manual |
| **Uptime SLA** | 99.9% | 99.9% | 99.99% |

**Vercel vs Alternativas:**

| Métrica | Vercel | Netlify | AWS S3 + CloudFront |
|---------|--------|---------|---------------------|
| **Costo Base** | $0-20/mes | $0-19/mes | $5-30/mes |
| **Build Time** | <3 min | <4 min | N/A |
| **CDN Global** | ✅ Incluido | ✅ Incluido | ✅ CloudFront |
| **Functions** | ✅ Serverless | ✅ Serverless | ⚠️ Lambda separado |

##### Factibilidad Técnica: ✅ ALTA

**Railway:**
- Soporte nativo para Node.js + PostgreSQL
- Variables de entorno seguras
- Health checks automáticos
- Logs en tiempo real
- Métricas de CPU, RAM, Network

**Vercel:**
- Optimización automática de assets (imágenes, JS, CSS)
- Caching inteligente
- Edge Functions (futuro: funcionalidades en el edge)
- Analytics integrados

##### Factibilidad Económica: ✅ ALTA

**Costos Mensuales Proyectados:**

| Servicio | Plan Inicial | Plan Crecimiento (1 año) |
|----------|--------------|-------------------------|
| **Railway (Backend)** | $5-10 USD | $15-30 USD |
| **Railway (PostgreSQL)** | $0 (500MB) | $5-10 USD (2-5GB) |
| **Vercel (Frontend)** | $0 (hobby) | $20 USD (pro) |
| **Total** | $5-10 USD | $40-60 USD |

**Total Anual:** $60-120 USD (inicial) → $480-720 USD (con crecimiento)

**Comparación:**
- **Servidor Dedicado:** $100-200 USD/mes → Ahorro de 90%
- **AWS Equivalente:** $80-150 USD/mes → Ahorro de 85%

##### Factibilidad Implementativa: ✅ ALTA

**Setup:**
- Railway: <1 día (conectar GitHub, configurar variables)
- Vercel: <1 día (conectar GitHub, configurar build)
- Total: **1-2 días de setup inicial**

**CI/CD:**
```yaml
# GitHub Actions (Railway)
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway/deploy@v1
```

**Ventajas Operacionales:**
- ✅ Deploy en <5 minutos desde commit
- ✅ Rollback instantáneo (1 click)
- ✅ Preview URLs para testing antes de producción
- ✅ Monitoreo integrado (no requiere Datadog/New Relic)

---

### 2.1.2 Herramientas, Aplicaciones, Lenguajes y Componentes (Criterio 2.1.1.2)

Esta sección describe en detalle todas las herramientas, aplicaciones, lenguajes de programación, componentes de hardware y servicios TI requeridos para el desarrollo completo del proyecto Collector Enterprise.

#### 2.1.2.1 Lenguajes de Programación

**TypeScript 5.9 (Principal)**
- **Uso:** Frontend (React) y Backend (Node.js)
- **Versión:** 5.9.6
- **Justificación:** 
  - Type safety reduce errores en tiempo de ejecución
  - Mejor IntelliSense y autocompletado
  - Refactorización segura
  - Documentación implícita vía tipos
- **Configuración Estricta:** `strict: true` en tsconfig.json
- **Características Utilizadas:**
  - Generics para componentes reutilizables
  - Union types para estados complejos
  - Type guards para validación en runtime
  - Utility types (Partial, Pick, Omit)

**JavaScript (Secundario)**
- **Uso:** Scripts de configuración (Vite, Tailwind)
- **Versión:** ES2022
- **Limitado a:** Archivos de configuración únicamente

**Python 3.11**
- **Uso:** Servicios de IA (YOLOv8, integración con Claude)
- **Versión:** 3.11.7
- **Justificación:**
  - Ecosistema de IA más maduro (PyTorch, OpenCV)
  - Librerías especializadas (Ultralytics, Pillow)
  - FastAPI para exponer APIs REST
- **Bibliotecas Clave:**
  - `ultralytics` (YOLOv8)
  - `opencv-python` (procesamiento de imágenes)
  - `anthropic` (Claude SDK)
  - `fastapi` (API framework)
  - `pydantic` (validación de datos)

**SQL (PostgreSQL Dialect)**
- **Uso:** Queries complejas cuando Prisma no es suficiente
- **Versión:** PostgreSQL 16 compatible
- **Limitación:** Solo mediante Prisma Raw Queries (minimizado)

**JSON**
- **Uso:** Configuración, almacenamiento de formularios dinámicos
- **Justificación:** 
  - Formularios tienen estructura variable (campos dinámicos)
  - PostgreSQL tiene soporte nativo para JSON/JSONB
  - Indexación eficiente con GIN indexes

#### 2.1.2.2 Frameworks y Librerías Frontend

**React 19.1** (Core UI Library)
- **Versión:** 19.1.0 (última estable)
- **Uso:** Construcción de interfaz de usuario
- **Características Utilizadas:**
  - Functional Components
  - Hooks (useState, useEffect, useCallback, useMemo)
  - Context API (mínimo, preferimos Zustand)
  - Suspense (para lazy loading)
  - Error Boundaries

**React Router 7.9** (Routing)
- **Versión:** 7.9.0
- **Uso:** Navegación SPA y protección de rutas
- **Configuración:**
  ```typescript
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="forms" element={<FormList />} />
        {/* ... */}
      </Route>
    </Route>
  </Routes>
  ```

**Zustand 5.0** (State Management)
- **Versión:** 5.0.2
- **Uso:** Gestión de estado global (alternativa ligera a Redux)
- **Stores Implementados:**
  - `authStore` (usuario, sesión)
  - `formStore` (formularios, asignaciones)
  - `dashboardStore` (KPIs, filtros)
- **Ventajas:**
  - 100x más ligero que Redux
  - API simple (menos boilerplate)
  - Persist middleware para localStorage

**React Hook Form 7.66** (Gestión de Formularios)
- **Versión:** 7.66.0
- **Uso:** Formularios con validación eficiente
- **Integración:** Zod para schemas de validación
- **Performance:** Re-renders mínimos (modo uncontrolled)

**Zod 4.1** (Validación de Esquemas)
- **Versión:** 4.1.0
- **Uso:** Validación type-safe de datos
- **Ejemplo:**
  ```typescript
  const formSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    name: z.string().min(2),
  })
  ```
- **Ventajas:** Inferencia automática de tipos TypeScript

**@dnd-kit 6.3** (Drag & Drop)
- **Versión:** 6.3.0
- **Uso:** Constructor de formularios (drag & drop de campos)
- **Características:**
  - Touch support (móviles)
  - Keyboard navigation (accesibilidad)
  - Animaciones fluidas

**Recharts 3.3** (Gráficos y Visualizaciones)
- **Versión:** 3.3.0
- **Uso:** Dashboard con gráficos interactivos
- **Tipos de Gráficos:**
  - LineChart (tendencias temporales)
  - BarChart (comparativas)
  - PieChart (distribuciones)
  - AreaChart (acumulados)
- **Ventajas:** Componentes React nativos, responsive

**shadcn/ui** (Componentes UI)
- **Versión:** Latest (instalación component-by-component)
- **Componentes Utilizados:**
  - `Button`, `Input`, `Select`, `Dialog`, `Table`
  - `Card`, `Tabs`, `Tooltip`, `Avatar`
  - `Dropdown`, `Calendar`, `Popover`
- **Ventajas:**
  - Componentes accesibles (WCAG 2.1 AA)
  - Personalizable con Tailwind
  - Copy-paste (no es una librería de node_modules)

**Tailwind CSS 3.4** (Framework CSS)
- **Versión:** 3.4.17
- **Uso:** Estilos utility-first
- **Configuración:**
  ```javascript
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#3b82f6',
      }
    }
  }
  ```
- **Plugins:** `@tailwindcss/forms`, `@tailwindcss/typography`

**Axios 1.13** (Cliente HTTP)
- **Versión:** 1.13.0
- **Uso:** Comunicación con API Backend
- **Configuración:**
  - Interceptors para tokens de autenticación
  - Manejo automático de errores
  - Retry logic para requests fallidos
  - Base URL configurada por entorno

**Firebase SDK 12.5** (Autenticación Client-Side)
- **Versión:** 12.5.0
- **Módulos:**
  - `firebase/auth` (autenticación)
  - `firebase/app` (inicialización)
- **Métodos Utilizados:**
  - `signInWithEmailAndPassword`
  - `createUserWithEmailAndPassword`
  - `signOut`
  - `onAuthStateChanged`

#### 2.1.2.3 Frameworks y Librerías Backend

**Express 5.1** (Framework Web)
- **Versión:** 5.1.0
- **Uso:** Servidor HTTP, routing, middleware
- **Estructura:**
  ```
  backend/src/
  ├── controllers/    (lógica de endpoints)
  ├── services/       (lógica de negocio)
  ├── routes/         (definición de rutas)
  ├── middleware/     (auth, validation, errors)
  └── utils/          (helpers)
  ```

**Prisma 6.18** (ORM y Migraciones)
- **Versión:** 6.18.0
- **Uso:** Interacción type-safe con PostgreSQL
- **Comandos Clave:**
  - `npx prisma migrate dev` (desarrollo)
  - `npx prisma migrate deploy` (producción)
  - `npx prisma generate` (generar cliente)
  - `npx prisma studio` (GUI admin)
- **Características:**
  - Migraciones versionadas
  - Schema declarativo
  - Relaciones tipo-safe
  - Transaction support

**Firebase Admin SDK 13.5** (Autenticación Server-Side)
- **Versión:** 13.5.0
- **Uso:** Verificación de tokens JWT
- **Implementación:**
  ```typescript
  const decodedToken = await admin.auth().verifyIdToken(token)
  const user = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid }
  })
  ```

**Zod 4.1** (Validación Backend)
- **Uso:** Validación de inputs de API
- **Middleware Personalizado:**
  ```typescript
  const validate = (schema: z.ZodSchema) => {
    return (req, res, next) => {
      try {
        schema.parse(req.body)
        next()
      } catch (err) {
        res.status(400).json({ error: err.errors })
      }
    }
  }
  ```

**Helmet 8.1** (Seguridad HTTP Headers)
- **Versión:** 8.1.0
- **Uso:** Configuración automática de headers seguros
- **Headers Configurados:**
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - Strict-Transport-Security

**CORS 2.8** (Cross-Origin Resource Sharing)
- **Versión:** 2.8.5
- **Configuración:**
  ```typescript
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }))
  ```

**express-rate-limit 8.2** (Rate Limiting)
- **Versión:** 8.2.0
- **Configuración:**
  - 100 requests por 15 minutos por IP
  - Headers informativos (X-RateLimit-*)
  - Store en memoria (Redis en futuro si es necesario)

**Sentry 10.22** (Monitoreo de Errores)
- **Versión:** 10.22.0 (SDK Node.js)
- **Uso:** Tracking automático de errores y performance
- **Configuración:**
  - Error tracking
  - Performance monitoring
  - Release tracking
  - Source maps support

#### 2.1.2.4 Herramientas de Desarrollo

**Vite 7.1** (Build Tool)
- **Versión:** 7.1.0
- **Uso:** Dev server y bundler para frontend
- **Características:**
  - Hot Module Replacement instantáneo (<200ms)
  - Build optimizado con Rollup
  - Code splitting automático
  - Import alias (@/)

**ESLint 9.39** (Linter)
- **Versión:** 9.39.0
- **Configuración:** TypeScript ESLint + React rules
- **Reglas Clave:**
  - `no-unused-vars: error`
  - `no-any: warn`
  - `react-hooks/rules-of-hooks: error`

**Prettier 3.6** (Formateador)
- **Versión:** 3.6.0
- **Configuración:**
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```

**Jest 30.2** (Testing Framework)
- **Versión:** 30.2.0
- **Uso:** Tests unitarios e integración
- **Configuración:**
  - Entorno: Node (backend) + jsdom (frontend)
  - Coverage: >75% requerido

**React Testing Library 16.1** (Testing de Componentes)
- **Versión:** 16.1.0
- **Uso:** Tests de componentes React
- **Filosofía:** Testing basado en comportamiento del usuario

**Supertest 7.1** (Testing de APIs)
- **Versión:** 7.1.0
- **Uso:** Tests de endpoints Express
- **Ejemplo:**
  ```typescript
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200)
  ```

**Docker** (Containerización)
- **Versión:** Docker Engine 24.0+
- **Uso:** Desarrollo local y deployment
- **Servicios:**
  - PostgreSQL container (desarrollo)
  - Backend container (producción)
  - Servicios IA container (producción)

**Git** (Control de Versiones)
- **Versión:** 2.40+
- **Estrategia:** Git Flow
  - `main`: Producción
  - `develop`: Desarrollo
  - `feature/*`: Nuevas features

#### 2.1.2.5 Servicios Cloud y TI

**Railway** (Backend Hosting)
- **Plan:** Hobby ($5/mes) → Developer ($20/mes) según crecimiento
- **Servicios Alojados:**
  - API Backend (Express)
  - PostgreSQL 16
  - Servicio IA Python
- **Características:**
  - Auto-deploy desde GitHub
  - Backups automáticos (PostgreSQL)
  - Logs centralizados
  - Métricas de CPU/RAM/Network

**Vercel** (Frontend Hosting)
- **Plan:** Hobby (gratuito) → Pro ($20/mes) según tráfico
- **Servicios:**
  - PWA React
  - CDN global (300+ ubicaciones)
  - Serverless Functions (futuro)
- **Características:**
  - Auto-deploy desde GitHub
  - Preview deployments
  - Analytics integrados
  - Edge caching

**Firebase** (Authentication + Services)
- **Plan:** Spark (gratuito) → Blaze (pay-as-you-go)
- **Servicios Utilizados:**
  - Authentication (50K MAU gratuitos)
  - Cloud Functions (futuro, opcional)
- **Costo Proyectado:** $0/mes (bajo límite gratuito)

**Sentry** (Error Monitoring)
- **Plan:** Developer (gratuito: 5K eventos/mes)
- **Servicios:**
  - Error tracking
  - Performance monitoring
  - Release tracking
- **Costo Proyectado:** $0/mes inicialmente

**GitHub** (Repositorio y CI/CD)
- **Plan:** Free (repositorio privado)
- **Servicios:**
  - Git hosting
  - GitHub Actions (CI/CD) - 2000 minutos/mes gratis
  - Issues y Projects (gestión)
- **Costo:** $0/mes

#### 2.1.2.6 Componentes de Hardware (Infraestructura)

**Servidores Cloud (Railway)**
- **Especificaciones Backend:**
  - CPU: 1-2 vCPUs (escalable)
  - RAM: 512MB - 2GB (escalable)
  - Storage: 10GB SSD (escalable)
  - Network: 100GB transfer/mes
- **Ubicación:** us-west (Oregon, USA) - latencia ~150-200ms a Chile

**Base de Datos PostgreSQL (Railway)**
- **Especificaciones:**
  - CPU: Compartida
  - RAM: 256MB - 1GB
  - Storage: 500MB (gratis) → 5GB (plan pago)
  - Backups: Automáticos diarios, retención 7 días
  - Connection Pooling: Prisma (máx. 10 conexiones)

**CDN (Vercel Edge Network)**
- **Ubicaciones:** 300+ edge locations globalmente
- **Latencia a Chile:** <50ms (Santiago edge node)
- **Caching:** Automático para assets estáticos
- **Bandwidth:** Ilimitado en plan Pro

**SSL/TLS Certificates**
- **Proveedor:** Let's Encrypt (automático)
- **Versión:** TLS 1.3
- **Renovación:** Automática cada 90 días
- **Costo:** $0

**Load Balancer**
- **Railway:** Automático (incluido)
- **Vercel:** Automático (incluido)
- **Health Checks:** Configurados en ambos servicios

#### 2.1.2.7 Herramientas de Testing

**Jest** (Framework Principal)
- **Tipos de Tests:**
  - Unitarios (funciones, servicios)
  - Integración (APIs, componentes)
- **Coverage:** Objetivo >75%

**React Testing Library**
- **Uso:** Tests de componentes React
- **Queries:**
  - `getByRole` (accesibilidad)
  - `getByText`, `getByTestId`
- **User Interactions:**
  - `fireEvent`, `userEvent`

**Supertest**
- **Uso:** Tests de endpoints API
- **Ventajas:**
  - No requiere servidor corriendo
  - Assertions integrados

**Lighthouse CI**
- **Uso:** Auditoría automática de performance
- **Métricas:**
  - Performance Score
  - Accessibility Score
  - Best Practices
  - SEO

#### 2.1.2.8 Herramientas de DevOps

**Docker Compose**
- **Uso:** Orquestación local de servicios
- **Servicios:**
  ```yaml
  services:
    postgres:
      image: postgres:16
    backend:
      build: ./backend
    frontend:
      build: ./frontend
  ```

**GitHub Actions**
- **Pipelines:**
  - **CI:** Lint, test, build (en cada PR)
  - **CD:** Deploy automático (en merge a main)
- **Workflows:**
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npm install
        - run: npm test
  ```

**npm** (Gestor de Paquetes)
- **Versión:** 10.0+
- **Uso:** Gestión de dependencias
- **Scripts Clave:**
  - `npm install`
  - `npm run dev` (desarrollo)
  - `npm run build` (producción)
  - `npm test`

#### 2.1.2.9 Librerías Adicionales

**Frontend:**
- **date-fns:** Manipulación de fechas
- **clsx / cn:** Utilidad para clases condicionales
- **react-hot-toast:** Notificaciones toast
- **lucide-react:** Iconos
- **xlsx:** Exportación a Excel
- **qrcode:** Generación de QR codes (tickets bodega)

**Backend:**
- **bcrypt:** Hashing de contraseñas (backup a Firebase)
- **jsonwebtoken:** Generación de JWT
- **multer:** Upload de archivos (fotos/videos)
- **uuid:** Generación de UUIDs

**Servicios IA:**
- **ultralytics:** YOLOv8
- **opencv-python:** Procesamiento de imágenes
- **pillow:** Manipulación de imágenes
- **anthropic:** SDK de Claude
- **fastapi:** API framework
- **uvicorn:** ASGI server

---

### 2.1.3 Resumen de Decisiones Tecnológicas

La selección de tecnologías para Collector Enterprise se ha realizado con un enfoque riguroso que prioriza:

1. **Factibilidad Técnica:** Todas las tecnologías son maduras, probadas en producción y cuentan con amplio soporte comunitario.

2. **Factibilidad Económica:** El stack seleccionado minimiza costos mediante el uso de tecnologías open-source y planes gratuitos/económicos de servicios cloud, logrando un **TCO proyectado de $60-120 USD/mes** ($48.000-96.000 CLP/mes) en el primer año.

3. **Factibilidad Implementativa:** El equipo puede dominar el stack completo en <3 semanas, con un tiempo de desarrollo total de **12-16 semanas**, cumpliendo con el cronograma del proyecto.

4. **Unificación del Stack:** TypeScript en frontend y backend reduce la complejidad cognitiva y facilita la colaboración del equipo.

5. **Escalabilidad:** La arquitectura soporta crecimiento de 50 a 500+ usuarios sin cambios arquitectónicos significativos.

6. **Mantenibilidad:** Código type-safe, tests automatizados y CI/CD garantizan mantenibilidad a largo plazo.

**ROI Esperado:**
- **Reducción de 60% en tiempo de documentación** → Ahorro de $1.200.000 CLP/mes
- **Costo operacional:** $48.000-96.000 CLP/mes
- **ROI neto:** >1.000% en el primer año

---

## 3. CRITERIO 2.1.2: ARQUITECTURA DE LA SOLUCIÓN

Esta sección presenta la arquitectura completa del sistema Collector Enterprise mediante diagramas normalizados (BPMN, UML) y especificaciones técnicas detalladas.

### 3.1 Diagramas BPMN de Procesos de Negocio (Criterio 2.1.2.3)

Los siguientes diagramas BPMN modelan los procesos de negocio principales de Amaranto Constructora que son soportados y optimizados por el sistema Collector Enterprise.

#### 3.1.1 PROCESO 1: GESTIÓN DE FORMULARIOS DINÁMICOS

**Objetivo del Proceso:** Crear, configurar y publicar formularios personalizados que se adaptan a las necesidades específicas de cada obra sin requerir desarrollo de software.

**Actores:**
- **Administrador:** Acceso completo al sistema
- **Manager:** Gestión de formularios y asignaciones
- **Supervisor:** Revisión y aprobación de formularios

##### Subproceso 1.1: Creación de Formulario

**Descripción:** El Administrador o Manager crea un nuevo formulario utilizando el constructor visual drag & drop.

**Flujo:**
1. **Inicio:** Administrador/Manager accede al módulo "Formularios"
2. **Acción:** Click en "Crear Nuevo Formulario"
3. **Entrada de Datos:**
   - Título del formulario (ej: "Inspección Diaria de Seguridad")
   - Descripción (opcional)
4. **Constructor Drag & Drop:**
   - Arrastrar campos desde paleta (15+ tipos disponibles)
   - Configurar propiedades de cada campo:
     - Label (etiqueta visible)
     - Placeholder
     - Validaciones (requerido, min/max, regex)
     - Opciones (para select, radio, checkbox)
5. **Vista Previa:** Visualización en tiempo real del formulario
6. **Decisión:** ¿Formulario completo?
   - **No:** Volver a paso 4
   - **Sí:** Continuar
7. **Acción:** Click en "Guardar como Borrador"
8. **Sistema:** 
   -

   # INFORME N°2 - PARTE 3: BPMN PROCESOS DE NEGOCIO

## Continuación: 3.1.1 Proceso 1 - Gestión de Formularios Dinámicos

##### Subproceso 1.1: Creación de Formulario (continuación)

8. **Sistema:** 
   - Valida estructura JSON del formulario
   - Genera UUID único
   - Asigna versión 1.0
   - Almacena en base de datos con estado "DRAFT"
   - Registra en auditoría (createdBy, timestamp)
9. **Fin:** Formulario guardado en estado borrador

**Datos de Entrada:**
- Título, descripción, campos (JSON array)

**Datos de Salida:**
- Form ID (UUID), versión, timestamp de creación

**Reglas de Negocio:**
- RN-001: El formulario debe tener al menos 1 campo
- RN-002: El título es obligatorio (2-200 caracteres)
- RN-003: Cada campo debe tener tipo válido (text, number, email, etc.)
- RN-004: Los campos requeridos deben estar marcados explícitamente

**KPIs Asociados:**
- Tiempo promedio de creación de formulario: <15 minutos (objetivo)
- Tasa de uso del constructor: 100% (vs desarrollo custom 0%)

##### Subproceso 1.2: Revisión y Publicación

**Descripción:** Un Supervisor revisa el formulario borrador y decide si aprobarlo para publicación.

**Flujo:**
1. **Inicio:** Supervisor recibe notificación de nuevo formulario en borrador
2. **Acción:** Acceder a "Formularios Pendientes de Revisión"
3. **Revisión:**
   - Visualizar formulario en modo vista previa
   - Probar funcionalidad (validaciones, condicionales)
   - Verificar claridad de instrucciones
4. **Decisión:** ¿Formulario aprobado?
   - **No - Requiere Cambios:**
     - Acción: Agregar comentarios de retroalimentación
     - Sistema: Notificar a creador
     - Sistema: Cambiar estado a "REVISION_REQUESTED"
     - Flujo: Volver a Subproceso 1.1 (paso 4)
   - **Sí - Aprobado:**
     - Continuar
5. **Acción:** Click en "Publicar Formulario"
6. **Sistema:**
   - Cambiar estado de "DRAFT" a "PUBLISHED"
   - Asignar fecha de publicación
   - Hacer disponible para asignaciones
   - Notificar a Managers
   - Registrar en auditoría
7. **Fin:** Formulario publicado y disponible

**Datos de Entrada:**
- Form ID, comentarios de revisión (opcional)

**Datos de Salida:**
- Estado actualizado, fecha de publicación

**Reglas de Negocio:**
- RN-005: Solo Supervisores y Administradores pueden publicar formularios
- RN-006: Un formulario debe pasar por revisión antes de publicarse
- RN-007: Los cambios posteriores a publicación crean una nueva versión

**KPIs Asociados:**
- Tiempo promedio de revisión: <24 horas (objetivo)
- Tasa de aprobación en primer intento: >80% (objetivo)

##### Subproceso 1.3: Asignación de Formularios

**Descripción:** Manager asigna formularios publicados a usuarios o equipos con configuración de frecuencia.

**Flujo:**
1. **Inicio:** Manager accede a "Asignaciones"
2. **Acción:** Seleccionar formulario publicado
3. **Configuración de Asignación:**
   - **Destinatarios:** Seleccionar usuarios o equipos
   - **Frecuencia:**
     - Diaria (cada día laboral)
     - Semanal (día específico de la semana)
     - Quincenal (cada 15 días)
     - Mensual (día específico del mes)
     - Una vez (fecha específica)
     - Personalizada (cron expression)
   - **Rango de Fechas:**
     - Fecha de inicio (requerida)
     - Fecha de fin (opcional)
   - **Prioridad:** Alta, Media, Baja
   - **Instrucciones Adicionales:** Texto libre (opcional)
4. **Vista Previa:** Sistema muestra resumen de asignación
5. **Decisión:** ¿Confirmar asignación?
   - **No:** Volver a paso 3
   - **Sí:** Continuar
6. **Sistema:**
   - Crear registros en tabla FormAssignment (uno por usuario)
   - Calcular próximas fechas de vencimiento según frecuencia
   - Enviar notificaciones a usuarios asignados
   - Registrar en auditoría
7. **Fin:** Asignaciones creadas y usuarios notificados

**Datos de Entrada:**
- Form ID, User IDs, frecuencia, fechas, prioridad

**Datos de Salida:**
- Assignment IDs (array), fechas de vencimiento calculadas

**Reglas de Negocio:**
- RN-008: Solo formularios publicados pueden asignarse
- RN-009: La fecha de inicio debe ser presente o futuro
- RN-010: La fecha de fin debe ser posterior a la fecha de inicio
- RN-011: Un usuario puede tener múltiples asignaciones del mismo formulario (diferentes períodos)

**KPIs Asociados:**
- Tiempo promedio de asignación: <5 minutos (objetivo)
- Formularios asignados vs creados: >70% (objetivo)

##### Subproceso 1.4: Archivado

**Descripción:** Formularios obsoletos se archivan para mantener el sistema limpio, preservando el histórico.

**Flujo:**
1. **Inicio:** Administrador/Manager identifica formulario obsoleto
2. **Acción:** Click en "Archivar Formulario"
3. **Sistema:** Verificar asignaciones pendientes
4. **Decisión:** ¿Tiene asignaciones activas?
   - **Sí:**
     - Sistema: Mostrar advertencia
     - Opciones:
       - Cancelar archivado
       - Finalizar asignaciones y archivar
   - **No:** Continuar
5. **Acción:** Confirmar archivado
6. **Sistema:**
   - Cambiar estado de "PUBLISHED" a "ARCHIVED"
   - Mantener formulario en base de datos (no eliminar)
   - Ocultar de listas activas
   - Marcar asignaciones como "CANCELLED" (si aplica)
   - Mantener respuestas históricas accesibles
   - Registrar en auditoría
7. **Fin:** Formulario archivado

**Reglas de Negocio:**
- RN-012: Los formularios archivados no se eliminan (trazabilidad)
- RN-013: Las respuestas de formularios archivados permanecen accesibles
- RN-014: Un formulario archivado puede "desarchivarse" si es necesario

**KPIs Asociados:**
- Tasa de archivado: <10% de formularios creados (objetivo)

---

#### 3.1.2 PROCESO 2: RESPUESTA Y RECOLECCIÓN DE DATOS

**Objetivo del Proceso:** Permitir que operadores y supervisores completen formularios asignados de manera eficiente, capturando datos con geolocalización y multimedia.

**Actores:**
- **Operador:** Completa formularios en campo
- **Supervisor:** Completa y revisa formularios

##### Subproceso 2.1: Visualización de Asignaciones

**Descripción:** Operador accede a sus formularios asignados y pendientes.

**Flujo:**
1. **Inicio:** Operador inicia sesión en PWA
2. **Sistema:**
   - Verificar autenticación (Firebase)
   - Cargar asignaciones del usuario desde API
   - Calcular estados:
     - **Pendiente:** No completado, dentro de plazo
     - **Vencido:** No completado, fuera de plazo
     - **Completado:** Ya enviado
3. **Visualización:**
   - Dashboard personal con cards de asignaciones
   - Filtros:
     - Estado (pendiente, vencido, completado)
     - Fecha (hoy, esta semana, este mes)
     - Prioridad
   - Indicadores visuales:
     - 🔴 Vencido (rojo)
     - 🟡 Vence hoy (amarillo)
     - 🟢 En plazo (verde)
     - ✅ Completado (gris)
4. **Acción:** Seleccionar formulario para completar
5. **Fin:** Navegar a Subproceso 2.2

**Datos de Entrada:**
- User ID (desde sesión)

**Datos de Salida:**
- Lista de asignaciones con estados

**Reglas de Negocio:**
- RN-015: Solo asignaciones del usuario autenticado son visibles
- RN-016: Las asignaciones vencidas se marcan automáticamente

**KPIs Asociados:**
- Tasa de visualización diaria: >80% de usuarios (objetivo)

##### Subproceso 2.2: Completado de Formulario

**Descripción:** Operador completa los campos del formulario con validación en tiempo real.

**Flujo:**
1. **Inicio:** Operador abre formulario asignado
2. **Sistema:**
   - Cargar estructura del formulario (fields JSON)
   - Renderizar campos dinámicamente
   - Verificar si PWA está online/offline
3. **Modo Online:**
   - Validaciones en tiempo real
   - Sugerencias automáticas (si aplica)
4. **Modo Offline:**
   - Validaciones locales (JavaScript)
   - Guardado en IndexedDB (navegador)
   - Indicador "Trabajando sin conexión"
5. **Completado de Campos:**
   - Por cada campo:
     - Operador ingresa datos
     - Sistema valida según tipo:
       - Text: min/max length
       - Number: min/max value, decimales
       - Email: formato válido
       - Phone: formato chileno (+56 9 XXXX XXXX)
       - Date: rango válido
       - Select/Radio: opción válida
       - File: tipo y tamaño permitidos
     - Mostrar errores de validación en tiempo real
     - Marcar campos completados con ✓
6. **Captura de Geolocalización (Opcional):**
   - Sistema: Solicitar permiso de ubicación
   - Browser Geolocation API captura:
     - Latitud
     - Longitud
     - Precisión (accuracy en metros)
     - Timestamp
7. **Adjuntar Multimedia (Si aplica):**
   - Fotos:
     - Captura con cámara o selección de galería
     - Compresión automática (max 2MB)
     - Preview antes de adjuntar
   - Videos (futuro):
     - Grabación (max 30 segundos)
     - Compresión automática
8. **Decisión:** ¿Todos los campos requeridos completados?
   - **No:**
     - Sistema: Resaltar campos faltantes
     - Flujo: Volver a paso 5
   - **Sí:** Continuar
9. **Revisión Final:**
   - Visualización de resumen de respuestas
   - Opción de editar antes de enviar
10. **Acción:** Click en "Enviar Respuesta"
11. **Navegar a Subproceso 2.3**

**Datos de Entrada:**
- Assignment ID, respuestas (JSON), geolocalización, archivos

**Datos de Salida:**
- Response ID (UUID), timestamp, ubicación

**Reglas de Negocio:**
- RN-017: Todos los campos marcados como requeridos deben completarse
- RN-018: Las validaciones se ejecutan antes de permitir envío
- RN-019: La geolocalización es opcional pero recomendada
- RN-020: Los archivos adjuntos no pueden exceder 5MB cada uno

**KPIs Asociados:**
- Tiempo promedio de completado: <10 minutos (objetivo)
- Tasa de campos con errores de validación: <5% (objetivo)

##### Subproceso 2.3: Envío y Almacenamiento

**Descripción:** Sistema procesa y almacena la respuesta del formulario con trazabilidad completa.

**Flujo:**
1. **Inicio:** Operador confirma envío
2. **Decisión:** ¿PWA está online?
   - **Offline:**
     - Sistema: Guardar en IndexedDB local
     - Mostrar: "Guardado localmente, se enviará cuando haya conexión"
     - Background Sync: Encolar para envío posterior
     - Fin: Esperar conexión
   - **Online:** Continuar
3. **Envío a API:**
   - POST /api/form-responses
   - Headers: Authorization Bearer token
   - Body:
     ```json
     {
       "assignmentId": "uuid",
       "formId": "uuid",
       "data": { /* respuestas */ },
       "latitude": -33.4372,
       "longitude": -70.6506,
       "submittedAt": "2024-11-18T10:30:00Z"
     }
     ```
4. **Backend - Validación:**
   - Verificar token JWT
   - Verificar que assignment pertenece al usuario
   - Validar estructura de datos contra schema del formulario
   - Verificar que assignment no esté ya completado
5. **Decisión:** ¿Validación exitosa?
   - **No:**
     - Sistema: Retornar error 400 con detalles
     - Frontend: Mostrar mensaje de error
     - Flujo: Volver a Subproceso 2.2 (paso 9)
   - **Sí:** Continuar
6. **Backend - Almacenamiento:**
   - Transacción de base de datos:
     ```sql
     BEGIN TRANSACTION;
     INSERT INTO FormResponse (...) VALUES (...);
     UPDATE FormAssignment SET isCompleted = true WHERE id = ?;
     INSERT INTO AuditLog (...) VALUES (...);
     COMMIT;
     ```
7. **Backend - Post-Procesamiento:**
   - Si tiene fotos: Subir a storage cloud (futuro)
   - Si requiere análisis IA: Encolar job en servicio Python
   - Actualizar KPIs en caché
8. **Respuesta al Frontend:**
   - Status 201 Created
   - Body: { "responseId": "uuid", "message": "Respuesta guardada exitosamente" }
9. **Frontend - Confirmación:**
   - Mostrar toast de éxito
   - Actualizar lista de asignaciones (marcar como completado)
   - Limpiar formulario
10. **Navegar a Subproceso 2.4**

**Datos de Entrada:**
- Response data completo

**Datos de Salida:**
- Response ID, confirmación de almacenamiento

**Reglas de Negocio:**
- RN-021: Una asignación solo puede completarse una vez
- RN-022: Las respuestas se almacenan con timestamp preciso
- RN-023: Si falla el envío, se reintenta automáticamente (3 intentos)
- RN-024: Los datos offline se sincronizan automáticamente al recuperar conexión

**KPIs Asociados:**
- Tasa de éxito de envío: >99.5% (objetivo)
- Tiempo de almacenamiento: <500ms (objetivo)

##### Subproceso 2.4: Notificación

**Descripción:** Sistema notifica a supervisores sobre nuevas respuestas para revisión.

**Flujo:**
1. **Inicio:** Respuesta almacenada exitosamente
2. **Sistema - Identificar Supervisores:**
   - Query: Obtener supervisores asignados a la obra/proyecto
   - Filtro: Solo supervisores con permiso de visualización
3. **Sistema - Generar Notificación:**
   - Tipo: In-app notification (bell icon)
   - Contenido:
     - "Nueva respuesta: [Título Formulario]"
     - "De: [Nombre Operador]"
     - "Fecha: [Timestamp]"
     - "Ubicación: [Obra/Proyecto]"
4. **Sistema - Enviar Notificación:**
   - In-app: Actualizar badge count
   - Email (opcional): Enviar resumen diario
   - Push notification (futuro): Si está habilitado
5. **Sistema - Actualizar Dashboard:**
   - Refrescar KPIs en tiempo real (WebSocket futuro)
   - Incrementar contador "Respuestas Nuevas"
6. **Fin:** Notificaciones enviadas

**Reglas de Negocio:**
- RN-025: Solo supervisores y administradores reciben notificaciones
- RN-026: Las notificaciones se agrupan si hay múltiples en <5 minutos
- RN-027: El usuario puede configurar preferencias de notificación

**KPIs Asociados:**
- Tiempo de notificación: <30 segundos desde respuesta (objetivo)
- Tasa de lectura de notificaciones: >70% (objetivo)

---

#### 3.1.3 PROCESO 3: GENERACIÓN DE REPORTES Y ANÁLISIS

**Objetivo del Proceso:** Proporcionar a Managers y Administradores reportes detallados y visualizaciones para toma de decisiones basada en datos.

**Actores:**
- **Manager:** Genera reportes operacionales
- **Administrador:** Acceso completo a todos los reportes

##### Subproceso 3.1: Solicitud de Reporte

**Descripción:** Usuario configura y solicita un reporte personalizado.

**Flujo:**
1. **Inicio:** Manager/Admin accede a "Reportes"
2. **Selección de Tipo de Reporte:**
   - **Reporte de Completitud:**
     - Formularios completados vs asignados
     - Por usuario, por proyecto, por fecha
   - **Reporte de Rendimiento:**
     - Tiempo promedio de completado
     - Tasa de respuesta
     - Comparativa entre equipos
   - **Reporte de Seguridad (EPP):**
     - Detecciones de falta de EPP
     - Por tipo (casco, chaleco, arnés)
     - Tendencias temporales
   - **Reporte de Avance de Obra:**
     - Análisis de fotos con IA
     - Comparación contra planificación
3. **Configuración de Filtros:**
   - **Rango de Fechas:**
     - Fecha inicio (requerida)
     - Fecha fin (requerida)
     - Presets: Hoy, Esta semana, Este mes, Trimestre
   - **Filtros Adicionales:**
     - Proyecto/Obra
     - Usuario(s)
     - Formulario(s)
     - Estado (completado, pendiente, vencido)
4. **Selección de Métricas:**
   - Checkboxes para incluir:
     - Totales y promedios
     - Gráficos (línea, barra, pie)
     - Tablas detalladas
     - Exportación a Excel
5. **Vista Previa:**
   - Sistema muestra conteo preliminar de registros
   - Tiempo estimado de generación
6. **Decisión:** ¿Confirmar generación?
   - **No:** Volver a paso 3
   - **Sí:** Continuar
7. **Acción:** Click en "Generar Reporte"
8. **Navegar a Subproceso 3.2**

**Datos de Entrada:**
- Tipo de reporte, filtros, métricas seleccionadas

**Datos de Salida:**
- Configuración de reporte (JSON)

**Reglas de Negocio:**
- RN-028: El rango de fechas no puede exceder 1 año
- RN-029: El reporte debe tener al menos 1 métrica seleccionada
- RN-030: Los filtros deben ser válidos (proyectos existentes, usuarios válidos)

**KPIs Asociados:**
- Tiempo promedio de configuración: <3 minutos (objetivo)

##### Subproceso 3.2: Procesamiento de Datos

**Descripción:** Sistema procesa los datos según los filtros y genera el reporte.

**Flujo:**
1. **Inicio:** Solicitud de reporte recibida
2. **Backend - Query Database:**
   - Construir query SQL compleja con filtros:
     ```sql
     SELECT 
       fa.id, fa.formId, fa.userId, 
       fr.submittedAt, fr.data,
       u.name, f.title
     FROM FormAssignment fa
     LEFT JOIN FormResponse fr ON fa.id = fr.assignmentId
     JOIN User u ON fa.userId = u.id
     JOIN Form f ON fa.formId = f.id
     WHERE fa.startDate BETWEEN ? AND ?
       AND fa.userId IN (?)
       AND fa.formId IN (?)
     ```
   - Ejecutar con Prisma (optimizado con índices)
3. **Procesamiento de Datos:**
   - Agregaciones:
     - COUNT(completados)
     - COUNT(pendientes)
     - AVG(tiempo de completado)
     - GROUP BY (usuario, proyecto, fecha)
   - Cálculos:
     - Tasa de completitud = completados / asignados * 100
     - Tiempo promedio = SUM(tiempos) / COUNT(completados)
     - Tendencia = Comparación con período anterior
4. **Generación de Visualizaciones:**
   - Preparar datos para gráficos:
     - Series temporales para LineChart
     - Distribuciones para PieChart
     - Comparativas para BarChart
   - Formato JSON para Recharts
5. **Decisión:** ¿Incluir exportación Excel?
   - **Sí:**
     - Generar archivo XLSX con biblioteca xlsx
     - Incluir múltiples hojas:
       - Resumen Ejecutivo
       - Datos Detallados
       - Gráficos (como imágenes)
   - **No:** Continuar
6. **Caching (Opcional):**
   - Si el reporte es pesado (>10 segundos)
   - Guardar resultado en Redis con TTL 5 minutos
   - Próximas solicitudes idénticas usan caché
7. **Respuesta al Frontend:**
   - Status 200 OK
   - Body:
     ```json
     {
       "summary": { /* totales */ },
       "data": [ /* array de registros */ ],
       "charts": { /* datos para gráficos */ },
       "excelUrl": "https://..." // si aplica
     }
     ```
8. **Navegar a Subproceso 3.3**

**Datos de Entrada:**
- Configuración de reporte

**Datos de Salida:**
- Datos procesados, visualizaciones, archivo Excel (opcional)

**Reglas de Negocio:**
- RN-031: Los reportes deben generarse en <10 segundos
- RN-032: Si excede 10 segundos, mostrar loading spinner
- RN-033: Los archivos Excel se almacenan temporalmente (24 horas)

**KPIs Asociados:**
- Tiempo promedio de generación: <5 segundos (objetivo)
- Tasa de éxito de generación: >99% (objetivo)

##### Subproceso 3.3: Exportación

**Descripción:** Usuario descarga y comparte el reporte generado.

**Flujo:**
1. **Inicio:** Reporte generado exitosamente
2. **Visualización en Pantalla:**
   - Cards con métricas clave:
     - Total completados
     - Tasa de completitud
     - Tiempo promedio
   - Gráficos interactivos (Recharts):
     - LineChart: Tendencia temporal
     - BarChart: Comparativa por usuario
     - PieChart: Distribución por estado
   - Tabla detallada (paginada):
     - Columnas: Usuario, Formulario, Fecha, Estado
     - Filtros y ordenamiento
3. **Opciones de Exportación:**
   - **Excel:**
     - Acción: Click en "Descargar Excel"
     - Sistema: Generar enlace de descarga
     - Browser: Descargar archivo .xlsx
   - **PDF (futuro):**
     - Generación de PDF con gráficos embebidos
   - **Compartir por Email (futuro):**
     - Enviar reporte a destinatarios
4. **Guardado de Configuración:**
   - Opción: "Guardar como Reporte Favorito"
   - Sistema: Almacenar configuración para reutilización
5. **Programación Periódica (futuro):**
   - Opción: "Enviar Automáticamente"
   - Configurar: Frecuencia (diaria, semanal, mensual)
   - Sistema: Cron job genera y envía reporte
6. **Fin:** Reporte exportado o compartido

**Datos de Entrada:**
- Reporte generado, opción de exportación

**Datos de Salida:**
- Archivo descargado, reporte compartido

**Reglas de Negocio:**
- RN-034: Los archivos Excel son válidos por 24 horas
- RN-035: Los reportes compartidos incluyen fecha de generación
- RN-036: Los reportes programados solo para Managers y Admins

**KPIs Asociados:**
- Tasa de uso de exportación: >60% de reportes (objetivo)

##### Subproceso 3.4: Análisis y Toma de Decisiones

**Descripción:** Manager utiliza los insights del reporte para tomar decisiones operacionales.

**Flujo:**
1. **Inicio:** Reporte visualizado
2. **Análisis de Métricas:**
   - Identificar tendencias:
     - ¿Tasa de completitud está bajando?
     - ¿Algún usuario está retrasado?
     - ¿Algún formulario tiene baja adopción?
   - Comparar con períodos anteriores
   - Comparar con objetivos (KPIs definidos)
3. **Identificación de Problemas:**
   - **Ejemplo 1:** Tasa de completitud <70%
     - Análisis: ¿Formulario muy complejo? ¿Falta de capacitación?
     - Acción: Simplificar formulario o re-entrenar usuario
   - **Ejemplo 2:** Detecciones de falta de EPP aumentando
     - Análisis: ¿Problema en una obra específica?
     - Acción: Reforzar charlas de seguridad
   - **Ejemplo 3:** Tiempo de completado >20 minutos
     - Análisis: ¿Formulario muy largo?
     - Acción: Dividir en múltiples formularios
4. **Toma de Decisiones:

# INFORME N°2 - PARTE 4: UML Y MODELO DE DATOS

## Continuación: 3.1.3 Proceso 3 - Subproceso 3.4

4. **Toma de Decisiones:**
   - Basadas en datos objetivos (no intuición)
   - Acciones concretas:
     - Reasignar formularios
     - Modificar frecuencias
     - Capacitar usuarios
     - Ajustar procesos
5. **Implementación de Cambios:**
   - Crear nuevas asignaciones
   - Modificar formularios
   - Comunicar decisiones al equipo
6. **Monitoreo de Impacto:**
   - Generar mismo reporte después de cambios
   - Comparar métricas antes/después
   - Validar si las decisiones mejoraron KPIs
7. **Fin:** Ciclo de mejora continua

**Reglas de Negocio:**
- RN-037: Las decisiones deben basarse en datos objetivos del sistema
- RN-038: Los cambios deben monitorearse con reportes periódicos

**KPIs Asociados:**
- Mejora en tasa de completitud tras decisiones: +15% (objetivo)
- Tiempo de respuesta a problemas identificados: <48 horas (objetivo)

---

### 3.2 Diagramas UML: Casos de Uso y Componentes (Criterio 2.1.2.4)

#### 3.2.1 Diagrama de Casos de Uso

**Descripción:** Este diagrama modela las interacciones entre los actores del sistema y las funcionalidades principales de Collector Enterprise.

##### Actores del Sistema

**1. Administrador**
- Rol: Acceso completo al sistema
- Permisos: Crear, leer, actualizar, eliminar todo
- Responsabilidades:
  - Gestión de usuarios y roles
  - Configuración del sistema
  - Acceso a auditoría completa
  - Gestión de formularios y asignaciones

**2. Manager**
- Rol: Gestión operacional
- Permisos: Gestión de formularios, asignaciones y reportes
- Responsabilidades:
  - Crear y publicar formularios
  - Asignar formularios a usuarios
  - Generar reportes operacionales
  - Supervisar KPIs

**3. Supervisor**
- Rol: Supervisión y revisión
- Permisos: Revisión de formularios, completar formularios, visualizar reportes
- Responsabilidades:
  - Revisar y aprobar formularios
  - Completar formularios en campo
  - Supervisar respuestas de operadores
  - Generar reportes de su área

**4. Operador**
- Rol: Ejecución en campo
- Permisos: Completar formularios asignados, visualizar historial propio
- Responsabilidades:
  - Completar formularios asignados
  - Capturar datos con geolocalización
  - Adjuntar fotos/videos

##### Casos de Uso Principales

**Módulo: Autenticación y Gestión de Sesión**

**UC-001: Iniciar Sesión**
- **Actor Primario:** Todos los usuarios
- **Precondiciones:** Usuario registrado en el sistema
- **Flujo Principal:**
  1. Usuario ingresa email y contraseña
  2. Sistema valida credenciales con Firebase Authentication
  3. Sistema verifica usuario en base de datos local
  4. Sistema crea sesión (JWT token)
  5. Sistema redirige al dashboard según rol
- **Postcondiciones:** Usuario autenticado con sesión activa
- **Flujos Alternativos:**
  - 2a. Credenciales inválidas → Mostrar error "Email o contraseña incorrectos"
  - 3a. Usuario no existe en BD local → Crear registro automáticamente
- **Reglas de Negocio:** RN-039: Máximo 3 intentos fallidos antes de bloqueo temporal

**UC-002: Cerrar Sesión**
- **Actor Primario:** Todos los usuarios
- **Flujo Principal:**
  1. Usuario click en "Cerrar Sesión"
  2. Sistema invalida token JWT
  3. Sistema cierra sesión en Firebase
  4. Sistema limpia estado local (Zustand)
  5. Sistema redirige a landing page
- **Postcondiciones:** Sesión cerrada, usuario desautenticado

**UC-003: Recuperar Contraseña**
- **Actor Primario:** Todos los usuarios
- **Flujo Principal:**
  1. Usuario click en "¿Olvidaste tu contraseña?"
  2. Usuario ingresa email
  3. Sistema envía enlace de recuperación vía Firebase
  4. Usuario recibe email con link
  5. Usuario define nueva contraseña
  6. Sistema actualiza contraseña en Firebase
- **Postcondiciones:** Contraseña actualizada

---

**Módulo: Gestión de Usuarios**

**UC-004: Crear Usuario**
- **Actor Primario:** Administrador
- **Precondiciones:** Administrador autenticado
- **Flujo Principal:**
  1. Admin accede a "Usuarios" → "Crear Usuario"
  2. Admin ingresa datos:
     - Email (único)
     - Nombre completo
     - Rol (ADMIN, MANAGER, SUPERVISOR, OPERATOR)
     - Estado inicial (Activo/Inactivo)
  3. Sistema valida datos (email único, rol válido)
  4. Sistema crea usuario en Firebase Authentication
  5. Sistema crea registro en tabla User (BD local)
  6. Sistema envía email de bienvenida con contraseña temporal
  7. Sistema registra acción en AuditLog
- **Postcondiciones:** Usuario creado y operativo
- **Flujos Alternativos:**
  - 3a. Email ya existe → Error "El email ya está registrado"
  - 4a. Error en Firebase → Rollback, mostrar error

**UC-005: Editar Usuario**
- **Actor Primario:** Administrador
- **Flujo Principal:**
  1. Admin selecciona usuario existente
  2. Admin modifica campos:
     - Nombre
     - Rol
     - Estado (Activo/Inactivo)
  3. Sistema valida cambios
  4. Sistema actualiza registro en BD
  5. Sistema registra cambio en AuditLog
- **Postcondiciones:** Usuario actualizado
- **Reglas de Negocio:** RN-040: No se puede cambiar el email de un usuario

**UC-006: Desactivar Usuario**
- **Actor Primario:** Administrador
- **Flujo Principal:**
  1. Admin selecciona usuario activo
  2. Admin click en "Desactivar Usuario"
  3. Sistema confirma acción (dialog de confirmación)
  4. Sistema cambia isActive = false
  5. Sistema invalida sesiones activas del usuario
  6. Sistema registra en AuditLog
- **Postcondiciones:** Usuario desactivado (no eliminado)
- **Reglas de Negocio:** RN-041: Los usuarios no se eliminan físicamente (trazabilidad)

**UC-007: Asignar Rol**
- **Actor Primario:** Administrador
- **Flujo Principal:**
  1. Admin selecciona usuario
  2. Admin selecciona nuevo rol
  3. Sistema valida permiso (admin puede cambiar cualquier rol)
  4. Sistema actualiza campo role en BD
  5. Sistema registra en AuditLog
- **Postcondiciones:** Rol actualizado, permisos cambian en próximo login
- **Reglas de Negocio:** RN-042: El último administrador no puede cambiar su rol

---

**Módulo: Gestión de Formularios**

**UC-008: Crear Formulario**
- **Actor Primario:** Administrador, Manager
- **Precondiciones:** Usuario con rol ADMIN o MANAGER
- **Flujo Principal:**
  1. Usuario accede a "Formularios" → "Crear Formulario"
  2. Usuario ingresa título y descripción
  3. Usuario utiliza constructor drag & drop:
     - Arrastra campos desde paleta
     - Configura propiedades de cada campo
     - Organiza orden de campos
  4. Sistema valida estructura en tiempo real
  5. Usuario visualiza preview
  6. Usuario guarda como borrador
  7. Sistema asigna UUID, versión 1, estado DRAFT
  8. Sistema registra en AuditLog
- **Postcondiciones:** Formulario creado en estado borrador
- **Extensiones:** 
  - UC-008a: Duplicar Formulario Existente
  - UC-008b: Importar Formulario desde Template

**UC-009: Editar Formulario**
- **Actor Primario:** Administrador, Manager
- **Flujo Principal:**
  1. Usuario selecciona formulario borrador
  2. Usuario modifica campos en constructor
  3. Sistema valida cambios
  4. Usuario guarda cambios
  5. Sistema actualiza registro (mantiene versión si es borrador)
  6. Sistema registra en AuditLog
- **Postcondiciones:** Formulario actualizado
- **Reglas de Negocio:** 
  - RN-043: Si formulario está publicado, los cambios crean una nueva versión
  - RN-044: Versiones antiguas se mantienen para histórico

**UC-010: Publicar Formulario**
- **Actor Primario:** Supervisor, Administrador
- **Precondiciones:** Formulario en estado DRAFT o REVISION_REQUESTED
- **Flujo Principal:**
  1. Supervisor revisa formulario
  2. Supervisor prueba funcionalidad en preview
  3. Supervisor aprueba formulario
  4. Sistema cambia estado a PUBLISHED
  5. Sistema hace formulario disponible para asignaciones
  6. Sistema notifica a Managers
  7. Sistema registra en AuditLog
- **Postcondiciones:** Formulario publicado y disponible
- **Flujos Alternativos:**
  - 3a. Supervisor solicita cambios → Estado cambia a REVISION_REQUESTED → Notificar creador

**UC-011: Archivar Formulario**
- **Actor Primario:** Administrador, Manager
- **Flujo Principal:**
  1. Usuario selecciona formulario publicado
  2. Usuario click en "Archivar"
  3. Sistema verifica asignaciones activas
  4. Si hay asignaciones: Mostrar advertencia
  5. Usuario confirma archivado
  6. Sistema cambia estado a ARCHIVED
  7. Sistema cancela asignaciones activas (opcional)
  8. Sistema registra en AuditLog
- **Postcondiciones:** Formulario archivado (no eliminado)
- **Reglas de Negocio:** RN-045: Respuestas de formularios archivados permanecen accesibles

**UC-012: Asignar Formulario a Usuario**
- **Actor Primario:** Manager, Administrador
- **Precondiciones:** Formulario publicado, usuarios activos existentes
- **Flujo Principal:**
  1. Manager selecciona formulario publicado
  2. Manager selecciona destinatarios (usuarios o equipos)
  3. Manager configura:
     - Frecuencia (diaria, semanal, mensual, etc.)
     - Fecha inicio
     - Fecha fin (opcional)
     - Prioridad
  4. Sistema calcula próximas fechas de vencimiento
  5. Sistema crea registros FormAssignment
  6. Sistema envía notificaciones a usuarios
  7. Sistema registra en AuditLog
- **Postcondiciones:** Asignaciones creadas, usuarios notificados
- **Reglas de Negocio:**
  - RN-046: Un usuario puede tener múltiples asignaciones del mismo formulario
  - RN-047: La fecha de fin debe ser posterior a fecha de inicio

---

**Módulo: Respuesta a Formularios**

**UC-013: Ver Formularios Asignados**
- **Actor Primario:** Operador, Supervisor
- **Precondiciones:** Usuario con asignaciones activas
- **Flujo Principal:**
  1. Usuario inicia sesión en PWA
  2. Sistema carga asignaciones del usuario
  3. Sistema calcula estados (pendiente, vencido, completado)
  4. Sistema muestra dashboard personal con cards
  5. Usuario filtra por estado o fecha (opcional)
- **Postcondiciones:** Asignaciones visibles
- **Reglas de Negocio:** RN-048: Solo asignaciones del usuario autenticado son visibles

**UC-014: Completar Formulario**
- **Actor Primario:** Operador, Supervisor
- **Precondiciones:** Asignación pendiente o vencida
- **Flujo Principal:**
  1. Usuario selecciona formulario asignado
  2. Sistema renderiza campos dinámicamente
  3. Usuario completa cada campo
  4. Sistema valida en tiempo real
  5. Usuario captura geolocalización (opcional)
  6. Usuario adjunta fotos (opcional)
  7. Usuario revisa respuestas
  8. Usuario envía formulario
  9. Sistema valida completitud
  10. Sistema envía a API backend
  11. Sistema muestra confirmación de éxito
- **Postcondiciones:** Formulario completado, asignación marcada como completada
- **Flujos Alternativos:**
  - 10a. Sin conexión → Guardar en IndexedDB → Sincronizar después
  - 10b. Error de validación → Mostrar campos con errores

**UC-015: Enviar Respuesta**
- **Actor Primario:** Sistema (automático tras UC-014)
- **Flujo Principal:**
  1. Sistema recibe datos del formulario
  2. Sistema valida estructura contra schema
  3. Sistema almacena en tabla FormResponse
  4. Sistema actualiza FormAssignment (isCompleted = true)
  5. Sistema registra en AuditLog
  6. Sistema notifica a supervisores
- **Postcondiciones:** Respuesta almacenada, supervisores notificados

---

**Módulo: Dashboard y Reportes**

**UC-016: Ver Dashboard**
- **Actor Primario:** Todos los usuarios (vista adaptada por rol)
- **Precondiciones:** Usuario autenticado
- **Flujo Principal:**
  1. Usuario accede al dashboard principal
  2. Sistema carga KPIs en tiempo real:
     - Admin/Manager: Métricas globales
     - Supervisor: Métricas de su área
     - Operador: Métricas personales
  3. Sistema renderiza gráficos interactivos (Recharts)
  4. Usuario filtra por fecha, proyecto (opcional)
  5. Sistema actualiza visualizaciones
- **Postcondiciones:** Dashboard visualizado con datos actuales
- **Reglas de Negocio:** RN-049: Los datos se actualizan cada 5 minutos automáticamente

**UC-017: Generar Reporte de Completitud**
- **Actor Primario:** Manager, Administrador
- **Flujo Principal:**
  1. Usuario accede a "Reportes" → "Completitud"
  2. Usuario configura filtros (fecha, usuario, formulario)
  3. Usuario selecciona métricas a incluir
  4. Sistema consulta base de datos
  5. Sistema calcula agregaciones
  6. Sistema genera visualizaciones
  7. Sistema muestra reporte en pantalla
  8. Usuario exporta a Excel (opcional)
- **Postcondiciones:** Reporte generado y visualizado/exportado

**UC-018: Generar Reporte de Rendimiento**
- **Actor Primario:** Manager, Administrador
- **Flujo Principal:**
  1. Usuario accede a "Reportes" → "Rendimiento"
  2. Usuario configura filtros
  3. Sistema calcula:
     - Tiempo promedio de completado
     - Tasa de respuesta
     - Comparativas entre usuarios
  4. Sistema genera gráficos comparativos
  5. Usuario visualiza y exporta
- **Postcondiciones:** Reporte de rendimiento generado

**UC-019: Exportar Reporte a Excel**
- **Actor Primario:** Manager, Administrador
- **Precondiciones:** Reporte generado en pantalla
- **Flujo Principal:**
  1. Usuario click en "Exportar a Excel"
  2. Sistema genera archivo .xlsx con librería xlsx
  3. Sistema incluye:
     - Hoja "Resumen" con métricas clave
     - Hoja "Datos" con tabla detallada
     - Hoja "Gráficos" (futuro)
  4. Sistema retorna URL de descarga
  5. Browser descarga archivo
- **Postcondiciones:** Archivo Excel descargado
- **Reglas de Negocio:** RN-050: Los archivos Excel expiran en 24 horas

---

**Módulo: Auditoría**

**UC-020: Ver Logs de Auditoría**
- **Actor Primario:** Administrador
- **Precondiciones:** Rol ADMIN
- **Flujo Principal:**
  1. Admin accede a "Auditoría"
  2. Sistema carga logs recientes (últimos 7 días)
  3. Sistema muestra tabla con:
     - Usuario
     - Acción
     - Módulo
     - Timestamp
     - Detalles (JSON)
  4. Admin filtra y ordena (opcional)
- **Postcondiciones:** Logs de auditoría visualizados

**UC-021: Filtrar Logs por Usuario/Módulo**
- **Actor Primario:** Administrador
- **Flujo Principal:**
  1. Admin selecciona filtros:
     - Usuario específico
     - Módulo (Formularios, Usuarios, Asignaciones)
     - Rango de fechas
  2. Sistema aplica filtros a query
  3. Sistema muestra logs filtrados
- **Postcondiciones:** Vista filtrada de auditoría

---

#### 3.2.2 Diagrama de Componentes

**Descripción:** Este diagrama muestra la arquitectura lógica del sistema, identificando componentes principales y sus relaciones de dependencia.

##### Componentes Lógicos

**Capa 1: Presentación (Frontend)**

**1.1 LandingPage Component**
- **Responsabilidad:** Página pública de bienvenida
- **Tecnología:** React + Tailwind CSS
- **Subcomponentes:**
  - HeroSection
  - FeaturesSection
  - AboutSection
  - ContactForm
- **Dependencias:**
  - React Router (navegación)
  - Axios (contacto API)

  # INFORME N°2 - PARTE 5: COMPONENTES Y MODELO DE DATOS

## Continuación: 3.2.2 Diagrama de Componentes

**1.2 AuthModule Component**
- **Responsabilidad:** Gestión de autenticación y sesión
- **Tecnología:** React + Firebase Auth SDK
- **Subcomponentes:**
  - LoginForm
  - RegisterForm (futuro)
  - ForgotPasswordForm
  - ProtectedRoute (HOC)
- **Dependencias:**
  - Firebase Authentication
  - Zustand (authStore)
  - React Router (redirección)

**1.3 AdminModule Component**
- **Responsabilidad:** Panel administrativo completo
- **Tecnología:** React + shadcn/ui
- **Subcomponentes:**
  - AdminLayout (sidebar, header)
  - Dashboard
  - FormBuilder
  - UserManagement
  - Reports
  - AuditLogs
- **Dependencias:**
  - React Router (rutas anidadas)
  - Zustand (múltiples stores)
  - Axios (API calls)

**1.4 FormBuilder Component**
- **Responsabilidad:** Constructor visual de formularios drag & drop
- **Tecnología:** React + @dnd-kit
- **Subcomponentes:**
  - FieldPalette (paleta de campos)
  - Canvas (área de construcción)
  - FieldConfigurator (panel de propiedades)
  - PreviewPanel (vista previa en tiempo real)
- **Dependencias:**
  - @dnd-kit (drag & drop)
  - React Hook Form (preview)
  - Zod (validaciones)

**1.5 Dashboard Component**
- **Responsabilidad:** Visualización de KPIs y métricas
- **Tecnología:** React + Recharts
- **Subcomponentes:**
  - KPICards (métricas en cards)
  - LineChartWidget (tendencias temporales)
  - BarChartWidget (comparativas)
  - PieChartWidget (distribuciones)
  - FilterPanel (filtros de fecha, proyecto)
- **Dependencias:**
  - Recharts (visualizaciones)
  - date-fns (manejo de fechas)
  - Axios (fetch datos)

**1.6 ReportsModule Component**
- **Responsabilidad:** Generación y exportación de reportes
- **Tecnología:** React + xlsx
- **Subcomponentes:**
  - ReportConfigForm (configuración de filtros)
  - ReportViewer (visualización de resultados)
  - ExportButton (descarga Excel)
  - ChartRenderer (gráficos del reporte)
- **Dependencias:**
  - xlsx (exportación Excel)
  - Recharts (gráficos)
  - Axios (fetch datos)

**1.7 MobileModule Component (PWA)**
- **Responsabilidad:** Interfaz optimizada para móviles
- **Tecnología:** React + PWA + Service Worker
- **Subcomponentes:**
  - AssignmentsList (formularios asignados)
  - FormRenderer (renderizado dinámico de formularios)
  - GeolocationCapture (captura GPS)
  - CameraCapture (fotos)
  - OfflineManager (sincronización)
- **Dependencias:**
  - Browser Geolocation API
  - IndexedDB (almacenamiento offline)
  - Service Worker (offline capabilities)

---

**Capa 2: Lógica de Aplicación (Backend)**

**2.1 AuthController**
- **Responsabilidad:** Endpoints de autenticación
- **Tecnología:** Express + Firebase Admin SDK
- **Endpoints:**
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/auth/verify-token
  - POST /api/auth/refresh-token
- **Dependencias:**
  - Firebase Admin SDK (verificación tokens)
  - Prisma (consulta usuarios)
  - JWT (generación tokens)

**2.2 UserController**
- **Responsabilidad:** CRUD de usuarios
- **Tecnología:** Express + Prisma
- **Endpoints:**
  - GET /api/users (listar)
  - GET /api/users/:id (detalle)
  - POST /api/users (crear)
  - PUT /api/users/:id (actualizar)
  - DELETE /api/users/:id (desactivar)
- **Dependencias:**
  - Prisma Client
  - Zod (validación)
  - AuditService

**2.3 FormController**
- **Responsabilidad:** CRUD de formularios
- **Tecnología:** Express + Prisma
- **Endpoints:**
  - GET /api/forms (listar)
  - GET /api/forms/:id (detalle)
  - POST /api/forms (crear)
  - PUT /api/forms/:id (actualizar)
  - PATCH /api/forms/:id/publish (publicar)
  - PATCH /api/forms/:id/archive (archivar)
- **Dependencias:**
  - Prisma Client
  - Zod (validación de schema JSON)
  - AuditService

**2.4 AssignmentController**
- **Responsabilidad:** Gestión de asignaciones
- **Tecnología:** Express + Prisma
- **Endpoints:**
  - GET /api/assignments (listar del usuario)
  - GET /api/assignments/:id (detalle)
  - POST /api/assignments (crear asignación)
  - PUT /api/assignments/:id (actualizar)
  - DELETE /api/assignments/:id (cancelar)
- **Dependencias:**
  - Prisma Client
  - CronService (calcular fechas de vencimiento)
  - NotificationService

**2.5 ResponseController**
- **Responsabilidad:** Gestión de respuestas a formularios
- **Tecnología:** Express + Prisma
- **Endpoints:**
  - GET /api/form-responses (listar)
  - GET /api/form-responses/:id (detalle)
  - POST /api/form-responses (crear respuesta)
  - GET /api/form-responses/assignment/:assignmentId (por asignación)
- **Dependencias:**
  - Prisma Client
  - Zod (validación contra schema del formulario)
  - AuditService
  - NotificationService

**2.6 DashboardController**
- **Responsabilidad:** Cálculo de KPIs y métricas
- **Tecnología:** Express + Prisma
- **Endpoints:**
  - GET /api/dashboard/stats (métricas generales)
  - GET /api/dashboard/completeness (tasa de completitud)
  - GET /api/dashboard/performance (rendimiento)
  - GET /api/dashboard/trends (tendencias temporales)
- **Dependencias:**
  - Prisma Client (queries complejas con agregaciones)
  - Redis (caché de métricas - futuro)

**2.7 ReportController**
- **Responsabilidad:** Generación de reportes
- **Tecnología:** Express + Prisma + xlsx
- **Endpoints:**
  - POST /api/reports/generate (generar reporte)
  - GET /api/reports/:id/download (descargar Excel)
  - GET /api/reports/saved (reportes guardados)
- **Dependencias:**
  - Prisma Client
  - xlsx (generación Excel)
  - FileStorageService (almacenamiento temporal)

**2.8 AuditService**
- **Responsabilidad:** Registro de auditoría
- **Tecnología:** Express + Prisma
- **Métodos:**
  - logAction(userId, action, module, details)
  - getLogsByUser(userId, filters)
  - getLogsByModule(module, filters)
- **Dependencias:**
  - Prisma Client
- **Características:**
  - Registro automático de todas las acciones CRUD
  - Captura de IP y User-Agent
  - Almacenamiento de detalles en JSON

**2.9 NotificationService**
- **Responsabilidad:** Envío de notificaciones
- **Tecnología:** Express
- **Métodos:**
  - sendInAppNotification(userId, message)
  - sendEmailNotification(email, subject, body) - futuro
  - sendPushNotification(userId, payload) - futuro
- **Dependencias:**
  - Prisma Client (almacenar notificaciones)
  - SendGrid/Nodemailer (email - futuro)
  - Firebase Cloud Messaging (push - futuro)

---

**Capa 3: Acceso a Datos (Data Layer)**

**3.1 PrismaClient**
- **Responsabilidad:** ORM para acceso type-safe a PostgreSQL
- **Tecnología:** Prisma 6.18
- **Características:**
  - Queries type-safe
  - Relaciones automáticas
  - Transacciones
  - Migraciones versionadas
- **Dependencias:**
  - PostgreSQL 16

**3.2 PostgreSQL Database**
- **Responsabilidad:** Almacenamiento persistente de datos
- **Tecnología:** PostgreSQL 16 en Railway
- **Características:**
  - ACID compliance
  - JSON/JSONB support
  - PostGIS extension (geolocalización - futuro)
  - Índices optimizados
- **Tablas Principales:**
  - User
  - Form
  - FormAssignment
  - FormResponse
  - AuditLog

**3.3 FirebaseAdmin**
- **Responsabilidad:** Autenticación servidor-side
- **Tecnología:** Firebase Admin SDK 13.5
- **Métodos Principales:**
  - verifyIdToken(token)
  - createUser(userData)
  - updateUser(uid, userData)
- **Dependencias:**
  - Firebase Authentication (servicio cloud)

---

**Capa 4: Servicios Externos (External Services)**

**4.1 FirebaseAuth Service**
- **Responsabilidad:** Autenticación de usuarios (client-side)
- **Proveedor:** Google Firebase
- **SLA:** 99.95% uptime
- **Métodos:**
  - signInWithEmailAndPassword
  - createUserWithEmailAndPassword
  - signOut
  - onAuthStateChanged

**4.2 Sentry Monitoring**
- **Responsabilidad:** Monitoreo de errores y performance
- **Proveedor:** Sentry.io
- **Características:**
  - Error tracking automático
  - Performance monitoring
  - Release tracking
  - Source maps support
- **Integración:**
  - Frontend: Sentry Browser SDK
  - Backend: Sentry Node SDK

**4.3 Railway Hosting (Backend)**
- **Responsabilidad:** Hosting de backend y PostgreSQL
- **Proveedor:** Railway.app
- **Servicios:**
  - Container hosting (Node.js)
  - PostgreSQL managed
  - Auto-deploy desde GitHub
  - Backups automáticos

**4.4 Vercel Hosting (Frontend)**
- **Responsabilidad:** Hosting de frontend PWA
- **Proveedor:** Vercel
- **Servicios:**
  - Static site hosting
  - CDN global (300+ ubicaciones)
  - Auto-deploy desde GitHub
  - SSL/TLS automático

**4.5 AI Services (Microservicios Python)**
- **Responsabilidad:** Servicios de inteligencia artificial
- **Tecnología:** Python 3.11 + FastAPI
- **Componentes:**
  - YOLOv8 Service (detección EPP)
  - Claude Service (análisis de avance)
- **Deployment:** Railway containers separados

---

##### Relaciones de Dependencia entre Componentes

**Frontend → Backend:**
- Protocolo: HTTPS REST
- Autenticación: Bearer Token (JWT)
- Formato: JSON
- Cliente: Axios con interceptors

**Backend → Database:**
- Protocolo: PostgreSQL over TLS
- ORM: Prisma Client
- Connection Pooling: Máximo 10 conexiones

**Backend → Firebase Admin:**
- Protocolo: HTTPS
- SDK: Firebase Admin SDK
- Autenticación: Service Account credentials

**Frontend → Firebase Auth:**
- Protocolo: HTTPS + WebSocket
- SDK: Firebase Web SDK
- Tokens: JWT con refresh automático

**Backend → AI Services:**
- Protocolo: HTTPS REST
- Formato: JSON + Base64 (imágenes)
- Endpoints:
  - POST /detect-epp (YOLOv8)
  - POST /analyze-progress (Claude)

**Backend → Sentry:**
- Protocolo: HTTPS
- SDK: Sentry Node SDK
- Envío automático de errores y métricas

**Frontend/Backend → Cloud Hosting:**
- Deployment: Git push → Auto-deploy
- CI/CD: GitHub Actions
- Monitoreo: Health checks automáticos

---

### 3.3 Modelo de Datos (Criterio 2.1.2.5)

#### 3.3.1 Diagrama Entidad-Relación (Modelo Lógico)

**Descripción:** El modelo de datos de Collector Enterprise está diseñado para soportar formularios dinámicos, asignaciones con frecuencias configurables, trazabilidad completa y escalabilidad.

##### Entidades Principales

**ENTIDAD: User**
- **Descripción:** Almacena información de usuarios del sistema (administradores, managers, supervisores, operadores)
- **Atributos:**
  - `id` (UUID, PK) - Identificador único
  - `firebaseUid` (String, UNIQUE, NOT NULL) - ID de Firebase Authentication
  - `email` (String, UNIQUE, NOT NULL) - Correo electrónico
  - `name` (String, NOT NULL) - Nombre completo
  - `role` (Enum, NOT NULL, DEFAULT 'OPERATOR') - Rol: ADMIN, MANAGER, SUPERVISOR, OPERATOR
  - `isActive` (Boolean, NOT NULL, DEFAULT true) - Estado activo/inactivo
  - `createdAt` (DateTime, NOT NULL, DEFAULT now()) - Fecha de creación
  - `updatedAt` (DateTime, NOT NULL) - Fecha de última actualización

**ENTIDAD: Form**
- **Descripción:** Almacena definiciones de formularios dinámicos
- **Atributos:**
  - `id` (UUID, PK) - Identificador único
  - `title` (String, NOT NULL) - Título del formulario
  - `description` (Text, NULL) - Descripción detallada
  - `fields` (JSONB, NOT NULL) - Array de campos dinámicos con configuración
  - `version` (Integer, NOT NULL, DEFAULT 1) - Versión del formulario
  - `status` (Enum, NOT NULL, DEFAULT 'DRAFT') - Estado: DRAFT, PUBLISHED, ARCHIVED, REVISION_REQUESTED
  - `createdById` (UUID, FK → User.id, NOT NULL) - Usuario creador
  - `createdAt` (DateTime, NOT NULL, DEFAULT now())
  - `updatedAt` (DateTime, NOT NULL)

**ENTIDAD: FormAssignment**
- **Descripción:** Almacena asignaciones de formularios a usuarios con frecuencias
- **Atributos:**
  - `id` (UUID, PK) - Identificador único
  - `formId` (UUID, FK → Form.id, NOT NULL) - Formulario asignado
  - `userId` (UUID, FK → User.id, NOT NULL) - Usuario asignado
  - `frequency` (Enum, NOT NULL) - Frecuencia: DAILY, WEEKLY, BIWEEKLY, MONTHLY, ONCE, CUSTOM
  - `startDate` (DateTime, NOT NULL) - Fecha de inicio
  - `endDate` (DateTime, NULL) - Fecha de fin (opcional)
  - `dueDate` (DateTime, NOT NULL) - Próxima fecha de vencimiento
  - `isCompleted` (Boolean, NOT NULL, DEFAULT false) - Estado de completitud
  - `priority` (Enum, NOT NULL, DEFAULT 'MEDIUM') - Prioridad: HIGH, MEDIUM, LOW
  - `instructions` (Text, NULL) - Instrucciones adicionales
  - `createdAt` (DateTime, NOT NULL, DEFAULT now())
  - `updatedAt` (DateTime, NOT NULL)

**ENTIDAD: FormResponse**
- **Descripción:** Almacena respuestas de usuarios a formularios
- **Atributos:**
  - `id` (UUID, PK) - Identificador único
  - `formId` (UUID, FK → Form.id, NOT NULL) - Formulario respondido
  - `assignmentId` (UUID, FK → FormAssignment.id, NULL) - Asignación relacionada (puede ser NULL si es respuesta independiente)
  - `userId` (UUID, FK → User.id, NOT NULL) - Usuario que respondió
  - `data` (JSONB, NOT NULL) - Respuestas del formulario (estructura dinámica)
  - `latitude` (Float, NULL) - Latitud GPS
  - `longitude` (Float, NULL) - Longitud GPS
  - `accuracy` (Float, NULL) - Precisión GPS en metros
  - `submittedAt` (DateTime, NOT NULL, DEFAULT now()) - Fecha y hora de envío

**ENTIDAD: AuditLog**
- **Descripción:** Registro de auditoría de todas las acciones del sistema
- **Atributos:**
  - `id` (UUID, PK) - Identificador único
  - `userId` (UUID, FK → User.id, NOT NULL) - Usuario que ejecutó la acción
  - `action` (String(100), NOT NULL) - Acción realizada (ej: "CREATE_FORM", "UPDATE_USER")
  - `module` (String(50), NOT NULL) - Módulo del sistema (ej: "FORMS", "USERS", "ASSIGNMENTS")
  - `entityId` (UUID, NULL) - ID de la entidad afectada
  - `details` (JSONB, NULL) - Detalles adicionales de la acción (estado anterior/nuevo, etc.)
  - `ipAddress` (String(45), NULL) - Dirección IP del usuario (soporte IPv4 e IPv6)
  - `userAgent` (Text, NULL) - User-Agent del navegador
  - `createdAt` (DateTime, NOT NULL, DEFAULT now()) - Timestamp de la acción

**ENTIDAD: Notification**
- **Descripción:** Notificaciones in-app para usuarios (futuro)
- **Atributos:**
  - `id` (UUID, PK)
  - `userId` (UUID, FK → User.id, NOT NULL)
  - `title` (String, NOT NULL)
  - `message` (Text, NOT NULL)
  - `type` (Enum, NOT NULL) - INFO, SUCCESS, WARNING, ERROR
  - `isRead` (Boolean, NOT NULL, DEFAULT false)
  - `link` (String, NULL) - URL relacionada (opcional)
  - `createdAt` (DateTime, NOT NULL, DEFAULT now())

**ENTIDAD: Ticket (Sistema de Bodega - Implementación Futura)**
- **Descripción:** Tickets para solicitud y entrega de materiales en bodega
- **Atributos:**
  - `id` (UUID, PK)
  - `workerId` (UUID, FK → User.id, NOT NULL) - Trabajador solicitante
  - `createdById` (UUID, FK → User.id, NOT NULL) - Supervisor/Prevencionista que creó el ticket
  - `status` (Enum, NOT NULL, DEFAULT 'PENDING') - PENDING, SCANNED, DELIVERED, CANCELLED
  - `materials` (JSONB, NOT NULL) - Array de materiales solicitados
  - `qrCode` (String, UNIQUE, NOT NULL) - Código QR único
  - `scannedAt` (DateTime, NULL) - Fecha de escaneo en bodega
  - `scannedById` (UUID, FK → User.id, NULL) - Encargado de bodega que escaneó
  - `deliveredAt` (DateTime, NULL) - Fecha de entrega
  - `notes` (Text, NULL) - Notas adicionales
  - `createdAt` (DateTime, NOT NULL, DEFAULT now())
  - `updatedAt` (DateTime, NOT NULL)

---

##### Relaciones entre Entidades

**User → Form (1:N - Relación "createdForms")**
- Un usuario (ADMIN/MANAGER) puede crear múltiples formularios
- Un formulario es creado por un solo usuario
- FK: Form.createdById → User.id
- Cascada: NO DELETE (mantener histórico, marcar como ARCHIVED)

**User → FormAssignment (1:N - Relación "assignments")**
- Un usuario puede tener múltiples asignaciones de formularios
- Una asignación pertenece a un solo usuario
- FK: FormAssignment.userId → User.id
- Cascada: NO DELETE (mantener histórico)

**User → AuditLog (1:N - Relación "auditLogs")**
- Un usuario puede tener múltiples registros de auditoría
- Un log pertenece a un solo usuario
- FK: AuditLog.userId → User.id
- Cascada: NO DELETE (inmutable, trazabilidad legal)

**Form → FormAssignment (1:N - Relación "assignments")**
- Un formulario puede asignarse múltiples veces (diferentes usuarios, períodos)
- Una asignación pertenece a un solo formulario
- FK: FormAssignment.formId → Form.id
- Cascada: NO DELETE (mantener histórico)

**Form → FormResponse (1:N - Relación "responses")**
- Un formulario puede tener múltiples respuestas
- Una respuesta pertenece a un solo formulario
- FK: FormResponse.formId → Form.id
- Cascada: NO DELETE (datos críticos, no eliminar)

**FormAssignment → FormResponse (1:1 o 1:0 - Relación "response")**
- Una asignación puede tener máximo una respuesta (o ninguna si no se ha completado)
- Una respuesta está relacionada con una asignación (puede ser NULL si es respuesta independiente)
- FK: FormResponse.assignmentId → FormAssignment.id (NULLABLE)
- Cascada: SET NULL si se elimina asignación

**User → FormResponse (1:N - Relación "responses")**
- Un usuario puede tener múltiples respuestas
- Una respuesta pertenece a un solo usuario
- FK: FormResponse.userId → User.id
- Cascada: NO DELETE (mantener histórico)

**User → Notification (1:N - futuro)**
- Un usuario puede tener múltiples notificaciones
- Una notificación pertenece a un solo usuario
- FK: Notification.userId → User.id
- Cascada: DELETE CASCADE (las notificaciones pueden eliminarse si se elimina usuario)

**User → Ticket (1:N - futuro, relación "ticketsCreated")**
- Un supervisor puede crear múltiples tickets
- FK: Ticket.createdById → User.id

**User → Ticket (1:N - futuro, relación "ticketsReceived")**
- Un trabajador puede recibir múltiples tickets
- FK: Ticket.workerId → User.id

---

##### Índices Optimizados

**Índices en User:**
- `PRIMARY KEY (id)` - B-tree
- `UNIQUE INDEX (email)` - B-tree, búsqueda rápida por email
- `UNIQUE INDEX (firebaseUid)` - B-tree, autenticación
- `INDEX (role, isActive)` - Composite, filtrado por rol y estado

**Índices en Form:**
- `PRIMARY KEY (id)` - B-tree
- `INDEX (status, createdAt)` - Composite, listar formularios publicados ordenados por fecha
- `INDEX (createdById)` - B-tree, formularios de un usuario

**Índices en FormAssignment:**
- `PRIMARY KEY (id)` - B-tree
- `INDEX (userId, isCompleted, dueDate)` - Composite, dashboard del operador (formularios pendientes ordenados por vencimiento)
- `INDEX (formId, startDate)` - Composite, asignaciones de un formulario
- `INDEX (dueDate, isCompleted)` - Composite, formularios próximos a vencer

**Índices en FormResponse:**
- `PRIMARY KEY (id)` - B-tree
- `INDEX (formId, submittedAt)` - Composite, respuestas de un formulario ordenadas por fecha
- `INDEX (userId, submittedAt)` - Composite, respuestas de un usuario
- `INDEX (assignmentId)` - B-tree, respuesta de una asignación específica
- `GIN INDEX (data)` - GIN (Generalized Inverted Index), búsquedas en JSON (consultas específicas de campos dinámicos)

**Índices en AuditLog:**
- `PRIMARY KEY (id)` - B-tree
- `INDEX (userId, createdAt)` - Composite, logs de un usuario
- `INDEX (module, action, createdAt)` - Composite, logs por módulo y acción
- `INDEX (createdAt)` - B-tree, logs recientes (con particionamiento por fecha en futuro)

---

#### 3.3.2 Diccionario de Datos Completo

| Entidad | Atributo | Tipo de Dato | Long./Precisión | Restricciones | Valor por Defecto | Descripción |
|---------|----------|--------------|-----------------|---------------|-------------------|-------------|
| **User** | id | UUID | - | PK, NOT NULL | uuid_generate_v4() | Identificador único del usuario |
| User | firebaseUid | VARCHAR | 255 | UNIQUE, NOT NULL | - | ID de Firebase Authentication (formato: "abc123...") |
| User | email | VARCHAR | 255 | UNIQUE, NOT NULL | - | Correo electrónico del usuario, usado para login |
| User | name | VARCHAR | 255 | NOT NULL | - | Nombre completo del usuario (ej: "Juan Pérez González") |
| User | role | ENUM | - | NOT NULL, CHECK | 'OPERATOR' | Rol del usuario: 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR' |
| User | isActive | BOOLEAN | - | NOT NULL | true | Estado activo (true) o inactivo (false), usuarios inactivos no pueden iniciar sesión |
| User | createdAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora de creación del registro (UTC) |
| User | updatedAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora de última actualización (actualizado automáticamente) |
| **Form** | id | UUID | - | PK, NOT NULL | uuid_generate_v4() | Identificador único del formulario |
| Form | title | VARCHAR | 255 | NOT NULL | - | Título del formulario (ej: "Inspección Diaria de Seguridad") |
| Form | description | TEXT | - | NULL | NULL | Descripción detallada del propósito del formulario |
| Form | fields | JSONB | - | NOT NULL | '[]'::jsonb | Array JSON de campos dinámicos con configuración completa (tipo, label, validaciones, opciones) |
| Form | version | INTEGER | - | NOT NULL, CHECK >= 1 | 1 | Versión del formulario (incrementa con cambios post-publicación) |
| Form | status | ENUM | - | NOT NULL, CHECK | 'DRAFT' | Estado: 'DRAFT', 'PUBLISHED', 'ARCHIVED', 'REVISION_REQUESTED' |
| Form | createdById | UUID | - | FK → User.id, NOT NULL | - | ID del usuario que creó el formulario |
| Form | createdAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación |
| Form | updatedAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha de última modificación |
| **FormAssignment** | id | UUID | - | PK, NOT NULL | uuid_generate_v4() | Identificador único de la asignación |
| FormAssignment | formId | UUID | - | FK → Form.id, NOT NULL | - | ID del formulario asignado |
| FormAssignment | userId | UUID | - | FK → User.id, NOT NULL | - | ID del usuario al que se asigna |
| FormAssignment | frequency | ENUM | - | NOT NULL | 'ONCE' | Frecuencia: 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONCE', 'CUSTOM' |
| FormAssignment | startDate | TIMESTAMP | - | NOT NULL | - | Fecha de inicio de la asignación |
| FormAssignment | endDate | TIMESTAMP | - | NULL, CHECK endDate > startDate | NULL | Fecha de fin (opcional, NULL = sin límite) |
| FormAssignment | dueDate | TIMESTAMP | - | NOT NULL | - | Próxima fecha de vencimiento calculada según frecuencia |
| FormAssignment | isCompleted | BOOLEAN | - | NOT NULL | false | Indica si el formulario ha sido completado (true) o está pendiente (false) |
| FormAssignment | priority | ENUM | - | NOT NULL | 'MEDIUM' | Prioridad: 'HIGH', 'MEDIUM', 'LOW' |
| FormAssignment | instructions | TEXT | - | NULL | NULL | Instrucciones adicionales para el operador |
| FormAssignment | createdAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha de creación de la asignación |
| FormAssignment | updatedAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha de última actualización |
| **FormResponse** | id | UUID | - | PK, NOT NULL | uuid_generate_v4() | Identificador único de la respuesta |
| FormResponse | formId | UUID | - | FK → Form.id, NOT NULL | - | ID del formulario respondido |
| FormResponse | assignmentId | UUID | - | FK → FormAssignment.id, NULL | NULL | ID de la asignación relacionada (NULL si es respuesta independiente) |
| FormResponse | userId | UUID | - | FK → User.id, NOT NULL | - | ID del usuario que respondió |
| FormResponse | data | JSONB | - | NOT NULL | '{}'::jsonb | Objeto JSON con respuestas a cada campo del formulario (estructura dinámica según formulario) |
| FormResponse | latitude | DOUBLE PRECISION | 8 bytes | NULL, CHECK BETWEEN -90 AND 90 | NULL | Latitud GPS en grados decimales (ej: -33.4372) |
| FormResponse | longitude | DOUBLE PRECISION | 8 bytes | NULL, CHECK BETWEEN -180 AND 180 | NULL | Longitud GPS en grados decimales (ej: -70.6506) |
| FormResponse | accuracy | DOUBLE PRECISION | 8 bytes | NULL, CHECK >= 0 | NULL | Precisión de la ubicación GPS en metros |
| FormResponse | submittedAt | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | Fecha y hora de envío de la respuesta (UTC) |
| **AuditLog** | id | UUID | - | PK, NOT NULL | uuid_generate_v4() | Identificador único del log |
| AuditLog | userId | UUID | - | FK → User.id, NOT NULL | - | ID del usuario que ejecutó la acción |
| AuditLog | action | VARCHAR | 100 | NOT NULL | - | Acción realizada (ej: "CREATE_FORM", "UPDATE_USER", "DELETE_ASSIGNMENT") |
| AuditLog | module | VARCHAR |


# INFORME N°2 - PARTE 6: TOPOLOGÍA, INFRAESTRUCTURA Y KPIs

## Continuación: 3.3.2 Diccionario de Datos (finalización)

| Entidad | Atributo | Tipo de Dato | Long./Precisión | Restricciones | Valor por Defecto | Descripción |
|---------|----------|--------------|-----------------|---------------|-------------------|-------------|
| AuditLog | module | VARCHAR | 50 | NOT NULL | - | Módulo del sistema (ej: "FORMS", "USERS", "ASSIGNMENTS", "RESPONSES") |
| AuditLog | entityId | UUID | - | NULL | NULL | ID de la entidad afectada por la acción (ej: formId si action="CREATE_FORM") |
| AuditLog | details | JSONB | - | NULL | NULL | Objeto JSON con detalles adicionales (ej: valores anteriores y nuevos en UPDATE) |
| AuditLog | ipAddress | VARCHAR | 45 | NULL | NULL | Dirección IP del usuario (formato IPv4: "192.168.1.1" o IPv6) |
| AuditLog | userAgent | TEXT | - | NULL | NULL | User-Agent del navegador del usuario |
| AuditLog | createdAt | TIMESTAMP | - | NOT NULL, IMMUTABLE | CURRENT_TIMESTAMP | Timestamp de la acción (inmutable, no puede actualizarse) |

---

### 3.4 Topología de Comunicaciones (Criterio 2.1.2.6)

#### 3.4.1 Diagrama de Topología de Red

**Descripción:** Este diagrama describe la topología de comunicación que soporta la solución Collector Enterprise, incluyendo protocolos, puertos, formatos de datos y características de transmisión.

##### Componentes de Red y Flujos de Comunicación

**1. Cliente (Browser/Mobile PWA) ↔ Frontend (Vercel)**

**Protocolo:** HTTPS (TLS 1.3)
- **Puerto:** 443 (producción), 5173 (desarrollo local)
- **Método:** HTTP/2 (multiplexing)
- **Formato:** HTML, CSS, JavaScript (assets), JSON (datos)

**Características de Transmisión:**
- Encriptación: TLS 1.3 (cifrado simétrico AES-256-GCM)
- Certificado SSL: Let's Encrypt (renovación automática)
- Compresión: Gzip/Brotli para assets
- Caching: 
  - Immutable assets (JS, CSS con hash): 1 año
  - HTML: Sin caché (revalidación siempre)
- CDN: Vercel Edge Network (300+ ubicaciones)
  - Latencia típica: <50ms (desde Chile)
  - Time to First Byte (TTFB): <200ms

**Flujo:**
1. Cliente solicita `https://collector-amaranto.vercel.app`
2. DNS resuelve a Vercel Edge Network (anycast IP más cercana)
3. Edge server responde con HTML
4. Cliente solicita assets (JS, CSS, imágenes)
5. Edge server responde desde caché o origin
6. PWA se instala (Service Worker)

---

**2. Frontend (Vercel) ↔ Backend API (Railway)**

**Protocolo:** HTTPS REST (TLS 1.3)
- **Puerto:** 443 (producción), 3000 (desarrollo local)
- **Método:** HTTP/1.1
- **Formato:** JSON (application/json)

**Endpoints REST:**
- `GET /api/users` - Listar usuarios
- `POST /api/auth/login` - Autenticación
- `POST /api/form-responses` - Crear respuesta
- (15+ endpoints documentados)

**Características de Transmisión:**
- Encriptación: TLS 1.3 end-to-end
- Autenticación: Bearer Token (JWT) en header Authorization
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- Rate Limiting: 100 requests / 15 minutos por IP
- Timeout: 30 segundos por request
- Retry Logic (frontend): 3 intentos con backoff exponencial
- Request/Response Example:
  ```json
  // Request
  POST /api/form-responses
  Content-Type: application/json
  Authorization: Bearer {token}
  {
    "assignmentId": "uuid",
    "formId": "uuid",
    "data": { "campo1": "valor1" },
    "latitude": -33.4372,
    "longitude": -70.6506
  }
  
  // Response
  HTTP/1.1 201 Created
  Content-Type: application/json
  {
    "responseId": "uuid",
    "message": "Respuesta guardada exitosamente"
  }
  ```

**Flujo Típico:**
1. Frontend hace request HTTPS a API
2. Railway load balancer recibe request
3. Express middleware verifica JWT token
4. Controller procesa lógica
5. Service interactúa con BD
6. Response JSON retorna a frontend
7. Frontend actualiza UI

---

**3. Backend API (Railway) ↔ PostgreSQL Database (Railway)**

**Protocolo:** PostgreSQL Protocol over TLS
- **Puerto:** 5432 (interno Railway), no expuesto públicamente
- **Versión:** PostgreSQL 16
- **Cliente:** Prisma Client

**Características de Transmisión:**
- Encriptación: TLS 1.2+ (require_ssl=on)
- Autenticación: Usuario/contraseña + certificate verification
- Connection String:
  ```
  postgresql://user:password@host:5432/database?sslmode=require
  ```
- Connection Pooling:
  - Prisma mantiene pool de conexiones
  - Máximo: 10 conexiones concurrentes
  - Idle timeout: 60 segundos
  - Connection timeout: 10 segundos
- Query Protocol: Extended Query Protocol (prepared statements)
- Formato de Datos: Binario (más eficiente que texto)

**Flujo de Query:**
1. Backend (Prisma) abre conexión del pool
2. Envía query SQL parametrizada
3. PostgreSQL ejecuta query
4. PostgreSQL retorna resultados (formato binario)
5. Prisma deserializa a objetos TypeScript
6. Conexión retorna al pool

**Optimizaciones:**
- Prepared Statements: Previene SQL injection, mejora performance
- Transacciones: BEGIN → queries → COMMIT/ROLLBACK
- Índices: B-tree y GIN para búsquedas rápidas

---

**4. Frontend/Backend ↔ Firebase Authentication**

**Protocolo:** HTTPS (TLS 1.3) + WebSocket (autenticación persistente)
- **Endpoints:**
  - Frontend: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
  - Backend: Firebase Admin SDK (HTTPS REST)
- **Formato:** JSON

**Características:**
- **Frontend (Client SDK):**
  - Autenticación: OAuth 2.0
  - Token: JWT (ID Token) con expiración 1 hora
  - Refresh: Automático con Refresh Token
  - Persistencia: localStorage (token encriptado)
  - WebSocket: Para mantener sesión activa
  
- **Backend (Admin SDK):**
  - Verificación de tokens:
    ```typescript
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    // decodedToken contiene: uid, email, claims
    ```
  - Service Account: Credentials JSON privadas

**Flujo de Autenticación:**
1. Usuario ingresa credenciales en frontend
2. Frontend llama Firebase Auth API
3. Firebase valida y retorna ID Token + Refresh Token
4. Frontend guarda tokens en localStorage
5. Frontend incluye ID Token en requests a backend
6. Backend verifica ID Token con Firebase Admin SDK
7. Backend identifica usuario y procesa request

---

**5. Backend ↔ Servicios de IA (Python Microservicios)**

**Protocolo:** HTTPS REST
- **Puerto:** 443 (producción)
- **Formato:** JSON + Base64 (imágenes)

**Endpoints:**
- `POST /detect-epp` (YOLOv8 Service)
  ```json
  {
    "image": "base64_encoded_image",
    "threshold": 0.5
  }
  ```
  Response:
  ```json
  {
    "detections": [
      { "class": "helmet", "confidence": 0.96, "bbox": [x, y, w, h] },
      { "class": "vest", "confidence": 0.89, "bbox": [x, y, w, h] }
    ],
    "missingEPP": ["harness"],
    "processingTime": 3.2
  }
  ```

- `POST /analyze-progress` (Claude Service)
  ```json
  {
    "image": "base64_encoded_image",
    "context": "Análisis de avance de fundaciones"
  }
  ```

**Características:**
- Timeout: 60 segundos (IA puede tardar)
- Retry Logic: 2 intentos
- Caching: Resultados cacheados por hash de imagen (24 horas)
- Queue: Si hay alta carga, usar cola Redis (futuro)

---

**6. Frontend/Backend ↔ Sentry (Monitoring)**

**Protocolo:** HTTPS
- **Endpoint:** `https://sentry.io/api/{project}/store/`
- **Formato:** JSON (eventos de error) + Source Maps

**Características:**
- Envío Automático: Al detectar error no capturado
- Batch: Agrupa múltiples eventos (reduce requests)
- Sampling: 100% en desarrollo, 10% en producción (reducir costos)
- Contexto Enriquecido:
  - User info (ID, email - sin PII sensible)
  - Browser info (user agent, viewport)
  - Breadcrumbs (últimas 100 acciones)
  - Stack trace con source maps

**Flujo:**
1. Error ocurre en frontend/backend
2. Sentry SDK captura error
3. SDK agrega contexto y stack trace
4. SDK envía evento a Sentry (HTTPS POST)
5. Sentry procesa y notifica (email, Slack)

---

#### 3.4.2 Protocolos de Comunicación Detallados

**HTTP/HTTPS (Hypertext Transfer Protocol Secure)**
- **Versión:** HTTP/2 (frontend-Vercel), HTTP/1.1 (REST API)
- **Métodos Utilizados:**
  - GET: Obtener recursos (idempotente)
  - POST: Crear recursos
  - PUT: Actualizar recursos completos
  - PATCH: Actualizar recursos parcialmente
  - DELETE: Eliminar recursos (soft delete)
- **Status Codes:**
  - 200 OK: Success
  - 201 Created: Recurso creado
  - 204 No Content: Success sin body
  - 400 Bad Request: Error de validación
  - 401 Unauthorized: No autenticado
  - 403 Forbidden: No autorizado
  - 404 Not Found: Recurso no existe
  - 500 Internal Server Error: Error del servidor
- **Headers Críticos:**
  - `Content-Type: application/json`
  - `Authorization: Bearer {token}`
  - `X-RateLimit-Limit`, `X-RateLimit-Remaining`
  - Security Headers (Helmet):
    - `Strict-Transport-Security: max-age=31536000`
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Content-Security-Policy: ...`

**WebSocket (Futuro - Real-time Updates)**
- **Protocolo:** WSS (WebSocket Secure)
- **Uso:** Notificaciones en tiempo real, actualizaciones de dashboard
- **Librería:** Socket.io
- **Eventos:**
  - `new-response`: Nueva respuesta a formulario
  - `assignment-created`: Nueva asignación
  - `dashboard-update`: Actualización de KPIs

**PostgreSQL Wire Protocol**
- **Versión:** Protocol Version 3.0
- **Modo:** Extended Query Protocol (prepared statements)
- **Características:**
  - Binary Format: Datos en formato binario (más eficiente)
  - Pipelining: Múltiples queries en una conexión
  - Transacciones: ACID compliance

**CORS (Cross-Origin Resource Sharing)**
- **Configuración Backend:**
  ```typescript
  app.use(cors({
    origin: process.env.FRONTEND_URL, // https://collector-amaranto.vercel.app
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  ```
- **Preflight Requests:** OPTIONS method para requests complejos

---

### 3.5 Diagrama de Infraestructura (Criterio 2.1.2.7)

#### 3.5.1 Componentes de Infraestructura

**Capa 1: Presentación y Distribución de Contenido**

**1.1 Vercel Edge Network (CDN)**
- **Ubicaciones:** 300+ edge locations globalmente
- **Funcionalidad:**
  - Caché de assets estáticos (JS, CSS, imágenes, fonts)
  - Distribución geográfica para latencia mínima
  - DDoS protection (capa 7)
  - Compresión automática (Gzip, Brotli)
- **Configuración:**
  - Cache-Control headers optimizados
  - Immutable assets con hash en nombre de archivo
  - Edge caching para HTML con revalidación

**1.2 Vercel Serverless Functions**
- **Ubicación:** us-east-1 (primary), auto-scaling a otras regiones
- **Características:**
  - Serverless hosting de aplicación React
  - Auto-scaling horizontal (sin límite de instancias)
  - Cold start: <1 segundo (minimal API)
  - Timeout: 10 segundos (plan Hobby), 60 segundos (plan Pro)

**1.3 SSL/TLS Certificates**
- **Proveedor:** Let's Encrypt (automático vía Vercel)
- **Protocolo:** TLS 1.3
- **Características:**
  - Wildcard certificate: *.collector-amaranto.vercel.app
  - Renovación automática cada 90 días
  - HSTS preload habilitado
  - Perfect Forward Secrecy (PFS)

---

**Capa 2: Aplicación y Lógica de Negocio**

**2.1 Railway Container (Backend API)**
- **Plataforma:** Railway.app
- **Ubicación:** us-west (Oregon, USA)
- **Contenedor:**
  - Base Image: Node 20 Alpine
  - CPU: 1-2 vCPUs (escalable)
  - RAM: 512MB - 2GB (escalable)
  - Storage: 10GB SSD
  - Network: 100GB transfer/mes
- **Auto-Scaling:**
  - Horizontal: Hasta 5 instancias (plan Pro)
  - Trigger: >80% CPU por 5 minutos
  - Load Balancer: Automático (Round Robin)
- **Health Checks:**
  - Endpoint: GET /health
  - Intervalo: 30 segundos
  - Timeout: 5 segundos
  - Unhealthy threshold: 3 fallos consecutivos

**2.2 Railway PostgreSQL (Database)**
- **Versión:** PostgreSQL 16
- **Configuración:**
  - CPU: Compartida
  - RAM: 256MB - 1GB
  - Storage: 500MB (gratis) → 5GB (plan pago)
  - SSD: NVMe (alta velocidad I/O)
- **Backups:**
  - Frecuencia: Diarios automáticos
  - Retención: 7 días
  - Snapshot: Full database backup
  - Tiempo de restauración: <30 minutos
- **High Availability (futuro):**
  - Primary-Standby replication
  - Failover automático: <2 minutos

**2.3 Railway Python Containers (Servicios IA)**
- **YOLOv8 Service:**
  - Base Image: Python 3.11 + CUDA (si GPU)
  - CPU: 1-2 vCPUs
  - RAM: 1-2GB (modelos cargados en memoria)
  - GPU (opcional): NVIDIA T4 (para inferencia más rápida)
  
- **Claude Service:**
  - Base Image: Python 3.11
  - CPU: 0.5-1 vCPU
  - RAM: 512MB (stateless, solo proxy a API)

---

**Capa 3: Servicios Externos y Seguridad**

**3.1 Firebase Authentication**
- **Proveedor:** Google Cloud Platform
- **SLA:** 99.95% uptime
- **Ubicación:** Multi-región (us, eu)
- **Características:**
  - Escalabilidad: Ilimitada (gestionado por Google)
  - Latencia: <500ms (autenticación)
  - Seguridad: SOC 2, ISO 27001 certified

**3.2 Sentry Monitoring**
- **Plan:** Developer (5K eventos/mes gratuito)
- **Características:**
  - Error tracking en tiempo real
  - Performance monitoring
  - Release tracking
  - Source maps para stack traces
- **Retención:** 30 días (plan gratuito)

**3.3 GitHub (Repositorio y CI/CD)**
- **Plan:** Free (repositorio privado)
- **GitHub Actions:**
  - Runners: Ubuntu latest
  - Minutes: 2000/mes gratuitos
  - Workflows:
    - CI: Lint, test (en cada PR)
    - CD: Deploy (en merge a main)

---

**Capa 4: Red y Seguridad**

**4.1 Firewall y Seguridad de Red**
- **Vercel:**
  - DDoS Protection: Layer 7 (HTTP/HTTPS)
  - IP Filtering: Opcional (no necesario actualmente)
  - WAF (Web Application Firewall): Futuro

- **Railway:**
  - Internal Network: Aislamiento entre proyectos
  - Firewall: Solo puerto 443 expuesto públicamente
  - Private Networking: Backend ↔ PostgreSQL (no expuesto)

**4.2 Rate Limiting y Protección**
- **Frontend (Vercel):**
  - Rate Limiting: 100 requests/10 segundos por IP (Edge)
  
- **Backend (Express):**
  - express-rate-limit: 100 requests/15 minutos por IP
  - Response Headers:
    ```
    X-RateLimit-Limit: 100
    X-RateLimit-Remaining: 87
    X-RateLimit-Reset: 1700000000
    ```

**4.3 SSL/TLS y Encriptación**
- **En Tránsito:**
  - TLS 1.3 para todas las comunicaciones HTTPS
  - Cipher Suites: AES-256-GCM, ChaCha20-Poly1305
  - Certificate Pinning (futuro app móvil nativa)

- **En Reposo:**
  - PostgreSQL: Encryption at rest (Railway gestionado)
  - Backups: Encriptados AES-256
  - Secrets: Variables de entorno encriptadas (Railway Secrets)

---

### 3.6 Diagrama de Arquitectura General (Criterio 2.1.2.8)

#### 3.6.1 Arquitectura en Capas (Layered Architecture)

**Patrón Arquitectónico:** MVC (Model-View-Controller) + Microservicios

**Vista General:**
```
[Cliente Browser/PWA]
        ↓ HTTPS
[CDN Vercel Edge Network]
        ↓
[Frontend React PWA - Vercel]
        ↓ REST API (HTTPS + JWT)
[Backend Express API - Railway]
        ↓
├── [PostgreSQL DB - Railway]
├── [Firebase Auth - Google Cloud]
├── [Servicios IA Python - Railway]
└── [Sentry Monitoring]
```

---

**CAPA 1: PRESENTACIÓN (Frontend - Client-Side)**

**Componentes de Software:**
- **React 19.1:** Framework UI
- **TypeScript 5.9:** Lenguaje
- **Vite 7.1:** Build tool
- **shadcn/ui:** Componentes UI accesibles
- **Tailwind CSS 3.4:** Framework CSS
- **Zustand 5.0:** State management
- **React Router 7.9:** Routing
- **Axios 1.13:** Cliente HTTP
- **Firebase SDK 12.5:** Autenticación cliente

**Responsabilidades:**
- Renderizado de UI responsive (mobile-first)
- Gestión de estado de aplicación (Zustand stores)
- Validación de formularios (React Hook Form + Zod)
- Comunicación con backend (API REST)
- Autenticación (Firebase Auth)
- Funcionalidad offline (Service Worker + IndexedDB)
- PWA capabilities (installable, push notifications futuro)

**Componentes de Hardware (Infraestructura):**
- **Hosting:** Vercel Serverless
- **CDN:** Vercel Edge Network (300+ locations)
- **SSL:** Let's Encrypt (TLS 1.3)

---

**CAPA 2: LÓGICA DE APLICACIÓN (Backend - Server-Side)**

**Componentes de Software:**
- **Node.js 20:** Runtime JavaScript
- **Express 5.1:** Framework web
- **TypeScript 5.9:** Lenguaje
- **Prisma 6.18:** ORM
- **Firebase Admin SDK 13.5:** Verificación de tokens
- **Zod 4.1:** Validación de datos
- **Helmet 8.1:** Seguridad HTTP headers
- **CORS 2.8:** Control de acceso
- **express-rate-limit 8.2:** Rate limiting
- **Sentry SDK 10.22:** Monitoreo de errores

**Estructura Modular:**
```
backend/src/
├── controllers/     # Manejo de requests/responses
│   ├── authController.ts
│   ├── userController.ts
│   ├── formController.ts
│   ├── assignmentController.ts
│   ├── responseController.ts
│   ├── dashboardController.ts
│   └── reportController.ts
├── services/        # Lógica de negocio reutilizable
│   ├── userService.ts
│   ├── formService.ts
│   ├── assignmentService.ts
│   ├── auditService.ts
│   └── notificationService.ts
├── routes/          # Definición de rutas REST
│   ├── authRoutes.ts
│   ├── userRoutes.ts
│   ├── formRoutes.ts
│   └── ...
├── middleware/      # Middleware personalizado
│   ├── authenticate.ts    # Verificación JWT
│   ├── authorize.ts       # Control de acceso por rol
│   ├── validate.ts        # Validación Zod
│   └── errorHandler.ts    # Manejo de errores
├── utils/           # Utilidades
│   └── logger.ts
└── prisma/          # Schema y migraciones
    └── schema.prisma
```

**Responsabilidades:**
- Autenticación y autorización (Firebase Admin + JWT)
- Validación de datos (Zod schemas)
- Lógica de negocio (cálculo de KPIs, gestión de asignaciones)
- Acceso a base de datos (Prisma ORM)
- Auditoría de acciones (AuditLog)
- Integración con servicios externos (IA, Firebase)
- Generación de reportes (Excel con xlsx)

**Componentes de Hardware (Infraestructura):**
- **Hosting:** Railway Container
- **CPU:** 1-2 vCPUs
- **RAM:** 512MB - 2GB
- **Storage:** 10GB SSD
- **Network:** 100GB transfer/mes

---

**CAPA 3: ACCESO A DATOS (Data Layer)**

**Componentes de Software:**
- **Prisma Client:** ORM generado desde schema
- **PostgreSQL Driver:** pg (node-postgres)

**Schema de Base de Datos (Prisma):**
```prisma
model User {
  id          String   @id @default(uuid())
  firebaseUid String   @unique
  email       String   @unique
  name        String
  role        Role     @default(OPERATOR)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones
  createdForms      Form[]
  assignments       FormAssignment[]
  responses         FormResponse[]
  auditLogs         AuditLog[]
}

model Form {
  id          String     @id @default(uuid())
  title       String
  description String?
  fields      Json       // Array de campos dinámicos
  version     Int        @default(1)
  status      FormStatus @default(DRAFT)
  createdById String
  createdBy   User       @relation(fields: [createdById], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relaciones
  assignments FormAssignment[]
  responses   FormResponse[]
}

// ... (otros modelos)
```

**Responsabilidades:**
- Abstracción de acceso a PostgreSQL
- Queries type-safe con TypeScript
- Gestión de relaciones entre entidades
- Migraciones versionadas
- Transaction management

**Componentes de Hardware (Infraestructura):**
- **Database:** PostgreSQL 16 en Railway
- **Storage:** 500MB - 5GB SSD NVMe
- **RAM:** 256MB - 1GB
- **Backups:** Diarios automáticos, retención 7 días

---

**CAPA 4: SERVICIOS EXTERNOS (External Services)**

**4.1 Firebase Authentication**
- **Tipo:** Servicio gestionado (SaaS)
- **Responsabilidad:** Autenticación de usuarios
- **Integración:**
  - Frontend: Firebase Web SDK (client-side auth)
  - Backend: Firebase Admin SDK (token verification)

**4.2 Servicios de IA (Microservicios Python)**

**YOLOv8 Service (Detección de EPP):**
- **Framework:** FastAPI
- **Modelo:** YOLOv8n (nano) fine-tuned
- **Endpoint:** POST /detect-epp
- **Componentes:**
  - Ultralytics YOLO
  - OpenCV (procesamiento de imágenes)
  - Pillow (manipulación)
- **Infraestructura:**
  - Railway Container Python
  - CPU: 1-2 vCPUs (GPU opcional)
  - RAM: 1-2GB

**Claude Service (Análisis de Avance):**
- **Framework:** FastAPI
- **Modelo:** Claude Sonnet 4.0 (Anthropic API)
- **Endpoint:** POST /analyze-progress
- **Componentes:**
  - Anthropic SDK
  - Prompts engineering
- **Infraestructura:**
  - Railway Container Python
  - CPU: 0.5-1 vCPU (stateless)
  - RAM: 512MB

**4.3 Sentry Monitoring**
- **Tipo:** Servicio gestionado (SaaS)
- **Responsabilidad:**
  - Error tracking (frontend + backend)
  - Performance monitoring
  - Release tracking

---

## 4. CRITERIO 2.1.3: KPIs Y SLAs

### 4.1 Indicadores Clave de Desempeño - KPIs (Criterio 2.1.3.9)

Los siguientes KPIs han sido definidos utilizando la metodología **SMART** (Specific, Measurable, Achievable, Relevant, Time-bound) para medir la eficiencia y éxito de la solución Collector Enterprise.

---

#### KPI 1: Tasa de Completitud de Formularios

**S (Specific - Específico):**
Medir el porcentaje de formularios asignados que son completados exitosamente por los operadores dentro del plazo establecido, reflejando la adopción y cumplimiento del sistema.

**M (Measurable - Medible):**
- **Fórmula:** `(Formularios Completados / Formularios Asignados) × 100`
- **Unidad:** Porcentaje (%)
- **Fuente de Datos:**
  - Tabla: `FormAssignment`
  - Campos: `isCompleted` (true/false), `dueDate`
  - Query:
    ```sql
    SELECT 
      COUNT(CASE WHEN isCompleted = true THEN 1 END) as completados,
      COUNT(*) as total_asignados,
      (COUNT(CASE WHEN isCompleted = true THEN 1 END)::float / COUNT(*)) * 100 as tasa_completitud
    FROM FormAssignment
    WHERE startDate >= '2024-01-01' AND startDate < '2024-02-01'
    ```

**A (Achievable - Alcanzable):**
- **Meta:** 85% de completitud mensual
- **Baseline Actual (proceso manual):** 60-70% estimado
- **Mejora Esperada:** +15-25 puntos porcentuales
- **Justificación:** Empresas similares con sistemas digitales logran 80-90%
- **Acciones de Soporte:**
  - Notificaciones automáticas antes de vencimiento
  - Interfaz intuitiva con validación en tiempo real
  - Capacitación de usuarios
  - Recordatorios push (futuro)

**R (Relevant - Relevante):**
- **Impacto en el Negocio:**
  - Cumplimiento normativo (DS 594, DS 76)
  - Reducción de multas (actualmente $3-5 millones/año)
  - Trazabilidad completa de operaciones
  - Datos para toma de decisiones
- **Alineación con Objetivos del Proyecto:**
  - Objetivo General: Mejorar eficiencia operacional en 40%
  - Digitalización de procesos manuales
- **Stakeholders Afectados:**
  - Operadores: Menos carga administrativa
  - Supervisores: Mejor visibilidad
  - Gerencia: Datos para decisiones

**T (Time-bound - Temporal):**
- **Medición:** Mensual
- **Revisión:** Semanal (early warning)
- **Hitos:**
  - Mes 1: 75% (período de adopción)
  - Mes 3: 80%
  - Mes 6: 85%
  - Mes 12: 90%
- **Reporte:** Dashboard en tiempo real + reporte mensual


# INFORME N°2 - PARTE 7: KPIs Y SLAs DETALLADOS

## Continuación: 4.1 KPIs (Criterio 2.1.3.9)

#### KPI 2: Tiempo Promedio de Respuesta de API

**S (Specific - Específico):**
Medir el tiempo promedio que tarda la API backend en procesar y responder requests HTTP, reflejando la performance del sistema y la experiencia del usuario.

**M (Measurable - Medible):**
- **Fórmula:** `Suma de tiempos de respuesta / Número de requests`
- **Métricas:**
  - **P50 (Mediana):** 50% de requests más rápidos
  - **P95:** 95% de requests más rápidos
  - **P99:** 99% de requests más rápidos
- **Unidad:** Milisegundos (ms)
- **Fuente de Datos:**
  - Sentry Performance Monitoring
  - Logs de Railway (response time)
  - Middleware personalizado:
    ```typescript
    app.use((req, res, next) => {
      const start = Date.now()
      res.on('finish', () => {
        const duration = Date.now() - start
        logger.info(`${req.method} ${req.path} - ${duration}ms`)
        // Enviar a Sentry/Prometheus
      })
      next()
    })
    ```

**A (Achievable - Alcanzable):**
- **Metas:**
  - P50: <200ms
  - P95: <500ms
  - P99: <1000ms
- **Baseline:** Mediciones actuales del proyecto:
  - P50: 145ms ✅
  - P95: 380ms ✅
  - P99: 720ms ✅
- **Justificación:**
  - Queries simples con índices: <50ms
  - Queries con JOINs: <200ms
  - Network latency Chile-USA: 150-200ms
  - Total razonable: 200-500ms

**R (Relevant - Relevante):**
- **Impacto en UX:**
  - Response time <200ms: Percibido como instantáneo
  - Response time 200-1000ms: Perceptible pero aceptable
  - Response time >1000ms: Frustrante para el usuario
- **Afecta:**
  - Productividad de operadores en campo
  - Adopción del sistema
  - Satisfacción del usuario
- **Correlación con otros KPIs:**
  - API lenta → Menor tasa de completitud
  - API lenta → Más errores por timeout

**T (Time-bound - Temporal):**
- **Medición:** Continua (real-time monitoring)
- **Revisión:** Diaria (dashboard Sentry)
- **Alertas:**
  - Si P95 > 1000ms por 5 minutos → Alert crítica
  - Si P99 > 2000ms → Alert de degradación
- **Reporte:** Semanal con tendencias

**Implementación:**
- Dashboard: Gráfico de línea (Recharts) con P50, P95, P99
- Endpoint: `GET /api/dashboard/performance-metrics`
- Visualización: Código de colores (verde <500ms, amarillo 500-1000ms, rojo >1000ms)

---

#### KPI 3: Disponibilidad del Sistema (Uptime)

**S (Specific - Específico):**
Medir el porcentaje de tiempo que el sistema Collector Enterprise está disponible y operativo, incluyendo frontend, backend y base de datos.

**M (Measurable - Medible):**
- **Fórmula:** `(Tiempo Disponible / Tiempo Total) × 100`
- **Unidad:** Porcentaje (%)
- **Cálculo Mensual:**
  ```
  Tiempo Total (mes 30 días) = 30 × 24 × 60 = 43,200 minutos
  Downtime Permitido (99.9%) = 43.2 minutos/mes
  Uptime Requerido = 43,156.8 minutos/mes
  ```
- **Fuente de Datos:**
  - Health checks de Railway (backend)
  - Health checks de Vercel (frontend)
  - Monitoring externo (UptimeRobot - futuro)
  - Endpoint: `GET /health`
    ```json
    {
      "status": "healthy",
      "timestamp": "2024-11-18T10:30:00Z",
      "services": {
        "database": "healthy",
        "firebase": "healthy",
        "ai": "healthy"
      }
    }
    ```

**A (Achievable - Alcanzable):**
- **Meta:** 99.9% de disponibilidad mensual
- **Equivale a:**
  - Downtime máximo: 43.2 minutos/mes
  - O: 10.1 horas/año
- **Baseline:** Últimos 30 días: 99.94% ✅
- **Justificación:**
  - Railway SLA: 99.9%
  - Vercel SLA: 99.99%
  - Firebase SLA: 99.95%
  - Meta conservadora basada en proveedores

**R (Relevant - Relevante):**
- **Criticidad:** Alta
  - Operadores en campo necesitan acceso 24/7
  - Downtime en horario laboral = pérdida de productividad
  - Datos en obras no se pueden registrar si sistema está caído
- **Impacto Económico:**
  - 1 hora de downtime = ~50 trabajadores sin registrar datos
  - Pérdida estimada: $100.000-200.000 CLP/hora
- **Reputación:**
  - Sistema poco confiable → Baja adopción
  - Usuarios vuelven a papel si sistema falla frecuentemente

**T (Time-bound - Temporal):**
- **Medición:** Mensual
- **Revisión:** Diaria (monitoreo continuo)
- **Hitos:**
  - Mes 1-3: 99.5% (estabilización inicial)
  - Mes 4-6: 99.7%
  - Mes 7+: 99.9%
- **Alertas:**
  - Downtime detectado → Notificación inmediata (email, Slack)
  - Health check falla 3 veces consecutivas → Alert crítica

**Implementación:**
- Health Check Endpoint en Backend
- Monitoreo Railway/Vercel automático
- Dashboard: Card con uptime actual del mes
- Página de status pública (futuro): status.collector-amaranto.com

---

#### KPI 4: Número de Formularios Completados por Día/Semana

**S (Specific - Específico):**
Medir el volumen diario y semanal de formularios completados, reflejando el nivel de actividad y adopción del sistema.

**M (Measurable - Medible):**
- **Fórmula:** `COUNT(FormResponse WHERE submittedAt BETWEEN startDate AND endDate)`
- **Unidad:** Cantidad (número entero)
- **Granularidad:**
  - Diaria: Formularios completados cada día
  - Semanal: Suma de 7 días
- **Fuente de Datos:**
  - Tabla: `FormResponse`
  - Query:
    ```sql
    SELECT 
      DATE(submittedAt) as fecha,
      COUNT(*) as formularios_completados
    FROM FormResponse
    WHERE submittedAt >= '2024-11-01'
    GROUP BY DATE(submittedAt)
    ORDER BY fecha DESC
    ```

**A (Achievable - Alcanzable):**
- **Metas:**
  - **Diaria:** 50-100 formularios (según tamaño de obra)
  - **Semanal:** 350-700 formularios
  - **Mensual:** 1,500-3,000 formularios
- **Baseline:** No existe (proceso manual sin medición precisa)
- **Cálculo Estimado:**
  - 50 trabajadores activos
  - 2-3 formularios/día por trabajador
  - 100-150 formularios/día en obra
- **Variabilidad:**
  - Días laborales > Fines de semana
  - Inicio de obra > Fin de obra

**R (Relevant - Relevante):**
- **Indicador de Adopción:**
  - Volumen alto = Sistema siendo usado activamente
  - Volumen bajo = Posible problema de adopción
- **Permite Identificar:**
  - Días/períodos de baja actividad
  - Tendencias estacionales
  - Impacto de capacitaciones
- **Correlación:**
  - Con tasa de completitud (KPI 1)
  - Con productividad operacional

**T (Time-bound - Temporal):**
- **Medición:** Diaria y semanal
- **Revisión:** Diaria en dashboard
- **Comparaciones:**
  - Día actual vs día anterior
  - Semana actual vs semana anterior
  - Mes actual vs mes anterior
- **Hitos:**
  - Semana 1: 50-100 formularios (onboarding)
  - Mes 1: 500-800 formularios
  - Mes 3: 1,500-2,000 formularios (adopción plena)

**Implementación:**
- Dashboard: Gráfico de línea temporal (últimos 30 días)
- Cards con comparativas (hoy vs ayer, esta semana vs anterior)
- Exportable en reportes Excel

---

#### KPI 5: Tasa de Error de la Aplicación

**S (Specific - Específico):**
Medir el porcentaje de requests HTTP que resultan en errores (4xx client errors, 5xx server errors), reflejando la estabilidad y calidad del sistema.

**M (Measurable - Medible):**
- **Fórmula:** `(Requests con Error / Total Requests) × 100`
- **Categorías:**
  - **4xx Errors:** Errores del cliente (400 Bad Request, 401 Unauthorized, 404 Not Found)
  - **5xx Errors:** Errores del servidor (500 Internal Server Error, 503 Service Unavailable)
- **Unidad:** Porcentaje (%)
- **Fuente de Datos:**
  - Logs de Express (middleware)
  - Sentry Error Tracking
  - Query:
    ```sql
    -- Desde tabla de logs (si implementado)
    SELECT 
      COUNT(CASE WHEN status_code >= 400 THEN 1 END) as errores,
      COUNT(*) as total_requests,
      (COUNT(CASE WHEN status_code >= 400 THEN 1 END)::float / COUNT(*)) * 100 as tasa_error
    FROM api_logs
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
    ```

**A (Achievable - Alcanzable):**
- **Meta:** <0.1% de tasa de error total
- **Desglose:**
  - 4xx Errors: <0.5% (errores de validación esperados)
  - 5xx Errors: <0.01% (errores críticos)
- **Baseline:** Proyecto actual:
  - Tasa de error general: ~0.05% ✅
  - 5xx Errors: <0.01% ✅
- **Justificación:**
  - Sistemas empresariales: 0.1-1% típico
  - Con validación Zod: Mayoría de 4xx prevenibles
  - Con tests: 5xx minimizados

**R (Relevant - Relevante):**
- **Impacto en Calidad:**
  - Tasa alta = Sistema inestable
  - Afecta confianza de usuarios
  - Puede causar pérdida de datos
- **Tipos de Impacto:**
  - **4xx (client errors):** UX pobre, validaciones faltantes
  - **5xx (server errors):** Bugs críticos, requiere fix urgente
- **Correlación:**
  - Con satisfacción de usuarios
  - Con tickets de soporte

**T (Time-bound - Temporal):**
- **Medición:** Continua (real-time)
- **Revisión:** Diaria
- **Alertas:**
  - Si tasa 5xx > 0.1% por 5 minutos → Alert crítica (PagerDuty)
  - Si tasa 4xx > 1% → Alert de degradación
- **Reporte:** Semanal con análisis de errores más frecuentes

**Implementación:**
- Sentry Dashboard: Errores agrupados por tipo
- Endpoint: `GET /api/dashboard/error-metrics`
- Visualización: Gráfico de línea + tabla de top 10 errores

---

#### KPI 6: Usuarios Activos Mensuales (MAU - Monthly Active Users)

**S (Specific - Específico):**
Medir el número de usuarios únicos que utilizan activamente el sistema Collector Enterprise durante un mes, reflejando el nivel de adopción real.

**M (Measurable - Medible):**
- **Fórmula:** `COUNT(DISTINCT userId WHERE lastActivity BETWEEN startOfMonth AND endOfMonth)`
- **Definición de "Activo":** Usuario que:
  - Inicia sesión al menos 1 vez en el mes, Y
  - Realiza al menos 1 acción (completar formulario, ver dashboard, etc.)
- **Unidad:** Cantidad (número entero)
- **Fuente de Datos:**
  - Tabla: `AuditLog`
  - Query:
    ```sql
    SELECT 
      COUNT(DISTINCT userId) as usuarios_activos,
      (SELECT COUNT(*) FROM User WHERE isActive = true) as usuarios_registrados,
      (COUNT(DISTINCT userId)::float / (SELECT COUNT(*) FROM User WHERE isActive = true)) * 100 as tasa_actividad
    FROM AuditLog
    WHERE createdAt >= '2024-11-01' AND createdAt < '2024-12-01'
    ```

**A (Achievable - Alcanzable):**
- **Meta:** 80% de usuarios registrados activos mensualmente
- **Baseline Estimado:**
  - Total usuarios registrados: 50-150 (Amaranto)
  - Usuarios activos esperados: 40-120
- **Crecimiento:**
  - Mes 1: 60% (adopción inicial)
  - Mes 3: 75%
  - Mes 6: 80%
  - Mes 12: 85%
- **Justificación:**
  - Herramientas empresariales: 60-80% MAU típico
  - Sistema obligatorio para operaciones → Mayor adopción

**R (Relevant - Relevante):**
- **Indicador de:**
  - Adopción real (no solo registro)
  - Engagement de usuarios
  - ROI del sistema (solo útil si se usa)
- **Permite Identificar:**
  - Usuarios inactivos (requieren re-capacitación)
  - Roles con baja adopción
  - Necesidad de mejoras en UX
- **Decisiones:**
  - Usuarios <50% activos → Investigar barreras
  - Rol específico con baja actividad → Capacitación focalizada

**T (Time-bound - Temporal):**
- **Medición:** Mensual
- **Revisión:** Semanal (early warning)
- **Comparaciones:**
  - Mes actual vs mes anterior
  - Por rol (Operadores, Supervisores, Managers)
- **Reporte:** Incluido en reporte mensual de usuarios

**Implementación:**
- Dashboard: Card con número MAU y porcentaje
- Gráfico: Línea temporal MAU últimos 12 meses
- Drill-down: Listado de usuarios inactivos para follow-up

---

#### KPI 7: Tiempo de Carga de la Aplicación (Frontend Performance)

**S (Specific - Específico):**
Medir los tiempos de carga de la aplicación web (PWA) en diferentes métricas de performance, reflejando la experiencia del usuario al acceder al sistema.

**M (Measurable - Medible):**
- **Métricas Core Web Vitals:**
  - **FCP (First Contentful Paint):** Tiempo hasta que aparece el primer contenido
  - **LCP (Largest Contentful Paint):** Tiempo hasta que el contenido principal está visible
  - **TTI (Time to Interactive):** Tiempo hasta que la página es completamente interactiva
  - **CLS (Cumulative Layout Shift):** Estabilidad visual (menor es mejor)
- **Unidad:** Segundos (s) para FCP, LCP, TTI; Score (0-1) para CLS
- **Fuente de Datos:**
  - Lighthouse CI (automated tests)
  - Web Vitals (real user monitoring)
  - Chrome DevTools Performance

**A (Achievable - Alcanzable):**
- **Metas:**
  - **FCP:** <1.5s (Good: <1.8s según Google)
  - **LCP:** <2.5s (Good: <2.5s según Google)
  - **TTI:** <3.0s (Good: <3.8s según Google)
  - **CLS:** <0.1 (Good: <0.1 según Google)
  - **Lighthouse Score:** >90/100
- **Baseline Actual:**
  - FCP: 1.2s ✅
  - TTI: 2.8s ✅
  - Lighthouse: 94/100 ✅
- **Justificación:**
  - Vite bundle optimizado: <300KB gzipped
  - CDN global: Latencia <50ms
  - Code splitting: Carga incremental

**R (Relevant - Relevante):**
- **Impacto en UX:**
  - App rápida = Mayor satisfacción
  - <3s carga = Tasa de abandono <5%
  - >5s carga = Tasa de abandono >50%
- **Afecta:**
  - Adopción en dispositivos móviles (3G/4G)
  - Productividad (menos espera)
  - SEO (si hay landing pública)
- **Especialmente Crítico:**
  - Operadores en campo con conexión limitada
  - Primera impresión de nuevos usuarios

**T (Time-bound - Temporal):**
- **Medición:** Mensual (auditoría Lighthouse)
- **Monitoreo:** Continuo (Web Vitals en producción)
- **Meta:** Mantener >90 Lighthouse Score permanentemente
- **Alertas:**
  - Si Lighthouse Score <85 → Investigar regresión
  - Si LCP >3.5s en producción → Optimizar

**Implementación:**
- Lighthouse CI en GitHub Actions (cada PR)
- Dashboard: Card con scores actuales
- Tendencia: Gráfico histórico de scores
- Desglose: Por página (landing, dashboard, forms)

---

### 4.2 Niveles de Servicio - SLAs (Criterio 2.1.3.10)

Los siguientes Service Level Agreements (SLA) definen los compromisos de disponibilidad, rendimiento y continuidad del sistema Collector Enterprise.

---

#### SLA 1: Disponibilidad del Sistema (Uptime)

**Nombre del Servicio:** Collector Enterprise - Plataforma Completa (Frontend + Backend + Base de Datos)

**Información de Autorización:**
- **Gestor del Nivel de Servicio:** Equipo de Desarrollo - Collector Enterprise
  - Nombre: [Jefe de Proyecto]
  - Email: [email]
  - Teléfono: [teléfono]
- **Cliente:** Amaranto Constructora
  - Representante: [Gerente de Operaciones]
  - Email: [email]
  - Teléfono: [teléfono]
- **Fecha de Vigencia:** [Fecha de inicio de producción]
- **Lugar:** Santiago, Chile
- **Período de Revisión:** Trimestral

**Descripción/Resultado Deseado por el Cliente:**
El sistema Collector Enterprise debe estar disponible 24 horas al día, 7 días a la semana, permitiendo a los operadores completar formularios en campo, a los supervisores revisar respuestas en tiempo real, y a los administradores generar reportes sin interrupciones que afecten las operaciones diarias de la constructora.

**Procesos/Actividades de Negocio Soportados:**
1. **Completado de Formularios en Obras:**
   - Operadores registran inspecciones de seguridad
   - Captura de datos con geolocalización y fotos
   - Funcionamiento offline con sincronización posterior
2. **Revisión de Respuestas por Supervisores:**
   - Visualización en tiempo real de formularios completados
   - Aprobación o solicitud de correcciones
   - Notificaciones de nuevas respuestas
3. **Generación de Reportes para Toma de Decisiones:**
   - Reportes de completitud y rendimiento
   - Exportación a Excel
   - Dashboard con KPIs en tiempo real
4. **Gestión de Usuarios y Asignaciones:**
   - Creación y edición de usuarios
   - Asignación de formularios a equipos
   - Configuración de frecuencias
5. **Consulta de Dashboard y Métricas:**
   - Visualización de KPIs operacionales
   - Gráficos de tendencias
   - Drill-down en datos detallados

**Criticalidad del Servicio y de los Activos:**
- **Nivel de Criticidad:** ALTA
  - El sistema es crítico para la operación diaria
  - Downtime en horario laboral impacta directamente la productividad
  - No existen sistemas alternativos (no hay fallback a papel eficiente)

**Activos Esenciales para el Negocio:**
1. **Base de Datos PostgreSQL (Railway):**
   - Contiene: Formularios, respuestas, usuarios, asignaciones
   - Pérdida de datos: Impacto crítico (datos de obra irrecuperables)
   - RTO (Recovery Time Objective): <30 minutos
   - RPO (Recovery Point Objective): <1 hora

2. **API Backend (Railway):**
   - Procesa: Todas las operaciones de negocio
   - Sin API: Sistema completamente inoperable
   - Dependencias: PostgreSQL, Firebase Auth

3. **Frontend Web PWA (Vercel):**
   - Interfaz: Única forma de acceso al sistema
   - Sin frontend: Usuarios no pueden trabajar
   - Capacidad offline: Mitiga parcialmente (solo lectura)

4. **Firebase Authentication:**
   - Gestiona: Acceso seguro al sistema
   - Sin auth: Sistema no accesible
   - Backup: No manejado por nosotros (servicio de Google)

**Tiempo del Servicio:**
- **Horario de Disponibilidad:** 24/7/365 (24 horas, 7 días, todo el año)
- **Horario Crítico:** Lunes a Viernes 08:00-18:00 (horario laboral)
- **Período de Mantenimiento Programado:**
  - **Ventana:** Domingos 02:00-04:00 hora local (Chile Continental)
  - **Frecuencia:** Mensual (si es necesario)
  - **Notificación Previa:** 48 horas mínimo (email + notificación in-app)
  - **Duración Máxima:** 2 horas
  - **Actividades:** Actualizaciones mayores, migraciones de BD, optimizaciones
- **Mantenimiento de Emergencia:**
  - Según necesidad (vulnerabilidades críticas, bugs severos)
  - Notificación: Inmediata vía email + SMS (si es posible)
  - Objetivo: <30 minutos de downtime

**Requisitos/Metas de Nivel de Servicio:**

**A. Disponibilidad (Uptime):**
- **Meta de Disponibilidad:** **99.9% mensual**
- **Tiempo de Downtime Permitido:**
  - Mensual (30 días): **43.2 minutos/mes**
  - Anual: **8.76 horas/año**
- **Cálculo:**
  ```
  99.9% uptime = 0.999 × 43,200 minutos/mes = 43,156.8 minutos disponibles
  Downtime permitido = 43,200 - 43,156.8 = 43.2 minutos/mes
  ```
- **Exclusiones del Cálculo:**
  - Mantenimientos programados (ventana de domingos 02:00-04:00)
  - Downtime causado por proveedores terceros (Firebase, Railway, Vercel) si excede su SLA
  - Fuerza mayor (desastres naturales, ataques DDoS masivos)

**Condiciones de No Disponibilidad:**
El servicio se considera **NO DISPONIBLE** si ocurre alguna de las siguientes condiciones por más de 5 minutos consecutivos:

1. **Health Check Endpoint Falla:**
   - `GET /health` retorna status code ≠ 200
   - O no responde dentro de 5 segundos
   - Verificado desde múltiples ubicaciones geográficas

2. **Alta Tasa de Errores 5xx:**
   - Más del 5% de requests retornan error 5xx durante 5 minutos
   - Indica fallo crítico del backend

3. **Base de Datos No Responde:**
   - PostgreSQL no responde queries por más de 2 minutos
   - O connection pool agotado y requests en timeout

4. **Frontend No Carga Correctamente:**
   - Error de conexión al CDN de Vercel
   - O assets críticos (JS, CSS) no cargan
   - Verificado desde Chile (ubicación del cliente)

5. **Autenticación Falla:**
   - Firebase Authentication no responde
   - Usuarios no pueden iniciar sesión

**B. Capacidad y Desempeño:**

**Tiempo de Respuesta de Aplicaciones:**
- **P50 (Mediana):** <200ms
  - 50% de requests deben responder en menos de 200ms
- **P95 (Percentil 95):** <500ms
  - 95% de requests deben responder en menos de 500ms
- **P99 (Percentil 99):** <1000ms
  - 99% de requests deben responder en menos de 1000ms

**Tiempo de Carga Frontend:**
- **First Contentful Paint:** <1.5 segundos
- **Time to Interactive:** <3.0 segundos
- Medido desde ubicación en Chile con conexión 4G

**Throughput (Capacidad de Procesamiento):**
- **Requests por Segundo:** >1000 req/s (picos)
- **Requests Concurrentes:** Soporte para 200 usuarios simultáneos
- **Formularios por Día:** Soporte para 5,000+ formularios completados

**Concurrencia de Usuarios:**
- **Usuarios Simultáneos:** 200 usuarios (activos concurrentemente)
- **Usuarios Registrados:** Soporte para 500+ usuarios totales

**C. Compromisos de Continuidad del Servicio:**

**RTO (Recovery Time Objective) - Tiempo de Restablecimiento:**
- **Meta:** <15 minutos para servicios críticos
- **Desglose:**
  - Backend API: <10 minutos
  - Base de Datos: <30 minutos (si requiere restauración desde backup)
  - Frontend: <5 minutos (auto-deploy desde Vercel)

**RPO (Recovery Point Objective) - Punto de Recuperación:**
- **Meta:** <1 hora
- **Significa:** En caso de desastre, se pueden perder máximo 1 hora de datos
- **Mitigación:**
  - Backups automáticos diarios de PostgreSQL
  - Transaction logs para point-in-time recovery
  - Respuestas en caché local (PWA offline) antes de sincronizar

**Procedimientos de Restauración:**

1. **Detección Automática de Fallos:**
   - Health checks cada 30 segundos (Railway/Vercel)
   - Alertas automáticas vía email + Slack
   - Notificación al equipo técnico <2 minutos

2. **Escalación Automática (si es necesario):**
   - Railway auto-scaling horizontal
   - Si instance falla → Nueva instance automática
   - Load balancer redirige tráfico

3. **Intervención Manual (si auto-recovery falla):**
   - Equipo técnico notificado vía PagerDuty (futuro)
   - Diagnóstico: Revisar logs (Sentry, Railway)
   - Fix y deploy: <15 minutos

4. **Restauración desde Backups (escenario extremo):**
   - Identificar último backup válido
   - Restaurar PostgreSQL desde snapshot de Railway
   - Verificar integridad de datos
   - Validar funcionalidad completa
   - Comunicar pérdida de datos (si aplica) al cliente

5. **Verificación Post-Restauración:**
   - Smoke tests automatizados
   - Verificación manual de funcionalidades críticas
   - Monitoreo intensivo por 2 horas

**D. Monitoreo y Reporting:**

**Monitoreo Continuo:**
- Health checks automatizados cada 30 segundos
- Logs centralizados (Sentry, Railway)
- Dashboard de métricas en tiempo real

**Reportes de Disponibilidad:**
- **Frecuencia:** Mensual
- **Contenido:**
  - Uptime alcanzado vs meta
  - Detalles de incidentes (si hubo)
  - Tiempo de resolución
  - Acciones correctivas tomadas
- **Distribución:** Email a stakeholders de Amaranto

**Revisión de SLA:**
- **Frecuencia:** Trimestral
- **Participantes:** Equipo técnico + representante de Amaranto
- **Agenda:** Revisar cumplimiento, ajustar metas si es necesario

---

#### SLA 2: Rendimiento de Base de Datos

**Nombre del Servicio:** Base de Datos PostgreSQL - Collector Enterprise

**Información de Autorización:**
- **Gestor del SLA:** Equipo de Desarrollo - Collector Enterprise
- **Cliente:** Amaranto Constructora
- **Fecha de Vigencia:** [Fecha]
- **Lugar:** Santiago, Chile

**Descripción/Resultado Deseado:**
La base de datos PostgreSQL debe proporcionar acceso rápido, confiable y consistente a los datos de formularios, respuestas, usuarios y auditoría, garantizando que las consultas se ejecuten en tiempos aceptables y que los datos estén siempre disponibles e íntegros.

**Procesos/Actividades de Negocio Soportados:**
1. **Almacenamiento de Resp