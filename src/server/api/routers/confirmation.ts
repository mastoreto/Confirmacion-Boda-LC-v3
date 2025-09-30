/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@boda-lc/server/api/trpc";
import { env } from "@boda-lc/env";
import notion from "@boda-lc/lib/notion";

export const confirmationRouter = createTRPCRouter({
  confirmar: publicProcedure
    .input(
      z.object({
        nombre: z.string().min(1, "El nombre es obligatorio"),
        email: z.string().email("Email inválido"),
        asistentes: z.string().min(1, "Indica el número de asistentes"),
        telefono: z.string().optional(),
        mensaje: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { nombre, email, telefono } = input;

      const telefonoNumber = telefono
        ? Number((telefono || "").replace(/\D/g, ""))
        : undefined;

      const properties: Record<string, any> = {
        Nombre: {
          title: [
            {
              text: {
                content: nombre,
              },
            },
          ],
        },
        Email: {
          email: email,
        },
        "Confirmo asistencia": {
          checkbox: true,
        },
        ...(typeof telefonoNumber === "number" && !Number.isNaN(telefonoNumber)
          ? { Teléfono: { number: telefonoNumber } }
          : {}),
      };

      try {
        const page = await notion.pages.create({
          parent: { database_id: env.NOTION_DATABASE_ID },
          properties,
        });
        return page;
      } catch (err: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message as string,
        });
      }
    }),
});
