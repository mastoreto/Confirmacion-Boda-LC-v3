import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const { nombreApellido, invitados, telefono, mensaje } = req.body;

  if (!nombreApellido || !invitados) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const page = await notion.pages.create({
      parent: { database_id: process.env.DATABASE_ID },
      properties: {
        "Nombre y Apellido": { title: [{ text: { content: String(nombreApellido) } }] },
        "Invitados": { number: parseInt(invitados) },
        "Teléfono": { rich_text: [{ text: { content: telefono ? String(telefono) : "" } }] },
        "Mensaje": { rich_text: [{ text: { content: mensaje ? String(mensaje) : "" } }] },
        "Fecha": { date: { start: new Date().toISOString() } }
      }
    });

    return res.status(200).json({ message: "Confirmación guardada", pageId: page.id });
  } catch (error) {
    console.error("Notion error:", error);
    return res.status(500).json({ message: "Error al guardar en Notion", error: String(error) });
  }
}
