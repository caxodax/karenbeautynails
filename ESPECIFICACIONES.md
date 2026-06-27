# Documento de Especificaciones Técnicas y UX/UI
**Proyecto:** Karen Beauty Nails • Web, Catálogo y Reservas
**Fecha:** Junio 2026

---

## 1. Visión General del Proyecto
Desarrollo de una aplicación web progresiva (PWA / SPA) de alto rendimiento orientada estratégicamente a la conversión de citas para servicios de manicura y estética. La plataforma actúa como un embudo de conversión optimizado que unifica una vitrina digital premium (portafolio curado), un catálogo dinámico con actualización en tiempo real y un motor de agendamiento inteligente de autoservicio integrado con la API de Google Calendar.

### Métricas Clave de Rendimiento y UX (KPIs)
* **Tiempo de Interactividad (TTI):** Menor a 1.0 segundo bajo redes móviles 4G utilizando renderizado estático híbrido y pre-fetching nativo de SvelteKit.
* **Tasa de Abandono del Embudo:** Target menor al 12% mediante una arquitectura de reserva de tres clics sin fricción regulatoria ni inicios de sesión obligatorios para clientes.
* **Sensación Háptica/Nativa:** Integración fluida mediante la API de *View Transitions* para eliminar por completo el parpadeo blanco entre cambios de ruta.

---

## 2. Stack Tecnológico e Infraestructura (Costo Operativo $0)

| Tecnología | Rol Arquitectural | Impacto directo en la UX |
| :--- | :--- | :--- |
| **SvelteKit** | Framework principal (SPA/PWA) con Server Endpoints. | Elimina el Virtual DOM. Código ultraligero, responde instantáneamente a interacciones táctiles. |
| **Supabase (PostgreSQL)** | Base de datos en la nube y persistencia. | Carga inmediata de precios e información estructural sin retardos de consulta. |
| **Cloudflare R2** | Almacenamiento de objetos masivos (Fotos). | Las fotos cargan en milisegundos gracias a la CDN global. |
| **Google Calendar API** | Motor lógico transaccional de disponibilidad. | Evita la sobre-reserva reflejando huecos libres reales. |
| **Vercel (Edge Network)** | Infraestructura de despliegue. | Tiempo de respuesta de servidor mínimo en nodos perimetrales. |
| **Vercel Web Analytics** | Analítica ligera orientada a privacidad. | No impacta el rendimiento y permite medir con precisión la tasa de abandono del embudo. |

---

## 3. Arquitectura de Módulos y Optimización UX
El sistema se divide en dos entornos aislados lógicamente, diseñados bajo el principio de asimetría de interfaces.

### 3.1. Vista Pública (Experiencia Mobile-First)
Diseñada quirúrgicamente bajo un enfoque puramente móvil, adaptándose con precisión táctil a pantallas compactas.

* **Inicio (Landing Page):** Zona superior limpia con un encabezado fijo. La sección Hero presenta una propuesta de valor clara y un botón de Acción Principal (CTA) con un área interactiva mínima de 48x48px para mitigar errores de pulsación.
* **Catálogo Dinámico:** Tarjetas estructuradas sin saturación. Usamos *Skeleton Screens* para evitar el salto de diseño (Cumulative Layout Shift) mientras se obtienen los datos de Supabase.
* **Galería Fluida:** Implementación de carga diferida (Lazy Loading) combinada con compresión automatizada en el servidor a formato WebP. Las imágenes utilizan transiciones suaves de opacidad.
* **Prueba Social (Testimonios):** Módulo de comentarios estructurado. Los clientes pueden dejar reseñas post-servicio, pero estas requieren aprobación previa en el panel de administración para mantener la calidad y evitar spam, construyendo confianza de forma curada.

### 3.2. Estrategia de Descubrimiento (SEO y Social Sharing)
* **Open Graph y Meta-etiquetas:** SvelteKit renderiza tarjetas enriquecidas (imágenes, títulos, descripciones) para que al compartir el enlace en WhatsApp o Instagram, la previsualización luzca profesional y atractiva.
* **Local SEO:** Implementación de *Schema Markup* para negocios locales, facilitando que los motores de búsqueda entiendan la ubicación, horarios y servicios ofrecidos, atrayendo tráfico orgánico geolocalizado.

---

## 4. Sistema de Diseño y Fundamentos de Interfaz (UI/UX)
La interfaz adopta una estética visual verdaderamente premium, limpia y estructurada. El diseño actúa como un lienzo elegante que potencia el contenido visual sin competir con él. Optimizamos cada detalle visual para transmitir profesionalismo y confianza.

### 4.1. Definición Cromática del Sistema
Implementación de una paleta sofisticada y única:

* **Blanco Lienzo (`#FFFFFF`):** Fondo dominante del sitio. Aumenta la luminosidad percibida, garantizando un aspecto inmaculado y minimalista.
* **Gris Grafito (`#2A2C2E`):** Utilizado para el texto de lectura, títulos principales y textos informativos. Garantiza un contraste óptimo (WCAG AAA) y una lectura descansada.
* **Rosa Empolvado (Dusty Rose, `#b3666d`):** Color de acento estratégico. Se utiliza exclusivamente para botones activos de conversión (CTA), indicadores de éxito y micro-interacciones. Aporta calidez, exclusividad y un toque femenino y moderno.
* **Gris Claro Neutro (`#F3F4F6`):** Fondos alternos de secciones y contenedores de tarjetas para separar jerarquías sin saturar la vista.

### 4.2. Escala Tipográfica
Fuentes Sans-Serif geométricas con excelente legibilidad:
* **Títulos (H1, H2):** 16pt a 22pt, peso semi-bold, color Gris Grafito, interlineado controlado (`line-height: 1.2`).
* **Cuerpo de Texto:** 10.5pt, regular, color Gris Grafito con un interlineado amplio (`line-height: 1.5`) para facilitar el escaneo rápido.

### 4.3. Micro-interacciones y Animación Predictiva
* **Transición de Catálogo a Reserva:** Al pulsar "Agendar", la tarjeta se expande linealmente hacia la cabecera del formulario de reserva, guiando la vista sin perder contexto espacial (View Transitions).
* **Feedback Táctil Inmediato:** Todos los elementos accionables tienen un estado activo (`:active`) que reduce la escala a un 97%, simulando la resistencia mecánica de un botón físico.

---

## 5. El Flujo Lógico de Reserva Avanzado (Diseño Antifrustration)
Asistente de reserva lineal dividido en tres pasos claros basados en la divulgación progresiva (Progressive Disclosure).

1. **Confirmación de Selección:** Resumen flotante inferior que detalla el servicio y duración exacta.
2. **Interfaz del Calendario Inteligente:** Carrusel horizontal de días deslizable con el pulgar. Las horas disponibles se despliegan verticalmente.
    * *Lógica UX de Bloques de Tiempo:* El sistema calcula asíncronamente la ventana (Duración + 30 min). Las horas inviables se ocultan automáticamente para reducir la carga cognitiva.
3. **Formulario Optimizado:** Reducción a Nombre Completo y WhatsApp. Máscara de entrada predictiva para el teléfono.

---

## 6. Gestión de Casos de Borde (Resiliencia de UX)
* **Sin disponibilidad:** Se presenta un banner empático con un botón "Ver próximo día disponible", redirigiendo automáticamente al siguiente bloque libre.
* **Desconexión Intermitente:** Un *Toast* persistente avisa: "Conexión inestable. Conservamos tus datos seguros...". Los inputs se retienen en memoria mediante stores reactivos de SvelteKit.
* **Éxito de Reserva:** Animación de check vectorial suave en color verde. La dirección física se revela aquí, con botón nativo para copiar al portapapeles y enlace a Google Maps.

---

## 7. Panel de Administración UX-Móvil
La especialista gestiona su negocio en movimiento desde su teléfono (`/admin`).

* **Subida de Multimedia:** Interfaz *drag & drop* o pulsación para abrir la cámara. Procesamiento en segundo plano antes de impactar en Cloudflare R2.
* **Resumen Visual de Agenda:** Dashboard que condensa las próximas citas en una línea de tiempo limpia de alto contraste, con botón de acceso directo a WhatsApp para envíos de recordatorios con un solo toque.
* **Inteligencia de Clientes (Historial):** Uso del número de WhatsApp como identificador único. El sistema cruza datos automáticamente para mostrar si una cita entrante es de una "Clienta Frecuente" (mostrando su última visita) o si tiene un historial de inasistencias (No-shows).
* **Moderación de Testimonios:** Buzón de entrada simple para aprobar, rechazar o destacar los comentarios dejados por las clientas antes de que se hagan públicos en la vista principal.