import { useState } from "react";

export default function Home() {
  const [nombreApellido, setNombreApellido] = useState("");
  const [invitados, setInvitados] = useState(1);
  const [telefono, setTelefono] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreApellido, invitados, telefono, mensaje }),
      });

      if (res.ok) {
        setStatus("success");
        setNombreApellido("");
        setInvitados(1);
        setTelefono("");
        setMensaje("");
      } else {
        const data = await res.json().catch(()=>({message:"error"}));
        console.error("Error response:", data);
        setStatus("error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: 600, margin: "0 auto" }}>
      <h1>Confirmación de Invitados</h1>
      <form onSubmit={handleSubmit}>
        <label>Nombre y Apellido (obligatorio)</label><br/>
        <input
          type="text"
          placeholder="Tu nombre y apellido"
          value={nombreApellido}
          onChange={(e) => setNombreApellido(e.target.value)}
          required
          style={{width: "100%", padding: "8px", marginBottom: "10px"}}
        />
        <label>Cantidad de invitados (obligatorio)</label><br/>
        <input
          type="number"
          min="1"
          value={invitados}
          onChange={(e) => setInvitados(e.target.value)}
          required
          style={{width: "100%", padding: "8px", marginBottom: "10px"}}
        />
        <label>Teléfono (opcional)</label><br/>
        <input
          type="tel"
          placeholder="Ej: +598 9 123 4567"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          style={{width: "100%", padding: "8px", marginBottom: "10px"}}
        />
        <label>Mensaje para los novios (opcional)</label><br/>
        <textarea
          placeholder="Escribe un mensaje para los novios"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          style={{width: "100%", padding: "8px", marginBottom: "10px"}}
          rows={4}
        />
        <button type="submit" style={{padding: "10px 20px"}}>Confirmar</button>
      </form>

      {status === "loading" && <p>Enviando...</p>}
      {status === "success" && <p style={{color: "green"}}>✅ Gracias — confirmación enviada!</p>}
      {status === "error" && <p style={{color: "red"}}>❌ Ocurrió un error. Intentá nuevamente.</p>}
    </div>
  );
}
