"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@boda-lc/trpc/react";
import weddingConfig from "../lib/weddingConfig.json";

type DietKey = "ninguna" | "vegetariana" | "vegana" | "sin-gluten" | "alergia";

type Diets = Record<DietKey, boolean> & { alergiaDescripcion?: string };

type Companion = {
  id: number;
  name: string;
  diets: Diets;
};

export default function Home() {
  // Form core fields (required for mutation)
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Attendance and companions
  const [willAttend, setWillAttend] = useState<boolean>(true);
  const [hasCompanion, setHasCompanion] = useState<boolean>(false);
  const [companions, setCompanions] = useState<Companion[]>([]);

  // Diets
  const [mainGuestDiets, setMainGuestDiets] = useState<Diets>({
    ninguna: true,
    vegetariana: false,
    vegana: false,
    "sin-gluten": false,
    alergia: false,
    alergiaDescripcion: "",
  });

  // Countdown (15 days from now)
  const [deadline] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d;
  });
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeRemaining = useMemo(() => Math.max(0, deadline.getTime() - now.getTime()), [deadline, now]);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  const countdownFinished = timeRemaining <= 0;

  // UI state
  const [successDetails, setSuccessDetails] = useState<string>("");
  const [showEventInfo, setShowEventInfo] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const { mutateAsync: confirmarMutation, isPending } = api.wedding.confirmar.useMutation({
    onSuccess: () => {
      // Reveal event info only on successful confirmation
      setShowEventInfo(true);
    },
  });

  const format2 = (v: number) => (v < 10 ? `0${v}` : String(v));

  const toggleMainDiet = (key: DietKey) => {
    setMainGuestDiets((prev) => {
      const next = { ...prev };
      if (key === "ninguna") {
        next.ninguna = !prev.ninguna;
        if (next.ninguna) {
          next.vegetariana = false;
          next.vegana = false;
          next["sin-gluten"] = false;
          next.alergia = false;
          next.alergiaDescripcion = "";
        }
      } else {
        // Selecting any other disables "ninguna"
        next[key] = !prev[key];
        if (next[key]) next.ninguna = false;
        if (key !== "alergia") {
          // nothing extra
        } else if (!next.alergia) {
          next.alergiaDescripcion = "";
        }
      }
      return next;
    });
  };

  const updateMainAllergyDesc = (v: string) =>
    setMainGuestDiets((prev) => ({ ...prev, alergiaDescripcion: v }));

  const addCompanion = () => {
    setCompanions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name: "",
        diets: {
          ninguna: true,
          vegetariana: false,
          vegana: false,
          "sin-gluten": false,
          alergia: false,
          alergiaDescripcion: "",
        },
      },
    ]);
  };

  const removeCompanion = (id: number) => {
    setCompanions((prev) => prev.filter((c) => c.id !== id).map((c, idx) => ({ ...c, id: idx + 1 })));
  };

  const updateCompanionName = (id: number, name: string) => {
    setCompanions((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const toggleCompanionDiet = (id: number, key: DietKey) => {
    setCompanions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const diets = { ...c.diets } as Diets;
        if (key === "ninguna") {
          diets.ninguna = !diets.ninguna;
          if (diets.ninguna) {
            diets.vegetariana = false;
            diets.vegana = false;
            diets["sin-gluten"] = false;
            diets.alergia = false;
            diets.alergiaDescripcion = "";
          }
        } else {
          diets[key] = !diets[key];
          if (diets[key]) diets.ninguna = false;
          if (key === "alergia" && !diets.alergia) diets.alergiaDescripcion = "";
        }
        return { ...c, diets };
      })
    );
  };

  const updateCompanionAllergyDesc = (id: number, v: string) => {
    setCompanions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, diets: { ...c.diets, alergiaDescripcion: v } } : c))
    );
  };

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setTelefono("");
    setMensaje("");
    setWillAttend(true);
    setHasCompanion(false);
    setCompanions([]);
    setMainGuestDiets({
      ninguna: true,
      vegetariana: false,
      vegana: false,
      "sin-gluten": false,
      alergia: false,
      alergiaDescripcion: "",
    });
  };

  const computeAsistentes = () => {
    if (!willAttend) return 0;
    // main guest + companions who have a name
    const validCompanions = companions.filter((c) => c.name.trim() !== "").length;
    return 1 + validCompanions;
  };

  const dietsToText = (d: Diets) => {
    const out: string[] = [];
    if (d.alergia && d.alergiaDescripcion?.trim()) out.push(`Alergia: ${d.alergiaDescripcion.trim()}`);
    if (d.vegetariana) out.push("Vegetariana");
    if (d.vegana) out.push("Vegana");
    if (d["sin-gluten"]) out.push("Sin gluten");
    if (out.length === 0) out.push("Ninguna");
    return out;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessDetails("");

    if (countdownFinished) {
      setErrorMsg("El período de confirmación ha finalizado. Contacta con los novios.");
      return;
    }

    // If attending and indicates hasCompanion, ensure at least one companion is added
    if (willAttend && hasCompanion && companions.length === 0) {
      setErrorMsg("Por favor, añade la información de tu acompañante.");
      return;
    }

    try {
      const asistentes = String(computeAsistentes());
      await confirmarMutation({
        nombre,
        email,
        asistentes,
        telefono: telefono || undefined,
        mensaje: mensaje || undefined,
      });

      // Build success details and reveal event info
      let details = "";
      if (willAttend) {
        const main = dietsToText(mainGuestDiets).join(", ");
        details += `Hemos registrado que sí asistirás a nuestra boda.\n`;
        details += `Preferencias alimentarias para ti: ${main}.\n`;
        if (hasCompanion && companions.length > 0) {
          const comp = companions
            .filter((c) => c.name.trim())
            .map((c) => `- ${c.name}: ${dietsToText(c.diets).join(", ")}`)
            .join("\n");
          if (comp) details += `Acompañantes:\n${comp}\n`;
        }
        details += `La información del evento se muestra a continuación.`;
      } else {
        details += `Hemos registrado que no podrás asistir a nuestra boda.\n`;
        details += `Lamentamos mucho tu ausencia y te agradecemos por avisarnos.`;
      }
      setSuccessDetails(details);

      // Reset interactive fields (keep email for convenience?) -> reset all
      resetForm();
    } catch (error) {
      console.error("Error al enviar la confirmación:", error);
      setErrorMsg("Hubo un error al enviar tu confirmación. Inténtalo de nuevo más tarde.");
    }
  };

  // Event info (could be moved to config later)
  const EVENT = {
    location: "Hacienda Santa María",
    date: "15 de Junio, 2024",
    time: "17:00 horas",
    address: "Camino a la Esperanza #123, Valle de Paz",
    mapUrl:
      "https://www.google.com/maps/place/Hacienda+Santa+Mar%C3%ADa/@19.4326077,-99.133205,17z/data=!3m1!4b1!4m6!3m5!1s0x85d1ff3a2c5b4f3f:0x6d8f3e8a3e3e3e3e!8m2!3d19.4326077!4d-99.133205!16s%2Fg%2F11b8z8z8z8?entry=ttu",
  } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-center text-gray-900 leading-tight">
          Confirmación de Asistencia
          <br /> Boda {weddingConfig.novios}
        </h1>

        {/* Countdown */}
        <div className="mt-6 border border-rose-100 rounded-xl p-4 sm:p-6 bg-rose-50/50" aria-live="polite">
          <div className="text-center text-gray-700 mb-3 font-medium">Límite de confirmación:</div>
          {countdownFinished ? (
            <div className="text-center text-rose-700 font-semibold">¡El período de confirmación ha finalizado!</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{format2(days)}</span>
                <span className="text-xs text-gray-600">días</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{format2(hours)}</span>
                <span className="text-xs text-gray-600">horas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{format2(minutes)}</span>
                <span className="text-xs text-gray-600">minutos</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{format2(seconds)}</span>
                <span className="text-xs text-gray-600">segundos</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Nombre */}
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
            />
          </div>

          {/* Email - requerido por la mutación */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
              placeholder="tu@email.com"
            />
          </div>

          {/* Asistencia */}
          <div className="grid gap-2">
            <div className="text-sm font-medium text-gray-700">¿Asistirás a la ceremonia?</div>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-gray-800">
                <input
                  type="radio"
                  name="attendance"
                  value="yes"
                  checked={willAttend}
                  onChange={() => setWillAttend(true)}
                />
                Sí, asistiré
              </label>
              <label className="inline-flex items-center gap-2 text-gray-800">
                <input
                  type="radio"
                  name="attendance"
                  value="no"
                  checked={!willAttend}
                  onChange={() => {
                    setWillAttend(false);
                    setHasCompanion(false);
                    setCompanions([]);
                  }}
                />
                No, no podré asistir
              </label>
            </div>
          </div>

          {/* Sección condicional si asiste */}
          {willAttend && (
            <div className="space-y-6">
              {/* ¿Con acompañante? */}
              <div className="grid gap-2">
                <div className="text-sm font-medium text-gray-700">¿Vendrás con acompañante?</div>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 text-gray-800">
                    <input
                      type="radio"
                      name="hasCompanion"
                      value="no"
                      checked={!hasCompanion}
                      onChange={() => {
                        setHasCompanion(false);
                        setCompanions([]);
                      }}
                    />
                    No
                  </label>
                  <label className="inline-flex items-center gap-2 text-gray-800">
                    <input
                      type="radio"
                      name="hasCompanion"
                      value="yes"
                      checked={hasCompanion}
                      onChange={() => {
                        setHasCompanion(true);
                        if (companions.length === 0) addCompanion();
                      }}
                    />
                    Sí
                  </label>
                </div>
              </div>

              {/* Lista de acompañantes */}
              {hasCompanion && (
                <div className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Información de acompañantes</h3>
                    <button
                      type="button"
                      onClick={addCompanion}
                      className="text-sm rounded-md bg-rose-600 text-white px-3 py-1 hover:bg-rose-700"
                    >
                      Añadir acompañante
                    </button>
                  </div>
                  <div className="space-y-6">
                    {companions.map((c) => (
                      <div key={c.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-gray-800">Acompañante {c.id}</div>
                          <button
                            type="button"
                            onClick={() => removeCompanion(c.id)}
                            className="rounded-md px-2.5 py-1 text-sm border border-gray-300 hover:bg-gray-50"
                            aria-label={`Eliminar acompañante ${c.id}`}
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid gap-2 mb-3">
                          <label htmlFor={`companion${c.id}Name`} className="text-sm font-medium text-gray-700">
                            Nombre completo
                          </label>
                          <input
                            id={`companion${c.id}Name`}
                            type="text"
                            value={c.name}
                            onChange={(e) => updateCompanionName(c.id, e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                          />
                        </div>

                        {/* Dietas del acompañante */}
                        <div className="mt-2">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">Preferencias alimentarias para este acompañante:</h4>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.diets.ninguna}
                                onChange={() => toggleCompanionDiet(c.id, "ninguna")}
                              />
                              Ninguna
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.diets.vegetariana}
                                onChange={() => toggleCompanionDiet(c.id, "vegetariana")}
                                disabled={c.diets.ninguna}
                              />
                              Vegetariana
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.diets.vegana}
                                onChange={() => toggleCompanionDiet(c.id, "vegana")}
                                disabled={c.diets.ninguna}
                              />
                              Vegana
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.diets["sin-gluten"]}
                                onChange={() => toggleCompanionDiet(c.id, "sin-gluten")}
                                disabled={c.diets.ninguna}
                              />
                              Sin gluten
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={c.diets.alergia}
                                onChange={() => toggleCompanionDiet(c.id, "alergia")}
                                disabled={c.diets.ninguna}
                              />
                              Alergia alimenticia
                            </label>
                          </div>
                          {c.diets.alergia && (
                            <div className="mt-2 grid gap-2">
                              <label htmlFor={`companion${c.id}Allergy`} className="text-sm text-gray-700">
                                Especifica la alergia:
                              </label>
                              <input
                                id={`companion${c.id}Allergy`}
                                type="text"
                                value={c.diets.alergiaDescripcion || ""}
                                onChange={(e) => updateCompanionAllergyDesc(c.id, e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                                placeholder="Ej: mariscos, frutos secos, etc."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietas del invitado principal */}
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Preferencias alimentarias para <span className="italic">{nombre.trim() || "ti"}</span>:
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mainGuestDiets.ninguna}
                      onChange={() => toggleMainDiet("ninguna")}
                    />
                    Ninguna
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mainGuestDiets.vegetariana}
                      onChange={() => toggleMainDiet("vegetariana")}
                      disabled={mainGuestDiets.ninguna}
                    />
                    Vegetariana
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mainGuestDiets.vegana}
                      onChange={() => toggleMainDiet("vegana")}
                      disabled={mainGuestDiets.ninguna}
                    />
                    Vegana
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mainGuestDiets["sin-gluten"]}
                      onChange={() => toggleMainDiet("sin-gluten")}
                      disabled={mainGuestDiets.ninguna}
                    />
                    Sin gluten
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={mainGuestDiets.alergia}
                      onChange={() => toggleMainDiet("alergia")}
                      disabled={mainGuestDiets.ninguna}
                    />
                    Alergia alimenticia
                  </label>
                </div>
                {mainGuestDiets.alergia && (
                  <div className="mt-2 grid gap-2">
                    <label htmlFor="mainGuestAllergy" className="text-sm text-gray-700">
                      Especifica tu alergia:
                    </label>
                    <input
                      id="mainGuestAllergy"
                      type="text"
                      value={mainGuestDiets.alergiaDescripcion || ""}
                      onChange={(e) => updateMainAllergyDesc(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                      placeholder="Ej: mariscos, frutos secos, etc."
                    />
                  </div>
                )}
              </div>

              {/* Mensaje opcional + Teléfono opcional */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Mensaje para los novios (opcional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                    placeholder="¡Déjanos un mensaje especial!"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="telefono" className="text-sm font-medium text-gray-700">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-rose-500 focus:border-rose-500"
                    placeholder="+34 123 456 789"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={countdownFinished || isPending}
              className="w-full flex justify-center py-3 px-4 rounded-md text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
            >
              {countdownFinished ? "Confirmación cerrada" : isPending ? "Enviando confirmación..." : "Confirmar"}
            </button>
          </div>

          {/* Loading/Success/Error */}
          {isPending && (
            <div className="mt-4 text-center text-sm text-gray-700">Enviando confirmación...</div>
          )}

          {successDetails && (
            <div className="mt-4 p-4 rounded-md border border-green-200 bg-green-50 text-green-800 whitespace-pre-line">
              <strong>¡Gracias por confirmar!</strong>
              <div className="mt-2">{successDetails}</div>
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
              <strong>Ha ocurrido un error</strong> al procesar tu confirmación. {errorMsg}
            </div>
          )}
        </form>

        {/* Event info */}
        {showEventInfo && (
          <div className="mt-8 rounded-xl border border-gray-200 p-5 bg-gray-50" id="eventInfo">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del evento</h3>
            <p className="text-gray-800"><strong>Lugar:</strong> <span>{EVENT.location}</span></p>
            <p className="text-gray-800"><strong>Fecha:</strong> <span>{EVENT.date}</span></p>
            <p className="text-gray-800"><strong>Hora:</strong> <span>{EVENT.time}</span></p>
            <p className="text-gray-800"><strong>Dirección:</strong> <span>{EVENT.address}</span></p>
            <p className="text-gray-800 mt-2">
              <strong>Ubicación:</strong>
              <br />
              <a href={EVENT.mapUrl} target="_blank" rel="noreferrer" className="text-rose-700 underline">Abrir en Google Maps</a>
            </p>
            <p className="text-gray-800 mt-2"><strong>Código de vestimenta:</strong> <span>Formal - Etiqueta</span></p>
            <div className="mt-3 text-center text-gray-700">¡Los esperamos con mucha ilusión!</div>
          </div>
        )}
      </div>
    </div>
  );
}
