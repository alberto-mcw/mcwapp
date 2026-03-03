# MCW App + El Recetario Eterno — Documento de Diseño y Técnico

---

## 1. Visión General del Proyecto

Esta aplicación web contiene **dos productos** bajo el mismo codebase:

### 1.1 El Reto 2026 (MCW App)
Plataforma de gamificación para un concurso de cocina tipo MasterChef. Los usuarios ganan "energía" completando desafíos semanales, trivias diarias, subiendo vídeos y recibiendo likes/superlikes. Incluye ranking, galería de vídeos y panel de administración.

**URL pública:** https://mcwapp.lovable.app

### 1.2 El Recetario Eterno
Herramienta de digitalización de recetas manuscritas con IA. Permite subir recetas en múltiples formatos (foto, PDF, audio, vídeo, enlace, texto), las procesa con inteligencia artificial y genera recetas estructuradas con lista de la compra, versión saludable, alternativas de ingredientes y PDFs premium.

**Ruta:** `/recetario/*`

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | React + TypeScript | React 18.3, TS 5.8 |
| **Build** | Vite | 5.4 |
| **Estilos** | Tailwind CSS + CSS custom | 3.4 |
| **Componentes UI** | shadcn/ui (Radix primitives) | — |
| **Animaciones** | Framer Motion | 12.x |
| **Routing** | React Router DOM | 6.30 |
| **Estado servidor** | TanStack React Query | 5.x |
| **Backend** | Lovable Cloud (Supabase) | — |
| **IA** | Lovable AI Gateway (Gemini 2.5 Flash) | — |
| **Transcripción** | ElevenLabs Speech-to-Text | Scribe v2 |
| **Web Scraping** | Firecrawl API | v1 |
| **PDF** | jsPDF | 4.2 |
| **Native wrapper** | Capacitor (Android) | 8.x |
| **PWA** | vite-plugin-pwa | 1.2 |
| **Iconos** | Lucide React | 0.462 |
| **Tipografías** | Unbounded (display) + Onest (body) | — |

---

## 3. Arquitectura de la Aplicación

### 3.1 Estructura de Carpetas

```
src/
├── App.tsx                    # Router principal
├── main.tsx                   # Entry point
├── index.css                  # Design system (tokens, variables)
├── assets/                    # Imágenes y assets estáticos
├── components/
│   ├── ui/                    # shadcn/ui components (40+ componentes)
│   ├── app/                   # Mobile app layout components
│   ├── admin/                 # Panel de administración
│   ├── dashboard/             # Widgets del dashboard
│   ├── gallery/               # Galería de vídeos
│   └── recetario/             # Componentes del Recetario
├── hooks/                     # Custom hooks
├── integrations/supabase/     # Cliente y tipos auto-generados
├── lib/                       # Utilidades
├── pages/
│   ├── app/                   # Páginas mobile (/app/*)
│   └── recetario/             # Páginas del Recetario (/recetario/*)
public/
├── icons/                     # PWA icons
├── images/                    # Logos públicos
supabase/
├── config.toml                # Configuración de Edge Functions
├── functions/                 # 7 Edge Functions (Deno)
└── migrations/                # Migraciones SQL
```

### 3.2 Mapa de Rutas

#### Desktop (El Reto 2026)
| Ruta | Página | Auth |
|------|--------|------|
| `/` | Landing principal (Hero, Teaser, Registro) | No |
| `/auth` | Login/Registro | No |
| `/dashboard` | Panel del usuario | Sí |
| `/profile` | Perfil editable | Sí |
| `/ranking` | Ranking de energía | No |
| `/calendario` | Calendario de desafíos | No |
| `/videos` | Galería de vídeos | No |
| `/2025` | Vídeos temporada 2025 | No |
| `/admin` | Panel administración | Sí (admin) |
| `/bases` | Bases legales | No |
| `/contacto` | Contacto | No |
| `/descarga` | Descarga de app | No |
| `/install` | Instrucciones PWA | No |

#### Mobile (/app/*)
| Ruta | Página |
|------|--------|
| `/app` | Desafíos (home mobile) |
| `/app/calendario` | Calendario |
| `/app/galeria` | Galería de vídeos |
| `/app/perfil` | Perfil |
| `/app/auth` | Login mobile |
| `/app/ranking` | Ranking |

#### Recetario (/recetario/*)
| Ruta | Página | Auth |
|------|--------|------|
| `/recetario` | Landing emocional | No |
| `/recetario/captura` | Captura de email (lead) | No |
| `/recetario/subir` | Subir receta (6 formatos) | Lead/Auth |
| `/recetario/receta/:id` | Resultado de receta | Lead/Auth |
| `/recetario/biblioteca` | Biblioteca privada | Lead/Auth |
| `/recetario/explorar` | Explorar recetas públicas | No |
| `/recetario/que-cocino` | ¿Qué cocino hoy? | Lead/Auth |
| `/recetario/compartida/:token` | Receta compartida (pública) | No |

---

## 4. Sistema de Diseño

### 4.1 Paleta de Colores

#### Tokens principales (HSL)
```
--brand-orange:    21 100% 50%   (#FF5700)
--brand-black:     220 15% 8%
--brand-white:     0 0% 100%
--primary:         21 100% 50%   (= brand-orange)
```

#### Tokens del Recetario Eterno
```
--recetario-bg:            30 100% 97%    (#FFF8F0) — Crema cálido
--recetario-fg:            20 31% 16%     (#3D2B1F) — Marrón oscuro
--recetario-primary:       21 100% 50%    (#FF5700) — Naranja marca
--recetario-primary-hover: 21 100% 42%    (#D64900)
--recetario-muted:         25 19% 40%     (#6B5744) — Texto secundario
--recetario-surface:       30 37% 92%     (#F5E6D3) — Superficies
--recetario-border:        28 35% 84%     (#E8D5C4)
--recetario-healthy:       113 24% 41%    (#558250) — Verde saludable
```

#### Modo oscuro
Activado automáticamente en la versión mobile. Define sus propios tokens `--background`, `--card`, etc.

### 4.2 Tipografía

| Uso | Fuente | Peso | Tracking | Line-height |
|-----|--------|------|----------|-------------|
| Headings (h1-h6) | **Unbounded** | 400-900 | -0.01em | 1 |
| Body text | **Onest** | 400-700 | -0.01em | 1.15 |

### 4.3 Componentes Visuales Clave

- **Glass Card** (`.glass-card`): `backdrop-blur-md`, border sutil, `border-radius: 2rem`, hover con elevación
- **Modern Card** (`.modern-card`): Sólida, misma forma redondeada
- **Glow effects**: 3 niveles (`--glow-soft`, `--glow-medium`, `--glow-intense`) usando sombras HSL naranja
- **Botones pill**: `border-radius: 9999px` con gradiente primario
- **Badge pill**: Variantes `badge-primary` y `badge-muted`
- **Vichy pattern** (`.recetario-vichy-bg`): Patrón de cuadros crema/naranja para el Recetario
- **Animated glow blobs**: 4 blobs con animaciones CSS (`glow-drift-1` a `glow-drift-4`) para headers mobile

### 4.4 Animaciones

| Animación | Duración | Uso |
|-----------|----------|-----|
| `fadeUp` (Framer Motion) | 0.5s ease-out, staggered | Entrada de secciones |
| `pulse-fire` | 2s infinite | Elementos de energía |
| `glow` | 2s infinite | Bordes luminosos |
| `float` | 4s infinite | Elementos decorativos |
| `slide-up` | 0.5s | Entrada de contenido |
| `glow-drift-1..4` | 10-16s alternate | Blobs de fondo mobile |

### 4.5 Responsive & Mobile

- **Detección mobile**: Via `navigator.userAgent` (hook `useMobileRedirect`)
- **Redirect automático**: Desktop routes → `/app/*` en dispositivos móviles
- **Safe areas**: `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` para notch/home indicator
- **Bottom nav**: Adaptativa iOS (blur + transparencia) vs Android (Material indicators)
- **Dark mode forzado**: La versión mobile (`/app/*`) usa `useSystemTheme` para forzar dark mode

---

## 5. Base de Datos (Lovable Cloud / Supabase)

### 5.1 Esquema de Tablas

#### El Reto 2026
| Tabla | Propósito | RLS |
|-------|-----------|-----|
| `profiles` | Datos de usuario (nombre, avatar, energía, redes sociales) | Lectura pública, escritura propia |
| `user_roles` | Roles (admin/user) — Tabla separada por seguridad | Solo lectura propia |
| `challenges` | Desafíos semanales (título, fechas, tipo, reward) | Lectura pública si activos, admin CRUD |
| `challenge_submissions` | Vídeos enviados por usuarios | Lectura si aprobado o propio, admin ALL |
| `challenge_completions` | Registro de desafíos completados | Lectura/escritura propia |
| `daily_trivias` | Trivias diarias (pregunta, opciones, respuesta correcta) | Lectura si fecha <= hoy, admin ALL |
| `daily_trivias_public` | Vista pública sin `correct_answer` | Sin RLS (vista) |
| `trivia_completions` | Respuestas de usuarios a trivias | Lectura/escritura propia |
| `video_likes` | Likes en vídeos | Lectura/escritura propia, admin lectura |
| `super_likes` | SuperLikes de admin (+50 energía) | Admin ALL, lectura pública |
| `presentation_videos` | Vídeo de presentación del usuario | Lectura/escritura propia, admin ALL |
| `social_verifications` | Verificaciones de seguimiento en RRSS | Lectura/escritura propia |

#### El Recetario Eterno
| Tabla | Propósito | RLS |
|-------|-----------|-----|
| `recetario_leads` | Emails capturados (lead funnel) | Inserción pública, lectura pública |
| `recipes` | Recetas digitalizadas (datos estructurados, OCR, IA) | Inserción con lead/auth, lectura propia/compartida |
| `recipe_collections` | Colecciones de recetas del usuario | CRUD propio |
| `recipe_collection_items` | Items dentro de colecciones | CRUD vía colección |
| `recipe_interactions` | Tracking de acciones (vistas, descargas, etc.) | Inserción pública, lectura propia/admin |
| `recipe_shares` | Tokens de compartir recetas | Lectura pública, inserción auth |

### 5.2 Funciones de Base de Datos

| Función | Tipo | Propósito |
|---------|------|-----------|
| `handle_new_user()` | Trigger (auth.users INSERT) | Crea perfil automático |
| `handle_new_user_role()` | Trigger (auth.users INSERT) | Asigna rol 'user' |
| `has_role(_user_id, _role)` | SECURITY DEFINER | Verifica rol sin recursión RLS |
| `check_trivia_answer(p_trivia_id, p_selected_answer)` | SECURITY DEFINER | Valida respuesta de trivia |
| `increment_user_energy(p_user_id, p_amount)` | SECURITY DEFINER | Admin: otorga energía |
| `update_likes_count()` | Trigger (video_likes INSERT/DELETE) | Actualiza contador de likes |
| `award_energy_on_like()` | Trigger (video_likes INSERT) | +1 energía al dueño del vídeo |
| `award_superlike_energy()` | Trigger (super_likes INSERT) | +50 energía al dueño |
| `revoke_superlike_energy()` | Trigger (super_likes DELETE) | Revierte energía de superlike |
| `award_challenge_completion()` | Trigger (submissions UPDATE) | +100/50 energía al aprobar vídeo |
| `revoke_challenge_completion()` | Trigger (submissions UPDATE) | Revierte al desaprobar |
| `award_presentation_video_energy()` | Trigger (presentation_videos UPDATE) | +100 energía al aprobar presentación |
| `update_updated_at_column()` | Trigger genérico | Actualiza `updated_at` |

### 5.3 Storage Buckets

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | Sí | Fotos de perfil |
| `challenge-videos` | Sí | Vídeos de desafíos |
| `recipe-images` | Sí | Imágenes de recetas |

### 5.4 Modelo de Energía (Gamificación)

| Acción | Energía |
|--------|---------|
| Trivia diaria acertada (a tiempo) | +30 |
| Trivia diaria fallada (a tiempo) | +2 |
| Trivia diaria acertada (tardía) | +15 |
| Trivia diaria fallada (tardía) | +1 |
| Desafío semanal aprobado (a tiempo) | +100 |
| Desafío semanal aprobado (tardío) | +50 |
| Recibir like en vídeo | +1 |
| Recibir SuperLike | +50 |
| Vídeo de presentación aprobado | +100 |

---

## 6. Edge Functions (Backend Serverless)

### 6.1 `process-recipe`
**Función principal del Recetario.** Maneja 12+ acciones:

| Acción | Input | Output |
|--------|-------|--------|
| `full-process` | `imageUrl` | OCR + estructuración completa |
| `full-process-text` | `recipeText` | Estructuración desde texto |
| `full-process-audio` | `audioUrl` | Transcripción (ElevenLabs) → estructuración |
| `full-process-url` | `videoUrl` | Scraping (Firecrawl/oEmbed) → estructuración |
| `ocr` | `imageUrl` | Solo OCR |
| `structure` | `recipeId` | Solo estructuración |
| `healthy` | `recipeId` | Versión saludable |
| `alternatives` | `recipeId` | Alternativas de ingredientes |
| `shopping-list` | `recipeId` | Lista de la compra |
| `adjust-servings` | `recipeId, servings` | Ajuste de raciones |
| `generate-image` | `recipeId` | Imagen generada por IA |
| `generate-tags` | `recipeId` | Tags automáticos |
| `update-recipe` | `recipeId, recipeData` | Actualización manual |

**Modelo IA:** `google/gemini-2.5-flash` vía Lovable AI Gateway  
**Tool calling:** Usa function calling para forzar output JSON estructurado  
**Estrategia de scraping (URLs):** Firecrawl → oEmbed → fallback URL-only

### 6.2 `what-to-cook`
"¿Qué cocino hoy?" — Recibe ingredientes (texto o fotos de nevera), busca coincidencias en recetas del usuario y públicas, y sugiere recetas nuevas con IA.

### 6.3 `extract-recipe`
Extracción auxiliar de recetas desde diferentes fuentes.

### 6.4 `search-recipes`
Búsqueda de recetas con filtros.

### 6.5 `transcribe-video`
Transcripción de vídeos de desafíos usando ElevenLabs.

### 6.6 `generate-daily-challenge`
Generación automática de trivias/desafíos diarios.

### 6.7 `analyze-metrics`
Análisis de métricas de vídeos.

**Configuración:** Todas las funciones tienen `verify_jwt = false` (autenticación manejada internamente).

---

## 7. Servicios Externos (Secrets)

| Secret | Servicio | Uso |
|--------|----------|-----|
| `LOVABLE_API_KEY` | Lovable AI Gateway | Acceso a modelos de IA (Gemini) |
| `ELEVENLABS_API_KEY` | ElevenLabs | Transcripción audio → texto |
| `FIRECRAWL_API_KEY` | Firecrawl | Web scraping de URLs |
| `SUPABASE_URL` | Auto-configurado | URL del proyecto |
| `SUPABASE_ANON_KEY` | Auto-configurado | Clave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado | Clave de servicio (backend) |

---

## 8. Autenticación

- **Método:** Email + contraseña (Supabase Auth)
- **Confirmación de email:** Requerida (no auto-confirm)
- **Flujo de registro:** El formulario acepta nombre y avatar opcional
- **Trigger automático:** Al registrarse se crea `profiles` + `user_roles` (rol 'user')
- **Roles:** `admin` | `user` — almacenados en tabla separada `user_roles`
- **Verificación de rol:** Función `has_role()` (SECURITY DEFINER) para evitar recursión RLS

### Flujo del Recetario (Lead-based)
1. Usuario llega a `/recetario` (landing)
2. Click en CTA → `/recetario/captura` (captura email como lead)
3. Se crea registro en `recetario_leads`
4. Lead ID se almacena en `localStorage`
5. El lead puede subir/ver recetas sin cuenta Supabase Auth
6. Opcionalmente puede crear cuenta completa

---

## 9. Flujo de Procesamiento de Recetas

```
[Input: Foto/PDF/Audio/Vídeo/Enlace/Texto]
         │
         ▼
   Edge Function: process-recipe
         │
         ├─ Foto → Gemini Vision (OCR multimodal)
         ├─ Audio → ElevenLabs STT → Texto
         ├─ Enlace → Firecrawl/oEmbed scrape → Texto
         ├─ PDF/Texto → Directo
         │
         ▼
   Gemini 2.5 Flash (Tool Calling)
   → structure_recipe function
         │
         ▼
   Output JSON estructurado:
   {
     titulo, ingredientes[], pasos[],
     tiempo_estimado, dificultad, raciones,
     calorias_por_racion, historia_emocional,
     tipo_receta, estilo_regional, tags[]
   }
         │
         ▼
   Lista de la compra auto-generada
   (categorizada: verduras, carnes, lácteos, despensa, otros)
         │
         ▼
   UPDATE recipes SET status='completed', structured_data=...
```

### Post-procesamiento disponible:
- **Versión saludable** → IA genera alternativas más sanas
- **Alternativas de ingredientes** → Sustitutos por alergia/disponibilidad
- **Ajuste de raciones** → Recálculo proporcional de cantidades
- **Generación de imagen** → IA genera foto del plato
- **Generación de tags** → Clasificación automática (30+ tags posibles)
- **Exportación PDF** → jsPDF genera PDF premium descargable

---

## 10. Seguridad

### RLS (Row Level Security)
- **Todas las tablas** tienen RLS habilitado
- **Patrón común:** `auth.uid() = user_id` para datos propios
- **Admin:** Verificado via `has_role(auth.uid(), 'admin')` — función SECURITY DEFINER
- **Recetario leads:** Inserción pública (captación), lectura controlada
- **Recetas:** Visibilidad `private` | `shared` | `public`

### Protecciones
- Roles en tabla separada (no en profiles) → previene escalada de privilegios
- Funciones SECURITY DEFINER con `SET search_path = 'public'`
- Edge Functions con service_role_key solo en backend
- Claves privadas en Secrets (nunca en código cliente)
- No se modifica `auth`, `storage`, `realtime` schemas directamente

---

## 11. PWA & Native

### PWA
- Configurado via `vite-plugin-pwa`
- Iconos en `public/icons/` (192px, 512px)
- Service worker auto-generado

### Capacitor (Android)
- Configurado en `capacitor.config.ts`
- Wrapper nativo para distribución en Google Play
- Safe area handling para notch y home indicator

---

## 12. Hooks Personalizados

| Hook | Propósito |
|------|-----------|
| `useAuth` | Context de autenticación (user, session, signUp, signIn, signOut) |
| `useProfile` | Perfil del usuario actual + upload avatar |
| `useAdmin` | Verifica si el usuario tiene rol admin |
| `useChallenges` | CRUD de desafíos semanales |
| `useCollections` | Gestión de colecciones de recetas |
| `usePresentationVideo` | Estado del vídeo de presentación |
| `useMobileRedirect` | Redirect automático desktop → mobile |
| `useSystemTheme` | Fuerza dark mode en mobile |
| `useDeviceOS` | Detección iOS/Android |
| `useMobile` | Detección de viewport mobile |

---

## 13. Panel de Administración (`/admin`)

Accesible solo para usuarios con `role = 'admin'`. Funcionalidades:
- Gestión de desafíos semanales (crear, activar, desactivar)
- Revisión y aprobación de vídeos de desafíos
- Gestión de trivias diarias
- Revisión de vídeos de presentación
- Calendario de contenido
- Otorgar energía manual
- SuperLikes en vídeos

---

## 14. Métricas y Analytics

### Tracking de interacciones (Recetario)
Tabla `recipe_interactions` registra:
- Vistas de receta
- Descargas de PDF
- Generación de versión saludable
- Ajuste de raciones
- Compartir receta

### Tracking de compartidos
Tabla `recipe_shares` con:
- `share_token` único por receta
- Contador de clicks
- Nuevos usuarios generados via share

### Tracking de leads
Tabla `recetario_leads` con:
- UTM parameters (source, medium, campaign)
- Referidos (`referred_by`)
- Fuente (ManyChat, directo, etc.)
