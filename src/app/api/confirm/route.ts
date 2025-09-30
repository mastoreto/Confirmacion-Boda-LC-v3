import { NextResponse } from 'next/server';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, asistentes, telefono, mensaje } = body;

    // Validación básica
    if (!nombre || !email || !asistentes) {
      return NextResponse.json(
        { error: 'Nombre, email y asistentes son requeridos' },
        { status: 400 }
      );
    }

    // Enviar datos a Notion
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          'Nombre': {
            title: [
              {
                text: {
                  content: nombre
                }
              }
            ]
          },
          'Email': {
            rich_text: [
              {
                text: {
                  content: email
                }
              }
            ]
          },
          'Asistentes': {
            number: parseInt(asistentes)
          },
          'Telefono': {
            rich_text: [
              {
                text: {
                  content: telefono || 'No proporcionado'
                }
              }
            ]
          },
          'Mensaje': {
            rich_text: [
              {
                text: {
                  content: mensaje || 'Sin mensaje'
                }
              }
            ]
          },
          'Fecha Confirmación': {
            date: {
              start: new Date().toISOString().split('T')[0]
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Notion:', errorData);
      return NextResponse.json(
        { error: 'Error al guardar en Notion' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: '¡Confirmación guardada exitosamente!' 
    });

  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
