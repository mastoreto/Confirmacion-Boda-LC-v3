Proyecto Next.js mínimo para Confirmación de Invitados (integración Notion)
--------------------------------------------------

Estructura:
  - pages/index.js      -> formulario frontend (Nombre y Apellido, Invitados, Teléfono, Mensaje)
  - pages/api/confirm.js -> API route que guarda la confirmación en Notion

Variables de entorno necesarias (en Vercel):
  - NOTION_TOKEN  -> Internal Integration Token de Notion
  - DATABASE_ID   -> ID de la base de datos de Notion

Notion: Asegurate que tu base de datos tenga las propiedades (nombres exactos):
  - "Nombre y Apellido" (Title)
  - "Invitados" (Number)
  - "Teléfono" (Rich text)
  - "Mensaje" (Rich text)
  - "Fecha" (Date)

Cómo usarlo:
  1. Descomprimí la carpeta.
  2. Subí a GitHub y conectá el repo a Vercel (Framework: Next.js).
  3. En Vercel → Settings → Environment Variables, agregá NOTION_TOKEN y DATABASE_ID.
  4. Deploy: la app estará en / y la API en /api/confirm
