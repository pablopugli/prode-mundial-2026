import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

function parseFechaPartido(fecha, hora) {
  const [dia, mes, anio] = fecha.split("/");
  const [hh, mm] = hora.split(":");
  return new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia), Number(hh) + 3, Number(mm)));
}

function estadoPartido(partido) {
  const ahora = new Date();
  const inicio = parseFechaPartido(partido.fecha, partido.hora);
  const diff = inicio - ahora;
  if (diff <= 0) return "cerrado";
  if (diff <= 15 * 60 * 1000) return "pronto";
  if (diff <= 60 * 60 * 1000) return "hoy";
  return "abierto";
}

function calcularPuntos(pick, partido) {
  if (!pick || partido.goles_local === null || partido.goles_local === undefined) return null;
  let puntos = 0;
  const resL = partido.goles_local, resV = partido.goles_visitante;
  const pkL = pick.goles_local, pkV = pick.goles_visitante;
  const res1x2 = resL > resV ? "L" : resL < resV ? "V" : "E";
  const pk1x2 = pkL > pkV ? "L" : pkL < pkV ? "V" : "E";
  if (pk1x2 === res1x2) puntos += 1;
  if (pkL === resL && pkV === resV) puntos += 2;
  if (partido.fase !== "Grupos" && pick.clasificado && partido.clasificado && pick.clasificado === partido.clasificado) puntos += 1;
  return puntos;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --verde: #00c46a; --verde-dark: #009e55; --rojo: #ff3b3b; --oro: #f5c518; --fondo: #0a0f0d; --fondo2: #111a15; --fondo3: #1a2820; --borde: #1e3028; --texto: #e8f5ee; --texto2: #7a9e8a; }
  body { background: var(--fondo); color: var(--texto); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .header { background: var(--fondo2); border-bottom: 1px solid var(--borde); padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 60px; position: sticky; top: 0; z-index: 100; }
  .header-logo { font-family: 'Bebas Neue', cursive; font-size: 26px; color: var(--verde); letter-spacing: 2px; }
  .header-logo span { color: var(--oro); }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .header-name { font-size: 14px; color: var(--texto2); }
  .btn-logout { background: none; border: 1px solid var(--borde); color: var(--texto2); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: 'DM Sans', sans-serif; }
  .nav { background: var(--fondo2); border-bottom: 1px solid var(--borde); display: flex; padding: 0 24px; gap: 4px; overflow-x: auto; }
  .nav-tab { background: none; border: none; color: var(--texto2); padding: 14px 18px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; white-space: nowrap; }
  .nav-tab.active { color: var(--verde); border-bottom-color: var(--verde); }
  .nav-tab-inner { display: flex; align-items: center; gap: 6px; }
  .nav-badge { background: var(--rojo); color: #fff; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px; line-height: 16px; }
  .main { flex: 1; padding: 32px 24px; max-width: 900px; margin: 0 auto; width: 100%; }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--fondo); padding: 24px; }
  .login-card { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 16px; padding: 48px 40px; width: 100%; max-width: 420px; }
  .login-title { font-family: 'Bebas Neue', cursive; font-size: 42px; color: var(--verde); letter-spacing: 3px; margin-bottom: 4px; }
  .login-title span { color: var(--oro); }
  .login-sub { color: var(--texto2); font-size: 14px; margin-bottom: 32px; }
  .login-tabs { display: flex; margin-bottom: 28px; border-bottom: 1px solid var(--borde); }
  .login-tab { background: none; border: none; color: var(--texto2); padding: 10px 20px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .login-tab.active { color: var(--verde); border-bottom-color: var(--verde); }
  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 12px; color: var(--texto2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { width: 100%; background: var(--fondo3); border: 1px solid var(--borde); border-radius: 8px; padding: 12px 14px; color: var(--texto); font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none; }
  .form-input:focus { border-color: var(--verde); }
  .btn-primary { width: 100%; background: var(--verde); color: #000; border: none; border-radius: 8px; padding: 14px; font-family: 'Bebas Neue', cursive; font-size: 18px; letter-spacing: 2px; cursor: pointer; margin-top: 8px; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .form-error { color: var(--rojo); font-size: 13px; margin-top: 12px; text-align: center; }
  .form-success { color: var(--verde); font-size: 13px; margin-top: 12px; text-align: center; }
  .section-title { font-family: 'Bebas Neue', cursive; font-size: 28px; color: var(--texto); letter-spacing: 2px; margin-bottom: 8px; }
  .section-sub { color: var(--texto2); font-size: 14px; margin-bottom: 28px; }
  .fase-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--texto2); margin-bottom: 12px; margin-top: 28px; padding-bottom: 8px; border-bottom: 1px solid var(--borde); }
  .partido-card { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
  .partido-card.con-pick { border-left: 3px solid var(--verde); }
  .partido-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 6px; }
  .partido-fecha { font-size: 12px; color: var(--texto2); }
  .partido-grupo { font-size: 11px; background: var(--fondo3); border: 1px solid var(--borde); padding: 3px 10px; border-radius: 20px; color: var(--texto2); }
  .partido-equipos { display: flex; align-items: center; gap: 16px; }
  .equipo-nombre { flex: 1; font-size: 17px; font-weight: 600; }
  .equipo-nombre.visitante { text-align: right; }
  .vs { color: var(--texto2); font-size: 13px; flex-shrink: 0; }
  .pick-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--borde); flex-wrap: wrap; }
  .pick-label { font-size: 12px; color: var(--texto2); flex: 1; min-width: 80px; }
  .score-inputs { display: flex; align-items: center; gap: 8px; }
  .score-input { width: 52px; background: var(--fondo3); border: 1px solid var(--borde); border-radius: 8px; padding: 10px; color: var(--texto); font-family: 'Bebas Neue', cursive; font-size: 22px; text-align: center; outline: none; }
  .score-input:focus { border-color: var(--verde); }
  .score-sep { color: var(--texto2); font-size: 20px; font-family: 'Bebas Neue', cursive; }
  .clasificado-row { margin-top: 12px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .clasificado-label { font-size: 12px; color: var(--texto2); }
  .clasificado-btns { display: flex; gap: 8px; }
  .clas-btn { background: var(--fondo3); border: 1px solid var(--borde); color: var(--texto2); padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: 'DM Sans', sans-serif; }
  .clas-btn.active { background: var(--verde); border-color: var(--verde); color: #000; font-weight: 600; }
  .puntos-badge { background: var(--verde); color: #000; font-family: 'Bebas Neue', cursive; font-size: 18px; padding: 4px 12px; border-radius: 6px; }
  .puntos-badge.cero { background: var(--fondo3); color: var(--texto2); }
  .btn-guardar { background: var(--verde); color: #000; border: none; border-radius: 8px; padding: 10px 24px; font-family: 'Bebas Neue', cursive; font-size: 16px; letter-spacing: 1px; cursor: pointer; }
  .btn-guardar:disabled { opacity: 0.5; cursor: not-allowed; }
  .save-confirm { font-size: 13px; color: var(--verde); }
  .tabla-wrap { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
  .podio-wrap { display: flex; justify-content: center; align-items: flex-end; gap: 12px; margin-bottom: 28px; }
  .podio-item { display: flex; flex-direction: column; align-items: center; animation: subirPodio 0.6s ease-out both; }
  .podio-item:nth-child(1) { animation-delay: 0.3s; }
  .podio-item:nth-child(2) { animation-delay: 0s; }
  .podio-item:nth-child(3) { animation-delay: 0.5s; }
  @keyframes subirPodio { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  .podio-nombre { font-size: 13px; font-weight: 600; margin-bottom: 6px; text-align: center; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .podio-pts { font-family: 'Bebas Neue', cursive; font-size: 20px; margin-bottom: 6px; }
  .podio-base { border-radius: 8px 8px 0 0; width: 80px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
  .tabla { width: 100%; border-collapse: collapse; }
  .tabla th { background: var(--fondo3); padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--texto2); font-weight: 600; }
  .tabla td { padding: 14px 16px; border-top: 1px solid var(--borde); font-size: 15px; }
  .pos-num { font-family: 'Bebas Neue', cursive; font-size: 20px; color: var(--texto2); }
  .pos-1 .pos-num { color: var(--oro); }
  .pos-2 .pos-num { color: #c0c0c0; }
  .pos-3 .pos-num { color: #cd7f32; }
  .pts-total { font-family: 'Bebas Neue', cursive; font-size: 22px; color: var(--verde); }
  .admin-card { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 12px; padding: 20px 24px; margin-bottom: 10px; }
  .admin-user-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .admin-user-nombre { font-size: 16px; font-weight: 500; }
  .admin-user-email { font-size: 13px; color: var(--texto2); margin-top: 2px; }
  .estado-badge { font-size: 11px; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
  .estado-aprobado { background: rgba(0,196,106,0.15); color: var(--verde); }
  .estado-pendiente { background: rgba(245,197,24,0.15); color: var(--oro); }
  .btn-aprobar { background: var(--verde); color: #000; border: none; border-radius: 6px; padding: 8px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-rechazar { background: none; color: var(--rojo); border: 1px solid var(--rojo); border-radius: 6px; padding: 8px 18px; font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; margin-left: 8px; }
  .resultado-inputs { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--borde); flex-wrap: wrap; }
  .resultado-input { width: 60px; background: var(--fondo3); border: 1px solid var(--borde); border-radius: 8px; padding: 10px; color: var(--texto); font-family: 'Bebas Neue', cursive; font-size: 22px; text-align: center; outline: none; }
  .resultado-cargado { font-family: 'Bebas Neue', cursive; font-size: 28px; color: var(--oro); letter-spacing: 2px; }
  .btn-cargar-res { background: var(--oro); color: #000; border: none; border-radius: 6px; padding: 10px 20px; font-family: 'Bebas Neue', cursive; font-size: 15px; letter-spacing: 1px; cursor: pointer; }
  .empty { text-align: center; padding: 60px 24px; color: var(--texto2); }
  .loading { text-align: center; padding: 60px 24px; color: var(--texto2); }
  .pendiente-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .pendiente-card { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 16px; padding: 48px 40px; text-align: center; max-width: 420px; }
  .pendiente-icon { font-size: 52px; margin-bottom: 20px; }
  .pendiente-title { font-family: 'Bebas Neue', cursive; font-size: 28px; color: var(--oro); letter-spacing: 2px; margin-bottom: 12px; }
  .pendiente-text { color: var(--texto2); font-size: 15px; line-height: 1.6; }
  .admin-btns { display: flex; align-items: center; gap: 8px; }
  .grupo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grupo-equipo { background: var(--fondo3); border: 1px solid var(--borde); border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 500; }
  .grupo-titulo { font-family: 'Bebas Neue', cursive; font-size: 20px; color: var(--verde); letter-spacing: 2px; margin-bottom: 12px; }
  .aviso-pronto { background: rgba(255,59,59,0.1); border: 1px solid var(--rojo); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: var(--rojo); margin-top: 10px; }
  .aviso-hoy { background: rgba(245,197,24,0.1); border: 1px solid var(--oro); border-radius: 8px; padding: 8px 12px; font-size: 12px; color: var(--oro); margin-top: 10px; }
  .pick-cerrado { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--borde); font-size: 12px; color: var(--texto2); }
  @media (max-width: 600px) { .main { padding: 24px 16px; } .login-card { padding: 36px 24px; } .equipo-nombre { font-size: 14px; } }
  .resumen-jornada { background: linear-gradient(135deg, #111a15 0%, #1a2820 100%); border: 1px solid var(--verde); border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; }
  .resumen-titulo { font-family: 'Bebas Neue', cursive; font-size: 22px; color: var(--verde); letter-spacing: 2px; margin-bottom: 4px; }
  .resumen-fecha { font-size: 12px; color: var(--texto2); margin-bottom: 16px; }
  .resumen-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 16px; }
  .resumen-stat { background: var(--fondo3); border-radius: 8px; padding: 10px 12px; text-align: center; }
  .resumen-stat-val { font-family: 'Bebas Neue', cursive; font-size: 24px; color: var(--verde); }
  .resumen-stat-label { font-size: 11px; color: var(--texto2); margin-top: 2px; }
  .resumen-podio { display: flex; flex-direction: column; gap: 6px; }
  .resumen-jugador { display: flex; align-items: center; gap: 10px; font-size: 13px; }
`;

function Login({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    const { data, error } = await supabase.from("usuarios").select("*").eq("email", email.trim()).eq("password", password).single();
    setLoading(false);
    if (error || !data) { setError("Email o contraseña incorrectos"); return; }
    onLogin(data);
  };

  const handleRegistro = async () => {
    setError(""); setSuccess("");
    if (!nombre || !email || !password || !telefono) { setError("Completá todos los campos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.from("usuarios").insert([{ nombre: nombre.trim(), email: email.trim(), password, telefono: telefono.trim(), aprobado: false, es_admin: false }]);
    setLoading(false);
    if (error) { setError(error.code === "23505" ? "Ya existe una cuenta con ese email" : "Error al registrarse"); return; }
    setSuccess("¡Registro exitoso! Tu cuenta está pendiente de aprobación.");
    setNombre(""); setEmail(""); setPassword(""); setTelefono("");
    setTimeout(() => { setTab("login"); setSuccess(""); }, 3000);
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">PRODE <span>MUNDIAL</span></div>
        <div className="login-sub">USA · CANADA · MEXICO 2026</div>
        <div className="login-tabs">
          <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Ingresar</button>
          <button className={`login-tab ${tab === "registro" ? "active" : ""}`} onClick={() => { setTab("registro"); setError(""); }}>Registrarse</button>
        </div>
        {tab === "login" ? (
          <>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
            <div className="form-group"><label className="form-label">Contraseña</label><input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" /></div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn-primary" onClick={handleLogin} disabled={loading}>{loading ? "INGRESANDO..." : "ENTRAR"}</button>
          </>
        ) : (
          <>
            <div className="form-group"><label className="form-label">Nombre completo</label><input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
            <div className="form-group"><label className="form-label">Teléfono / WhatsApp</label><input className="form-input" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: +54 9 11 1234-5678" /></div>
            <div className="form-group"><label className="form-label">Contraseña</label><input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <button className="btn-primary" onClick={handleRegistro} disabled={loading}>{loading ? "REGISTRANDO..." : "REGISTRARSE"}</button>
          </>
        )}
      </div>
    </div>
  );
}

function useContador(partido) {
  const [tiempo, setTiempo] = useState("");
  useEffect(() => {
    const tick = () => {
      const inicio = parseFechaPartido(partido.fecha, partido.hora);
      const diff = inicio - new Date();
      if (diff <= 0) { setTiempo(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTiempo(`${h}h ${m}m`);
      else if (m > 0) setTiempo(`${m}m ${s}s`);
      else setTiempo(`${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [partido]);
  return tiempo;
}

function PartidoCard({ partido, pick, onPickSaved, onPickDeleted, esAdmin, onResultadoCargado, onGrupoClick, allPicks, usuarios }) {
  const [gl, setGl] = useState(pick?.goles_local ?? "");
  const [gv, setGv] = useState(pick?.goles_visitante ?? "");
  const [clasificado, setClasificado] = useState(pick?.clasificado ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminGl, setAdminGl] = useState(partido.goles_local ?? "");
  const [adminGv, setAdminGv] = useState(partido.goles_visitante ?? "");
  const [adminClas, setAdminClas] = useState(partido.clasificado ?? null);
  const [editando, setEditando] = useState(false);
  const contador = useContador(partido);
  const tienePick = gl !== "" && gl !== null && gv !== "" && gv !== null;
  const tieneResultado = partido.goles_local !== null && partido.goles_local !== undefined;
  const esEliminatoria = partido.fase !== "Grupos";
  const hayEmpate = tienePick && Number(gl) === Number(gv);
  const pts = tieneResultado ? calcularPuntos(pick, partido) : null;

  const guardarPick = async () => {
    if (!tienePick) return;
    setSaving(true);
    await onPickSaved(partido.id, { goles_local: Number(gl), goles_visitante: Number(gv), clasificado });
    setSaving(false); setSaved(true);
  };

  const borrarPick = async () => {
    if (!onPickDeleted) return;
    setGl(""); setGv(""); setClasificado(null);
    await onPickDeleted(partido.id);
  };

  const cargarResultado = async () => {
    const glVal = document.getElementById(`rgl-${partido.id}`)?.value;
    const gvVal = document.getElementById(`rgv-${partido.id}`)?.value;
    if (glVal === "" || glVal === undefined || gvVal === "" || gvVal === undefined) return;
    await onResultadoCargado(partido.id, { goles_local: Number(glVal), goles_visitante: Number(gvVal), clasificado: adminClas });
    setEditando(false);
  };

  return (
    <div className={`partido-card ${tienePick ? "con-pick" : ""}`}>
      <div className="partido-meta">
        <span className="partido-fecha">{partido.fecha} · {partido.hora}{partido.canal ? ` · 📺 ${partido.canal}` : ''}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {contador && !esAdmin && <span style={{ fontSize: 11, color: "var(--texto2)", background: "var(--fondo3)", border: "1px solid var(--borde)", padding: "2px 8px", borderRadius: 20 }}>⏱ {contador}</span>}
          <span className="partido-grupo" style={partido.grupo ? { cursor: "pointer" } : {}} onClick={() => partido.grupo && onGrupoClick && onGrupoClick(partido.grupo)}>{partido.grupo ? `Grupo ${partido.grupo}` : partido.fase}</span>
        </div>
      </div>
      <div className="partido-equipos">
        <span className="equipo-nombre">{partido.local}</span>
        <span className="vs">VS</span>
        <span className="equipo-nombre visitante">{partido.visitante}</span>
      </div>
      {tieneResultado && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--texto2)" }}>Resultado:</span>
          <span className="resultado-cargado">{partido.goles_local} - {partido.goles_visitante}</span>
          {pts !== null && <span className={`puntos-badge ${pts === 0 ? "cero" : ""}`}>{pts} pts</span>}
        </div>
      )}
      {!esAdmin && (() => {
        const estado = estadoPartido(partido);
        if (estado === "cerrado") return (
          <div className="pick-cerrado">
            🔒 Pronósticos cerrados · {tienePick ? `Tu pick: ${gl} - ${gv}` : "No cargaste pronóstico"}
          </div>
        );
        return (
          <>
            {estado === "pronto" && <div className="aviso-pronto">⚠️ ¡Cierra en menos de 15 minutos!</div>}
            {estado === "hoy" && <div className="aviso-hoy">⏰ El partido empieza en menos de 1 hora</div>}
            <div className="pick-row">
              <span className="pick-label">Tu pronóstico</span>
              <div className="score-inputs">
                <input className="score-input" type="number" min="0" max="20" value={gl} onChange={e => setGl(e.target.value)} placeholder="0" />
                <span className="score-sep">-</span>
                <input className="score-input" type="number" min="0" max="20" value={gv} onChange={e => setGv(e.target.value)} placeholder="0" />
              </div>
              <button className="btn-guardar" onClick={guardarPick} disabled={saving}>{saving ? "..." : "GUARDAR"}</button>
              {pick && pick.id && !saved && (
                <button onClick={borrarPick} style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>🗑 Borrar</button>
              )}
              {saved && <span className="save-confirm">✓ Guardado</span>}
            </div>
            {(gl === "" || gv === "") && (gl !== "" || gv !== "") && (
              <div style={{ fontSize: 12, color: "var(--oro)", marginTop: 8 }}>⚠️ Falta completar algún marcador</div>
            )}
          </>
        );
      })()}
      {!esAdmin && esEliminatoria && hayEmpate && (
        <div className="clasificado-row">
          <span className="clasificado-label">¿Quién clasifica?</span>
          <div className="clasificado-btns">
            <button className={`clas-btn ${clasificado === partido.local ? "active" : ""}`} onClick={() => setClasificado(partido.local)}>{partido.local}</button>
            <button className={`clas-btn ${clasificado === partido.visitante ? "active" : ""}`} onClick={() => setClasificado(partido.visitante)}>{partido.visitante}</button>
          </div>
        </div>
      )}
      {!esAdmin && estadoPartido(partido) === "cerrado" && allPicks && usuarios && (() => {
        const picksPartido = usuarios
          .filter(u => u.aprobado && !u.es_admin)
          .map(u => ({ nombre: u.nombre, pick: allPicks[u.id]?.[partido.id] }))
          .filter(x => x.pick);
        if (picksPartido.length === 0) return null;
        return (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--borde)" }}>
            <div style={{ fontSize: 11, color: "var(--texto2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Pronósticos del grupo</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {picksPartido.map(({ nombre, pick }) => {
                const pts = calcularPuntos(pick, partido);
                return (
                  <div key={nombre} style={{ background: "var(--fondo3)", border: "1px solid var(--borde)", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                    <span style={{ color: "var(--texto2)", marginRight: 6 }}>{nombre}</span>
                    <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16 }}>{pick.goles_local} - {pick.goles_visitante}</span>
                    {pts !== null && <span style={{ marginLeft: 8, color: pts > 0 ? "var(--verde)" : "var(--texto2)", fontFamily: "'Bebas Neue', cursive", fontSize: 14 }}>{pts}pts</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      {esAdmin && tieneResultado && !editando && (
        <div className="resultado-inputs">
          <span style={{ fontSize: 12, color: "var(--verde)" }}>✓ Cargado: {partido.goles_local} - {partido.goles_visitante}</span>
          <button style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setEditando(true)}>Editar</button>
          <button style={{ background: "none", border: "1px solid var(--rojo)", color: "var(--rojo)", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} onClick={() => onResultadoCargado(partido.id, { goles_local: null, goles_visitante: null, clasificado: null })}>Borrar</button>
        </div>
      )}
      {esAdmin && (!tieneResultado || editando) && (
        <div className="resultado-inputs">
          <span style={{ fontSize: 12, color: "var(--texto2)" }}>Resultado:</span>
          <input id={`rgl-${partido.id}`} className="resultado-input" type="number" min="0" placeholder="0" defaultValue={adminGl} onChange={e => setAdminGl(e.target.value)} />
          <span style={{ color: "var(--texto2)", fontFamily: "'Bebas Neue'" }}>-</span>
          <input id={`rgv-${partido.id}`} className="resultado-input" type="number" min="0" placeholder="0" defaultValue={adminGv} onChange={e => setAdminGv(e.target.value)} />
          {esEliminatoria && (
            <div className="clasificado-btns">
              <button className={`clas-btn ${adminClas === partido.local ? "active" : ""}`} onClick={() => setAdminClas(partido.local)}>{partido.local}</button>
              <button className={`clas-btn ${adminClas === partido.visitante ? "active" : ""}`} onClick={() => setAdminClas(partido.visitante)}>{partido.visitante}</button>
            </div>
          )}
          <button className="btn-cargar-res" onClick={cargarResultado}>CARGAR</button>
          {editando && <button style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 6, padding: "9px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setEditando(false)}>Cancelar</button>}
        </div>
      )}
    </div>
  );
}

function calcPosGrupo(partidos, grupo) {
  const ps = partidos.filter(p => p.fase === "Grupos" && p.grupo === grupo);
  const equipos = {};
  ps.forEach(p => {
    if (!equipos[p.local]) equipos[p.local] = { nombre: p.local, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
    if (!equipos[p.visitante]) equipos[p.visitante] = { nombre: p.visitante, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
    if (p.goles_local === null || p.goles_local === undefined) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    equipos[p.local].pj++; equipos[p.visitante].pj++;
    equipos[p.local].gf += gl; equipos[p.local].gc += gv;
    equipos[p.visitante].gf += gv; equipos[p.visitante].gc += gl;
    if (gl > gv) { equipos[p.local].g++; equipos[p.local].pts += 3; equipos[p.visitante].p++; }
    else if (gl < gv) { equipos[p.visitante].g++; equipos[p.visitante].pts += 3; equipos[p.local].p++; }
    else { equipos[p.local].e++; equipos[p.local].pts++; equipos[p.visitante].e++; equipos[p.visitante].pts++; }
  });
  return Object.values(equipos).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
}

function TabGrupos({ partidos, grupoInicial }) {
  const grupos = [...new Set(partidos.filter(p => p.fase === "Grupos").map(p => p.grupo))].sort();

  useEffect(() => {
    if (grupoInicial) {
      setTimeout(() => {
        const el = document.getElementById(`grupo-${grupoInicial}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [grupoInicial]);
  return (
    <div>
      <div className="section-title">GRUPOS</div>
      <div className="section-sub">Posiciones actualizadas con cada resultado cargado</div>
      {grupos.map(grupo => {
        const tabla = calcPosGrupo(partidos, grupo);
        return (
          <div key={grupo} id={`grupo-${grupo}`} className="admin-card" style={{ marginBottom: 16, scrollMarginTop: 80 }}>
            <div className="grupo-titulo">GRUPO {grupo}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--borde)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Equipo</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11 }}>PJ</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11 }}>G</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11 }}>E</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11 }}>P</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--texto2)", fontWeight: 600, fontSize: 11 }}>DG</th>
                  <th style={{ textAlign: "center", padding: "6px 8px", color: "var(--oro)", fontWeight: 700, fontSize: 13 }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((eq, i) => (
                  <tr key={eq.nombre} style={{ borderBottom: "1px solid var(--borde)", background: i < 2 ? "rgba(0,196,106,0.05)" : "transparent" }}>
                    <td style={{ padding: "8px 8px", fontWeight: i < 2 ? 600 : 400, display: "flex", alignItems: "center", gap: 6 }}>
                      {i < 2 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--verde)", display: "inline-block", flexShrink: 0 }}></span>}
                      {i >= 2 && <span style={{ width: 6, height: 6, display: "inline-block", flexShrink: 0 }}></span>}
                      {eq.nombre}
                    </td>
                    <td style={{ textAlign: "center", padding: "8px 8px", color: "var(--texto2)" }}>{eq.pj}</td>
                    <td style={{ textAlign: "center", padding: "8px 8px", color: "var(--texto2)" }}>{eq.g}</td>
                    <td style={{ textAlign: "center", padding: "8px 8px", color: "var(--texto2)" }}>{eq.e}</td>
                    <td style={{ textAlign: "center", padding: "8px 8px", color: "var(--texto2)" }}>{eq.p}</td>
                    <td style={{ textAlign: "center", padding: "8px 8px", color: "var(--texto2)" }}>{eq.gf - eq.gc > 0 ? "+" : ""}{eq.gf - eq.gc}</td>
                    <td style={{ textAlign: "center", padding: "8px 8px", fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: "var(--verde)" }}>{eq.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: "var(--texto2)", marginTop: 8 }}>🟢 Clasifican a 16avos</div>
          </div>
        );
      })}
    </div>
  );
}


function fechaAInput(f) {
  if (!f) return "";
  const [d, m, y] = f.split("/");
  return `${y}-${m}-${d}`;
}
function inputAFecha(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function TabPartidos({ usuario, partidos, picks, onPickSaved, onPickDeleted, onGrupoClick, allPicks, usuarios }) {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [soloPendientes, setSoloPendientes] = useState(false);

  if (partidos.length === 0) return <div className="loading">Cargando partidos...</div>;

  const fechas = [...new Set(partidos.map(p => p.fecha))];
  const grupos = [...new Set(partidos.filter(p => p.grupo).map(p => p.grupo))].sort();

  const cantPendientes = partidos.filter(p => {
    const estado = estadoPartido(p);
    if (estado === "cerrado") return false;
    const pick = picks[p.id];
    return !pick || pick.goles_local === null || pick.goles_local === undefined;
  }).length;

  const filtrados = partidos.filter(p => {
    if (filtroFecha && p.fecha !== filtroFecha) return false;
    if (filtroGrupo && p.grupo !== filtroGrupo) return false;
    if (soloPendientes) {
      const estado = estadoPartido(p);
      if (estado === "cerrado") return false;
      const pick = picks[p.id];
      if (pick && pick.goles_local !== null && pick.goles_local !== undefined) return false;
    }
    return true;
  });

  const hayFiltros = filtroFecha || filtroGrupo || soloPendientes;

  return (
    <div>
      <div className="section-title">PARTIDOS</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="date"
            value={fechaAInput(filtroFecha)}
            min={fechaAInput(fechas[0])}
            max={fechaAInput(fechas[fechas.length - 1])}
            onChange={e => setFiltroFecha(inputAFecha(e.target.value))}
            style={{ background: "var(--fondo3)", border: `1px solid ${filtroFecha ? "var(--verde)" : "var(--borde)"}`, color: filtroFecha ? "var(--texto)" : "var(--texto2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none", colorScheme: "dark" }}
          />
          {filtroFecha && (
            <button onClick={() => setFiltroFecha("")} style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
          )}
        </div>
        <select
          value={filtroGrupo}
          onChange={e => setFiltroGrupo(e.target.value)}
          style={{ background: "var(--fondo3)", border: "1px solid var(--borde)", color: filtroGrupo ? "var(--texto)" : "var(--texto2)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}
        >
          <option value="">🏆 Todos los grupos</option>
          {grupos.map(g => <option key={g} value={g}>Grupo {g}</option>)}
        </select>
        <button
          onClick={() => setSoloPendientes(p => !p)}
          style={{ background: soloPendientes ? "var(--rojo)" : "var(--fondo3)", border: `1px solid ${soloPendientes ? "var(--rojo)" : "var(--borde)"}`, color: soloPendientes ? "#fff" : "var(--texto2)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: soloPendientes ? 600 : 400 }}
        >
          ⚠️ Pendientes {cantPendientes > 0 ? `(${cantPendientes})` : ""}
        </button>
        {hayFiltros && (
          <button onClick={() => { setFiltroFecha(""); setFiltroGrupo(""); setSoloPendientes(false); }} style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
            ✕ Limpiar
          </button>
        )}
        <span style={{ fontSize: 13, color: "var(--texto2)", alignSelf: "center", marginLeft: "auto" }}>
          {filtrados.length} partido{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ProximoPartido partidos={partidos} />
      {filtrados.length === 0 && <div className="empty">{soloPendientes ? "🎉 ¡No tenés partidos pendientes!" : "No hay partidos para los filtros seleccionados"}</div>}
      {filtrados.map(p => (
        <PartidoCard key={p.id} partido={p} pick={picks[p.id]} onPickSaved={onPickSaved} onPickDeleted={onPickDeleted} esAdmin={false} onResultadoCargado={() => {}} onGrupoClick={onGrupoClick} allPicks={allPicks} usuarios={usuarios} />
      ))}
    </div>
  );
}



function ProximoPartido({ partidos }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ahora = new Date();
  const hoy = ahora.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "/");

  // Solo partidos de hoy sin resultado, dentro de las próximas 3 horas o en juego
  const partidosHoy = partidos
    .filter(p => {
      if (p.goles_local !== null && p.goles_local !== undefined) return false;
      const inicio = parseFechaPartido(p.fecha, p.hora);
      const diffMs = inicio - ahora;
      // Mostrar si faltan menos de 3 horas O ya empezó (hasta 2 horas después = en juego)
      return diffMs <= 3 * 60 * 60 * 1000 && diffMs > -2 * 60 * 60 * 1000;
    })
    .sort((a, b) => parseFechaPartido(a.fecha, a.hora) - parseFechaPartido(b.fecha, b.hora));

  if (partidosHoy.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {partidosHoy.map(p => {
        const inicio = parseFechaPartido(p.fecha, p.hora);
        const diffMs = inicio - ahora;
        const enJuego = diffMs <= 0;
        const min = Math.floor(Math.abs(diffMs) / 60000);
        const seg = Math.floor((Math.abs(diffMs) % 60000) / 1000);
        const h = Math.floor(Math.abs(diffMs) / 3600000);
        const m = Math.floor((Math.abs(diffMs) % 3600000) / 60000);
        const textoTiempo = enJuego ? "EN JUEGO" : h > 0 ? `${h}h ${m}m` : `${m}m ${seg}s`;
        const colorBadge = enJuego ? "var(--rojo)" : "var(--verde)";

        return (
          <div key={p.id} style={{ background: "linear-gradient(135deg, #111a15 0%, #1a2820 100%)", border: `1px solid ${colorBadge}`, borderRadius: 14, padding: "20px 24px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: colorBadge, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
              {enJuego ? "🔴 En juego" : "⚽ Próximo partido"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>{p.local}</span>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "var(--texto2)" }}>VS</span>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 700, textAlign: "right" }}>{p.visitante}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--texto2)" }}>{p.fecha} · {p.hora}{p.canal ? ` · 📺 ${p.canal}` : ""}</span>
              <div style={{ background: colorBadge, color: enJuego ? "#fff" : "#000", fontFamily: "'Bebas Neue', cursive", fontSize: 22, padding: "4px 16px", borderRadius: 8, letterSpacing: 2 }}>
                {textoTiempo}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function calcRacha(uid, partidos, allPicks) {
  const jugados = partidos
    .filter(p => p.goles_local !== null && p.goles_local !== undefined)
    .sort((a, b) => b.id - a.id);
  let racha = 0;
  for (const p of jugados) {
    const pick = allPicks[uid]?.[p.id];
    if (!pick) break;
    const res1x2 = p.goles_local > p.goles_visitante ? "L" : p.goles_local < p.goles_visitante ? "V" : "E";
    const pk1x2 = pick.goles_local > pick.goles_visitante ? "L" : pick.goles_local < pick.goles_visitante ? "V" : "E";
    if (pk1x2 === res1x2) racha++;
    else break;
  }
  return racha;
}

function calcStats(uid, partidos, allPicks, podioPredicciones, podioResultado) {
  let pts = 0, exactos = 0, unox2 = 0, bonus = 0, ptsPoido = 0;
  partidos.forEach(p => {
    const pick = allPicks[uid]?.[p.id];
    if (!pick || p.goles_local === null || p.goles_local === undefined) return;
    const resL = p.goles_local, resV = p.goles_visitante;
    const pkL = pick.goles_local, pkV = pick.goles_visitante;
    const res1x2 = resL > resV ? "L" : resL < resV ? "V" : "E";
    const pk1x2 = pkL > pkV ? "L" : pkL < pkV ? "V" : "E";
    if (pk1x2 === res1x2) { pts += 1; unox2++; }
    if (pkL === resL && pkV === resV) { pts += 2; exactos++; }
    if (p.fase !== "Grupos" && pick.clasificado && p.clasificado && pick.clasificado === p.clasificado) { pts += 1; bonus++; }
  });
  // Puntos podio
  if (podioPredicciones && podioResultado?.primero) {
    const pred = podioPredicciones[uid];
    if (pred) {
      if (pred.primero === podioResultado.primero) { pts += 10; ptsPoido += 10; }
      if (pred.segundo === podioResultado.segundo) { pts += 6; ptsPoido += 6; }
      if (pred.tercero === podioResultado.tercero) { pts += 4; ptsPoido += 4; }
    }
  }
  return { pts, exactos, unox2, bonus, ptsPoido };
}

function TabTabla({ usuarios, allPicks, partidos, esPublica, podioPredicciones, podioResultado }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);
  const tabla = aprobados.map(u => ({ ...u, ...calcStats(u.id, partidos, allPicks, podioPredicciones, podioResultado), racha: calcRacha(u.id, partidos, allPicks) })).sort((a, b) => b.pts - a.pts);
  if (tabla.length === 0) return <div className="empty">No hay participantes aprobados aún</div>;

  const compartirWhatsApp = () => {
    const medalla = ["🥇","🥈","🥉"];
    const lineas = tabla.map((u, i) => `${medalla[i] || `${i+1}.`} ${u.nombre} — ${u.pts} pts (🎯${u.exactos} ✓${u.unox2})`);
    const texto = `🏆 *PRODE MUNDIAL 2026*\n\n${lineas.join("\n")}\n\n_Jugá en: ${window.location.origin}?public=1_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>TABLA DE POSICIONES</div>
        {!esPublica && (
          <button onClick={compartirWhatsApp} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            📲 Compartir
          </button>
        )}
      </div>
      <div className="section-sub">Actualizada en tiempo real con cada resultado</div>

      {/* Podio animado */}
      {tabla.length >= 2 && (
        <div className="podio-wrap">
          {/* 2do lugar */}
          {tabla[1] && (
            <div className="podio-item">
              <div className="podio-nombre">{tabla[1].nombre}</div>
              <div className="podio-pts" style={{ color: "#c0c0c0" }}>{tabla[1].pts}pts</div>
              <div className="podio-base" style={{ height: 70, background: "rgba(192,192,192,0.15)", border: "1px solid #c0c0c0" }}>🥈</div>
            </div>
          )}
          {/* 1er lugar */}
          <div className="podio-item">
            <div className="podio-nombre" style={{ fontWeight: 700 }}>{tabla[0].nombre}</div>
            <div className="podio-pts" style={{ color: "var(--oro)" }}>{tabla[0].pts}pts</div>
            <div className="podio-base" style={{ height: 100, background: "rgba(245,197,24,0.15)", border: "1px solid var(--oro)" }}>👑</div>
          </div>
          {/* 3er lugar */}
          {tabla[2] && (
            <div className="podio-item">
              <div className="podio-nombre">{tabla[2].nombre}</div>
              <div className="podio-pts" style={{ color: "#cd7f32" }}>{tabla[2].pts}pts</div>
              <div className="podio-base" style={{ height: 50, background: "rgba(205,127,50,0.15)", border: "1px solid #cd7f32" }}>🥉</div>
            </div>
          )}
        </div>
      )}

      {/* Mejor jugador por fecha */}
      {(() => {
        const fechas = [...new Set(partidos.filter(p => p.goles_local !== null && p.goles_local !== undefined).map(p => p.fecha))];
        if (fechas.length === 0) return null;
        const ultimaFecha = fechas[fechas.length - 1];
        const partidosFecha = partidos.filter(p => p.fecha === ultimaFecha && p.goles_local !== null);
        const statsXfecha = aprobados.map(u => {
          let pts = 0;
          partidosFecha.forEach(p => {
            pts += calcularPuntos(allPicks[u.id]?.[p.id], p) || 0;
          });
          return { nombre: u.nombre, pts };
        }).sort((a, b) => b.pts - a.pts);
        const lider = statsXfecha[0];
        if (!lider || lider.pts === 0) return null;
        return (
          <div style={{ background: "rgba(245,197,24,0.08)", border: "1px solid var(--oro)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <div>
              <div style={{ fontSize: 11, color: "var(--oro)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Mejor del {ultimaFecha}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{lider.nombre} <span style={{ color: "var(--oro)", fontFamily: "'Bebas Neue', cursive", fontSize: 20 }}>{lider.pts} pts</span></div>
            </div>
          </div>
        );
      })()}

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th style={{ textAlign: "center" }}>Pts</th>
              <th style={{ textAlign: "center" }}>🎯 Exactos</th>
              <th style={{ textAlign: "center" }}>✓ 1X2</th>
              <th style={{ textAlign: "center" }}>⭐ Bonus</th>
              <th style={{ textAlign: "center" }}>🔥 Racha</th>
            </tr>
          </thead>
          <tbody>{tabla.map((u, i) => (
            <tr key={u.id} className={`pos-${i + 1}`}>
              <td><span className="pos-num">{i === 0 ? "👑" : i + 1}</span></td>
              <td style={{ fontWeight: i === 0 ? 700 : 400 }}>{u.nombre}</td>
              <td style={{ textAlign: "center" }}><span className="pts-total">{u.pts}</span></td>
              <td style={{ textAlign: "center", color: "var(--verde)", fontFamily: "'Bebas Neue', cursive", fontSize: 18 }}>{u.exactos}</td>
              <td style={{ textAlign: "center", color: "var(--texto2)", fontFamily: "'Bebas Neue', cursive", fontSize: 18 }}>{u.unox2}</td>
              <td style={{ textAlign: "center", color: "var(--oro)", fontFamily: "'Bebas Neue', cursive", fontSize: 18 }}>{u.bonus}</td>
              <td style={{ textAlign: "center", color: u.racha > 2 ? "var(--rojo)" : "var(--texto2)", fontFamily: "'Bebas Neue', cursive", fontSize: 18 }}>{u.racha > 0 ? u.racha + "✓" : "-"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <ResumenJornada partidos={partidos} allPicks={allPicks} usuarios={usuarios} />
    </div>
  );
}

function TabAdmin({ usuarios, partidos, onAprobar, onRechazar, onResultadoCargado, onResetPassword }) {
  const pendientes = usuarios.filter(u => !u.aprobado && !u.es_admin);
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);
  const [fechaAdmin, setFechaAdmin] = useState("");

  const jugados = partidos.filter(p => p.goles_local !== null && p.goles_local !== undefined).length;
  const fechas = [...new Set(partidos.map(p => p.fecha))];
  const partidosFiltrados = fechaAdmin ? partidos.filter(p => p.fecha === fechaAdmin) : partidos;

  return (
    <div>
      <div className="section-title">ADMINISTRACIÓN</div>

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 28 }}>
        {[
          { label: "Participantes", valor: aprobados.length, color: "var(--verde)" },
          { label: "Pendientes", valor: pendientes.length, color: "var(--oro)" },
          { label: "Partidos jugados", valor: `${jugados}/${partidos.length}`, color: "var(--texto)" },
        ].map(({ label, valor, color }) => (
          <div key={label} className="admin-card" style={{ padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, color }}>{valor}</div>
            <div style={{ fontSize: 12, color: "var(--texto2)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="fase-label">Pendientes de aprobación ({pendientes.length})</div>
      {pendientes.length === 0 && <div style={{ color: "var(--texto2)", fontSize: 14, padding: "16px 0" }}>No hay solicitudes pendientes</div>}
      {pendientes.map(u => (
        <div key={u.id} className="admin-card">
          <div className="admin-user-row">
            <div>
              <div className="admin-user-nombre">{u.nombre}</div>
              <div className="admin-user-email">{u.email}</div>
              {u.telefono && <div style={{ fontSize: 13, color: "var(--texto2)", marginTop: 2 }}>📱 {u.telefono}</div>}
            </div>
            <div className="admin-btns">
              <span className="estado-badge estado-pendiente">Pendiente</span>
              <button className="btn-aprobar" onClick={() => onAprobar(u.id)}>Aprobar</button>
              <button className="btn-rechazar" onClick={() => onRechazar(u.id)}>Rechazar</button>
            </div>
          </div>
        </div>
      ))}
      <div className="fase-label" style={{ marginTop: 28 }}>Aprobados ({aprobados.length})</div>
      {aprobados.map(u => (
        <div key={u.id} className="admin-card">
          <div className="admin-user-row">
            <div>
              <div className="admin-user-nombre">{u.nombre}</div>
              <div className="admin-user-email">{u.email}</div>
              {u.telefono && <div style={{ fontSize: 13, color: "var(--texto2)", marginTop: 2 }}>📱 <a href={`https://wa.me/${u.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ color: "var(--verde)", textDecoration: "none" }}>{u.telefono}</a></div>}
            </div>
            <div className="admin-btns">
              <span className="estado-badge estado-aprobado">Aprobado</span>
              <button style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} onClick={() => onResetPassword(u.id, u.nombre)}>Reset pass</button>
            </div>
          </div>
        </div>
      ))}
      <div className="fase-label" style={{ marginTop: 28 }}>Cargar resultados</div>
      <select value={fechaAdmin} onChange={e => setFechaAdmin(e.target.value)}
        style={{ background: "var(--fondo3)", border: "1px solid var(--borde)", color: "var(--texto)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none", marginBottom: 16 }}>
        <option value="">📅 Todas las fechas</option>
        {fechas.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
      {partidosFiltrados.map(p => <PartidoCard key={p.id} partido={p} pick={null} onPickSaved={() => {}} esAdmin={true} onResultadoCargado={onResultadoCargado} />)}
    </div>
  );
}

// ─── LLAVES ───────────────────────────────────────────────────────────────────
function calcPosGrupoSimple(partidos, grupo) {
  const ps = partidos.filter(p => p.fase === "Grupos" && p.grupo === grupo);
  const equipos = {};
  ps.forEach(p => {
    if (!equipos[p.local]) equipos[p.local] = { nombre: p.local, pts: 0, dg: 0, gf: 0 };
    if (!equipos[p.visitante]) equipos[p.visitante] = { nombre: p.visitante, pts: 0, dg: 0, gf: 0 };
    if (p.goles_local === null || p.goles_local === undefined) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    equipos[p.local].gf += gl; equipos[p.local].dg += gl - gv;
    equipos[p.visitante].gf += gv; equipos[p.visitante].dg += gv - gl;
    if (gl > gv) { equipos[p.local].pts += 3; }
    else if (gl < gv) { equipos[p.visitante].pts += 3; }
    else { equipos[p.local].pts++; equipos[p.visitante].pts++; }
  });
  return Object.values(equipos).sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

function LlaveSlot({ equipo, pos }) {
  const tieneEquipo = equipo && !equipo.startsWith("1°") && !equipo.startsWith("2°");
  return (
    <div style={{
      background: tieneEquipo ? "var(--fondo2)" : "var(--fondo3)",
      border: `1px solid ${tieneEquipo ? "var(--borde)" : "var(--borde)"}`,
      borderRadius: 6, padding: "8px 12px", fontSize: 13,
      fontWeight: tieneEquipo ? 600 : 400,
      color: tieneEquipo ? "var(--texto)" : "var(--texto2)",
      minWidth: 140, textAlign: "center"
    }}>
      {equipo || "Por definir"}
    </div>
  );
}

function TabLlaves({ partidos }) {
  const grupos = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const primeros = {}, segundos = {};
  grupos.forEach(g => {
    const tabla = calcPosGrupoSimple(partidos, g);
    const partidosGrupo = partidos.filter(p => p.fase === "Grupos" && p.grupo === g);
    const jugados = partidosGrupo.filter(p => p.goles_local !== null && p.goles_local !== undefined).length;
    const total = partidosGrupo.length;
    primeros[g] = jugados === total && tabla[0] ? tabla[0].nombre : `1° Grupo ${g}`;
    segundos[g] = jugados === total && tabla[1] ? tabla[1].nombre : `2° Grupo ${g}`;
  });

  // Cruces de 16avos según fixture oficial Mundial 2026
  const dieciseis = [
    { id: 1, local: primeros["A"], visitante: segundos["B"] },
    { id: 2, local: primeros["C"], visitante: segundos["D"] },
    { id: 3, local: primeros["E"], visitante: segundos["F"] },
    { id: 4, local: primeros["G"], visitante: segundos["H"] },
    { id: 5, local: primeros["I"], visitante: segundos["J"] },
    { id: 6, local: primeros["K"], visitante: segundos["L"] },
    { id: 7, local: primeros["B"], visitante: segundos["A"] },
    { id: 8, local: primeros["D"], visitante: segundos["C"] },
    { id: 9, local: primeros["F"], visitante: segundos["E"] },
    { id: 10, local: primeros["H"], visitante: segundos["G"] },
    { id: 11, local: primeros["J"], visitante: segundos["I"] },
    { id: 12, local: primeros["L"], visitante: segundos["K"] },
  ];

  const cruce = (local, visitante, label) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
      {label && <div style={{ fontSize: 10, color: "var(--texto2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{label}</div>}
      <LlaveSlot equipo={local} />
      <div style={{ fontSize: 11, color: "var(--texto2)" }}>vs</div>
      <LlaveSlot equipo={visitante} />
    </div>
  );

  return (
    <div>
      <div className="section-title">LLAVES</div>
      <div className="section-sub">Los cruces se completan automáticamente al terminar la fase de grupos</div>
      <div className="fase-label">16avos de Final</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
        {dieciseis.map(c => (
          <div key={c.id} className="admin-card" style={{ padding: 16 }}>
            {cruce(c.local, c.visitante, `Partido ${c.id}`)}
          </div>
        ))}
      </div>
      <div className="fase-label" style={{ marginTop: 24 }}>Octavos, Cuartos, Semis y Final</div>
      <div className="admin-card" style={{ textAlign: "center", color: "var(--texto2)", fontSize: 14, padding: 32 }}>
        Se completarán a medida que avance el torneo
      </div>
    </div>
  );
}

function TabCuenta({ usuario, onPasswordChanged, partidos, allPicks }) {
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCambio = async () => {
    setError(""); setSuccess("");
    if (!passActual || !passNueva || !passConfirm) { setError("Completá todos los campos"); return; }
    if (passActual !== usuario.password) { setError("La contraseña actual es incorrecta"); return; }
    if (passNueva.length < 6) { setError("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if (passNueva !== passConfirm) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    const { data, error } = await supabase.from("usuarios").update({ password: passNueva }).eq("id", usuario.id).select().single();
    setLoading(false);
    if (error) { setError("Error al cambiar la contraseña"); return; }
    setSuccess("¡Contraseña actualizada!");
    onPasswordChanged(data);
    setPassActual(""); setPassNueva(""); setPassConfirm("");
  };

  return (
    <div>
      <div className="section-title">MI CUENTA</div>

      {/* Estadísticas personales */}
      {(() => {
        const s = calcStats(usuario.id, partidos || [], allPicks || {});
        const jugados = (partidos || []).filter(p => p.goles_local !== null && p.goles_local !== undefined).length;
        const picksJugados = (partidos || []).filter(p => {
          const pick = (allPicks || {})[usuario.id]?.[p.id];
          return pick && p.goles_local !== null && p.goles_local !== undefined;
        }).length;
        const pctExactos = picksJugados > 0 ? Math.round((s.exactos / picksJugados) * 100) : 0;
        const pct1x2 = picksJugados > 0 ? Math.round((s.unox2 / picksJugados) * 100) : 0;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Puntos", valor: s.pts, color: "var(--verde)" },
              { label: "Exactos", valor: s.exactos, color: "var(--verde)" },
              { label: "% Exactos", valor: pctExactos + "%", color: "var(--texto)" },
              { label: "% 1X2", valor: pct1x2 + "%", color: "var(--texto)" },
              { label: "Picks jugados", valor: picksJugados + "/" + jugados, color: "var(--texto2)" },
              { label: "Bonus", valor: s.bonus, color: "var(--oro)" },
            ].map(({ label, valor, color }) => (
              <div key={label} className="admin-card" style={{ padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color }}>{valor}</div>
                <div style={{ fontSize: 11, color: "var(--texto2)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Historial partido por partido */}
      {(() => {
        const jugados = (partidos || []).filter(p => p.goles_local !== null && p.goles_local !== undefined).sort((a,b) => b.id - a.id);
        if (jugados.length === 0) return null;
        return (
          <div style={{ marginBottom: 20 }}>
            <div className="fase-label" style={{ marginTop: 0, marginBottom: 12 }}>Mi historial</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {jugados.map(p => {
                const pick = (allPicks || {})[usuario.id]?.[p.id];
                const pts = pick ? calcularPuntos(pick, p) : null;
                const tieneExacto = pts !== null && pts >= 3;
                const tiene1x2 = pts !== null && pts >= 1 && !tieneExacto;
                const fallo = pts === 0;
                const sinPick = pts === null;
                let color = "var(--texto2)";
                let icon = "—";
                if (tieneExacto) { color = "var(--verde)"; icon = "🎯"; }
                else if (tiene1x2) { color = "var(--oro)"; icon = "✓"; }
                else if (fallo) { color = "var(--rojo)"; icon = "✗"; }
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--fondo2)", border: "1px solid var(--borde)", borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.local} vs {p.visitante}</div>
                      <div style={{ fontSize: 11, color: "var(--texto2)" }}>{p.fecha} · Res: {p.goles_local}-{p.goles_visitante}{pick ? ` · Pick: ${pick.goles_local}-${pick.goles_visitante}` : " · Sin pick"}</div>
                    </div>
                    {pts !== null && <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color, flexShrink: 0 }}>{pts}pts</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="admin-card" style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 4 }}>Nombre</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{usuario.nombre}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 16 }}>{usuario.email}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 4 }}>WhatsApp</div>
          <div style={{ fontSize: 16 }}>{usuario.telefono || <span style={{ color: "var(--texto2)", fontStyle: "italic" }}>No cargado</span>}</div>
        </div>
        <div className="fase-label" style={{ marginTop: 0, marginBottom: 16 }}>Cambiar contraseña</div>
        <div className="form-group"><label className="form-label">Contraseña actual</label><input className="form-input" type="password" value={passActual} onChange={e => setPassActual(e.target.value)} placeholder="••••••••" /></div>
        <div className="form-group"><label className="form-label">Nueva contraseña</label><input className="form-input" type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
        <div className="form-group"><label className="form-label">Confirmar contraseña</label><input className="form-input" type="password" value={passConfirm} onChange={e => setPassConfirm(e.target.value)} placeholder="Repetí la nueva contraseña" /></div>
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}
        <button className="btn-primary" onClick={handleCambio} disabled={loading} style={{ marginTop: 8 }}>{loading ? "GUARDANDO..." : "CAMBIAR CONTRASEÑA"}</button>
      </div>
    </div>
  );
}

function TabComoFunciona() {
  const reglas = [
    { pts: "1 punto", desc: "Acertás el resultado 1X2 (local gana, empate, visitante gana)" },
    { pts: "3 puntos", desc: "Acertás el marcador exacto (incluye el 1X2)" },
    { pts: "+1 punto", desc: "En eliminatorias: acertás quién clasifica cuando hay empate en 90 min" },
  ];
  return (
    <div>
      <div className="section-title">CÓMO FUNCIONA</div>
      <div className="section-sub">Todo lo que necesitás saber para jugar</div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="grupo-titulo" style={{ marginBottom: 16 }}>Sistema de puntuación</div>
        {reglas.map(({ pts, desc }) => (
          <div key={pts} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ background: "var(--verde)", color: "#000", fontFamily: "'Bebas Neue', cursive", fontSize: 16, padding: "4px 10px", borderRadius: 6, flexShrink: 0, letterSpacing: 1 }}>{pts}</div>
            <div style={{ fontSize: 14, color: "var(--texto)", lineHeight: 1.5, paddingTop: 4 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="grupo-titulo" style={{ marginBottom: 12 }}>Ejemplos</div>
        {[
          { partido: "Argentina 2 - 1 Francia", pick: "Pronosticás 2-1 →", resultado: "3 puntos (exacto)" },
          { partido: "Argentina 2 - 1 Francia", pick: "Pronosticás 1-0 →", resultado: "1 punto (1X2 correcto)" },
          { partido: "Argentina 2 - 1 Francia", pick: "Pronosticás 0-1 →", resultado: "0 puntos" },
        ].map(({ partido, pick, resultado }) => (
          <div key={pick} style={{ marginBottom: 12, padding: "10px 14px", background: "var(--fondo3)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: "var(--texto2)", marginBottom: 4 }}>{partido}</div>
            <div style={{ fontSize: 14 }}>{pick} <span style={{ color: "var(--verde)", fontWeight: 600 }}>{resultado}</span></div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="grupo-titulo" style={{ marginBottom: 12 }}>Reglas importantes</div>
        {[
          "Los pronósticos se cierran 15 minutos antes de que arranque cada partido.",
          "Se puntúa el resultado de los 90 minutos. El alargue y los penales no cuentan para el marcador.",
          "En eliminatorias, si pronosticás empate en 90 min, tenés que elegir quién clasifica para sumar el punto bonus.",
          "Podés modificar tu pronóstico hasta 15 minutos antes del inicio del partido.",
          "Los picks de todos se revelan una vez que el partido cierra.",
        ].map((regla, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, fontSize: 14, lineHeight: 1.5 }}>
            <span style={{ color: "var(--verde)", flexShrink: 0, fontWeight: 700 }}>→</span>
            <span>{regla}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPicksGlobales({ partidos, allPicks, usuarios }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);
  const total = aprobados.length;
  const [filtroFecha, setFiltroFecha] = useState("");
  const fechas = [...new Set(partidos.map(p => p.fecha))];
  const partidosFiltrados = filtroFecha ? partidos.filter(p => p.fecha === filtroFecha) : partidos;

  const getStats = (partido) => {
    let local = 0, empate = 0, visitante = 0, sinPick = 0;
    aprobados.forEach(u => {
      const pick = allPicks[u.id]?.[partido.id];
      if (!pick || pick.goles_local === null || pick.goles_local === undefined) { sinPick++; return; }
      const gl = pick.goles_local, gv = pick.goles_visitante;
      if (gl > gv) local++;
      else if (gl < gv) visitante++;
      else empate++;
    });
    const jugaron = total - sinPick;
    return { local, empate, visitante, sinPick, jugaron };
  };

  const Barra = ({ valor, total, color, label }) => {
    const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
    return (
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--texto2)", marginBottom: 4 }}>{label}</div>
        <div style={{ height: 6, background: "var(--fondo3)", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color }}>{pct}%</div>
        <div style={{ fontSize: 11, color: "var(--texto2)" }}>{valor} picks</div>
      </div>
    );
  };

  return (
    <div>
      <div className="section-title">PICKS GLOBALES</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
          style={{ background: "var(--fondo3)", border: "1px solid var(--borde)", color: "var(--texto)", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none" }}>
          <option value="">📅 Todas las fechas</option>
          {fechas.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      {partidosFiltrados.map(p => {
        const { local, empate, visitante, sinPick, jugaron } = getStats(p);
        const cerrado = estadoPartido(p) === "cerrado";
        return (
          <div key={p.id} className="admin-card" style={{ marginBottom: 12 }}>
            <div className="partido-meta">
              <span className="partido-fecha">{p.fecha} · {p.hora}</span>
              <span className="partido-grupo">{p.grupo ? `Grupo ${p.grupo}` : p.fase}</span>
            </div>
            <div className="partido-equipos" style={{ marginBottom: 14 }}>
              <span className="equipo-nombre">{p.local}</span>
              <span className="vs">VS</span>
              <span className="equipo-nombre visitante">{p.visitante}</span>
            </div>
            {!cerrado ? (
              <div style={{ fontSize: 13, color: "var(--texto2)", fontStyle: "italic" }}>
                🔒 Los picks se revelan cuando cierre el partido · {jugaron}/{total} cargados
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  <Barra valor={local} total={jugaron} color="var(--verde)" label={p.local} />
                  <Barra valor={empate} total={jugaron} color="var(--texto2)" label="Empate" />
                  <Barra valor={visitante} total={jugaron} color="var(--rojo)" label={p.visitante} />
                </div>
                {(() => {
                  // Score más elegido
                  const scores = {};
                  aprobados.forEach(u => {
                    const pk = allPicks[u.id]?.[p.id];
                    if (!pk || pk.goles_local === null || pk.goles_local === undefined) return;
                    const key = `${pk.goles_local}-${pk.goles_visitante}`;
                    scores[key] = (scores[key] || 0) + 1;
                  });
                  const top = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
                  if (!top) return null;
                  const esAcertado = p.goles_local !== null && `${p.goles_local}-${p.goles_visitante}` === top[0];
                  return (
                    <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>
                      Score más elegido: <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: esAcertado ? "var(--verde)" : "var(--texto)", marginLeft: 4 }}>{top[0].replace("-"," - ")}</span>
                      <span style={{ marginLeft: 6, color: "var(--texto2)" }}>({top[1]} picks{esAcertado ? " ✓" : ""})</span>
                    </div>
                  );
                })()}
                {(() => {
                  // Predicción más osada — el pick que nadie más eligió
                  const scores = {};
                  aprobados.forEach(u => {
                    const pk = allPicks[u.id]?.[p.id];
                    if (!pk || pk.goles_local === null || pk.goles_local === undefined) return;
                    const key = `${pk.goles_local}-${pk.goles_visitante}`;
                    scores[key] = (scores[key] || { count: 0, nombre: u.nombre });
                    scores[key].count++;
                    scores[key].nombre = u.nombre;
                  });
                  const unicos = Object.entries(scores).filter(([, v]) => v.count === 1);
                  if (unicos.length === 0) return null;
                  // Elegir el más "loco" — el que más difiere del resultado o del más elegido
                  const topScore = Object.entries(scores).sort((a,b) => b[1].count - a[1].count)[0]?.[0];
                  const masLoco = unicos.sort((a, b) => {
                    const [aL, aV] = a[0].split("-").map(Number);
                    const [bL, bV] = b[0].split("-").map(Number);
                    const [tL, tV] = (topScore || "0-0").split("-").map(Number);
                    return (Math.abs(aL-tL) + Math.abs(aV-tV)) > (Math.abs(bL-tL) + Math.abs(bV-tV)) ? -1 : 1;
                  })[0];
                  if (!masLoco) return null;
                  return (
                    <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 4 }}>
                      🎲 Pick más osado: <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: "var(--oro)", marginLeft: 4 }}>{masLoco[0].replace("-"," - ")}</span>
                      <span style={{ marginLeft: 6 }}>({masLoco[1].nombre})</span>
                    </div>
                  );
                })()}
                <div style={{ fontSize: 11, color: "var(--texto2)" }}>{jugaron} de {total} participantes cargaron pick</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}


function ResumenJornada({ partidos, allPicks, usuarios }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);

  // Encontrar la última fecha con todos los partidos jugados
  const fechas = [...new Set(partidos.map(p => p.fecha))];
  const ultimaFechaCompleta = fechas.slice().reverse().find(fecha => {
    const ps = partidos.filter(p => p.fecha === fecha);
    return ps.length > 0 && ps.every(p => p.goles_local !== null && p.goles_local !== undefined);
  });

  if (!ultimaFechaCompleta) return null;

  const partidosFecha = partidos.filter(p => p.fecha === ultimaFechaCompleta);

  // Stats globales de la jornada
  let totalExactos = 0, total1x2 = 0, totalPuntos = 0;
  const statsPorJugador = aprobados.map(u => {
    let pts = 0, exactos = 0;
    partidosFecha.forEach(p => {
      const pick = allPicks[u.id]?.[p.id];
      if (!pick) return;
      const resL = p.goles_local, resV = p.goles_visitante;
      const pkL = pick.goles_local, pkV = pick.goles_visitante;
      const res1x2 = resL > resV ? "L" : resL < resV ? "V" : "E";
      const pk1x2 = pkL > pkV ? "L" : pkL < pkV ? "V" : "E";
      if (pk1x2 === res1x2) { pts += 1; total1x2++; }
      if (pkL === resL && pkV === resV) { pts += 2; exactos++; totalExactos++; }
    });
    totalPuntos += pts;
    return { nombre: u.nombre, pts, exactos };
  }).sort((a, b) => b.pts - a.pts);

  const lider = statsPorJugador[0];
  const sinPuntos = statsPorJugador.filter(u => u.pts === 0).length;
  const medallas = ["🥇","🥈","🥉"];

  const compartir = () => {
    const lineas = statsPorJugador.slice(0, 5).map((u, i) => (medallas[i] || (i+1)+'.') + ' ' + u.nombre + ' — ' + u.pts + 'pts');
    const texto = '⚽ *PRODE MUNDIAL — ' + ultimaFechaCompleta + '*\n\n' + lineas.join('\n') + '\n\n🎯 Exactos: ' + totalExactos + ' | ✓ 1X2: ' + total1x2 + '';
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <div className="resumen-jornada">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="resumen-titulo">📋 RESUMEN DE JORNADA</div>
          <div className="resumen-fecha">{ultimaFechaCompleta} · {partidosFecha.length} partidos</div>
        </div>
        <button onClick={compartir} style={{ background: "#25D366", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          📲 Compartir
        </button>
      </div>
      <div className="resumen-stats">
        {[
          { val: totalExactos, label: "Exactos" },
          { val: total1x2, label: "1X2 acertados" },
          { val: totalPuntos, label: "Puntos totales" },
          { val: sinPuntos, label: "Sin puntos" },
        ].map(({ val, label }) => (
          <div key={label} className="resumen-stat">
            <div className="resumen-stat-val">{val}</div>
            <div className="resumen-stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--texto2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tabla del día</div>
      <div className="resumen-podio">
        {statsPorJugador.map((u, i) => (
          <div key={u.nombre} className="resumen-jugador">
            <span style={{ width: 24, textAlign: "center", flexShrink: 0 }}>{medallas[i] || `${i+1}.`}</span>
            <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 400 }}>{u.nombre}</span>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: u.pts > 0 ? "var(--verde)" : "var(--texto2)" }}>{u.pts}pts</span>
            {u.exactos > 0 && <span style={{ fontSize: 11, color: "var(--texto2)" }}>🎯{u.exactos}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}


function TabPodio({ usuario, partidos, usuarios, podioPredicciones, podioResultado, onGuardarPrediccion, onGuardarResultado, esAdmin }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);

  // Obtener todos los equipos únicos de los partidos
  const equipos = [...new Set([
    ...partidos.map(p => p.local),
    ...partidos.map(p => p.visitante),
  ])].sort();

  // Predicción del usuario actual
  const miPred = podioPredicciones[usuario.id] || { primero: "", segundo: "", tercero: "" };
  const [primero, setPrimero] = useState(miPred.primero || "");
  const [segundo, setSegundo] = useState(miPred.segundo || "");
  const [tercero, setTercero] = useState(miPred.tercero || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Admin: resultado real
  const [resPrimero, setResPrimero] = useState(podioResultado?.primero || "");
  const [resSegundo, setResSegundo] = useState(podioResultado?.segundo || "");
  const [resTercero, setResTercero] = useState(podioResultado?.tercero || "");
  const [savingRes, setSavingRes] = useState(false);
  const [savedRes, setSavedRes] = useState(false);

  const PUNTOS = { primero: 10, segundo: 6, tercero: 4 };

  const calcPuntosPodio = (pred) => {
    if (!pred || !podioResultado) return 0;
    let pts = 0;
    if (pred.primero && pred.primero === podioResultado.primero) pts += PUNTOS.primero;
    if (pred.segundo && pred.segundo === podioResultado.segundo) pts += PUNTOS.segundo;
    if (pred.tercero && pred.tercero === podioResultado.tercero) pts += PUNTOS.tercero;
    return pts;
  };

  const guardar = async () => {
    if (!primero && !segundo && !tercero) return;
    setSaving(true);
    await onGuardarPrediccion({ primero, segundo, tercero });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const guardarResultado = async () => {
    setSavingRes(true);
    await onGuardarResultado({ primero: resPrimero, segundo: resSegundo, tercero: resTercero });
    setSavingRes(false); setSavedRes(true);
    setTimeout(() => setSavedRes(false), 2000);
  };

  const select = (value, onChange, excluir = []) => (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: "var(--fondo3)", border: `1px solid ${value ? "var(--verde)" : "var(--borde)"}`, color: value ? "var(--texto)" : "var(--texto2)", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", outline: "none", width: "100%" }}>
      <option value="">— Elegir equipo —</option>
      {equipos.filter(e => !excluir.includes(e) || e === value).map(e => <option key={e} value={e}>{e}</option>)}
    </select>
  );

  return (
    <div>
      <div className="section-title">PREDICCIÓN DE PODIO</div>
      <div className="section-sub">Elegí los 3 primeros del torneo · Disponible al terminar la fase de grupos</div>

      {/* Sistema de puntos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        {[{ pos: "🥇 Campeón", pts: 10 }, { pos: "🥈 Subcampeón", pts: 6 }, { pos: "🥉 3er puesto", pts: 4 }].map(({ pos, pts }) => (
          <div key={pos} className="admin-card" style={{ textAlign: "center", padding: "12px 8px" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 26, color: "var(--verde)" }}>{pts} pts</div>
            <div style={{ fontSize: 12, color: "var(--texto2)", marginTop: 2 }}>{pos}</div>
          </div>
        ))}
      </div>

      {/* Predicción del usuario */}
      {!esAdmin && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="grupo-titulo" style={{ marginBottom: 16 }}>Tu predicción</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥇 Campeón (10 pts)</div>
              {select(primero, setPrimero, [segundo, tercero])}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥈 Subcampeón (6 pts)</div>
              {select(segundo, setSegundo, [primero, tercero])}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥉 3er puesto (4 pts)</div>
              {select(tercero, setTercero, [primero, segundo])}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn-guardar" onClick={guardar} disabled={saving}>{saving ? "..." : "GUARDAR"}</button>
            {saved && <span className="save-confirm">✓ Guardado</span>}
          </div>
        </div>
      )}

      {/* Resultado real (solo admin) */}
      {esAdmin && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="grupo-titulo" style={{ marginBottom: 16 }}>Cargar resultado real</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥇 Campeón</div>
              {select(resPrimero, setResPrimero, [resSegundo, resTercero])}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥈 Subcampeón</div>
              {select(resSegundo, setResSegundo, [resPrimero, resTercero])}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--texto2)", marginBottom: 6 }}>🥉 3er puesto</div>
              {select(resTercero, setResTercero, [resPrimero, resSegundo])}
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <button className="btn-cargar-res" onClick={guardarResultado} disabled={savingRes}>{savingRes ? "..." : "CARGAR"}</button>
            {savedRes && <span className="save-confirm">✓ Guardado</span>}
          </div>
        </div>
      )}

      {/* Predicciones de todos — visibles siempre para admin, para usuarios solo si ya cargaron la suya */}
      {(esAdmin || miPred.primero) && aprobados.length > 0 && (
        <div>
          <div className="fase-label" style={{ marginTop: 0, marginBottom: 12 }}>Predicciones del grupo</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aprobados.map(u => {
              const pred = podioPredicciones[u.id];
              const pts = calcPuntosPodio(pred);
              return (
                <div key={u.id} className="admin-card" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: pred ? 8 : 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{u.nombre}</span>
                    {podioResultado?.primero && pred && <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: pts > 0 ? "var(--verde)" : "var(--texto2)" }}>+{pts} pts</span>}
                  </div>
                  {pred ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[{ icon: "🥇", val: pred.primero, pts: PUNTOS.primero }, { icon: "🥈", val: pred.segundo, pts: PUNTOS.segundo }, { icon: "🥉", val: pred.tercero, pts: PUNTOS.tercero }].map(({ icon, val, pts: p }) => {
                        const acertado = podioResultado?.primero && val && (
                          (icon === "🥇" && val === podioResultado.primero) ||
                          (icon === "🥈" && val === podioResultado.segundo) ||
                          (icon === "🥉" && val === podioResultado.tercero)
                        );
                        return val ? (
                          <div key={icon} style={{ background: acertado ? "rgba(0,196,106,0.15)" : "var(--fondo3)", border: `1px solid ${acertado ? "var(--verde)" : "var(--borde)"}`, borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                            {icon} {val} {acertado && <span style={{ color: "var(--verde)", fontSize: 11 }}>✓ +{p}pts</span>}
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--texto2)", fontStyle: "italic" }}>Sin predicción cargada</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const esPublica = new URLSearchParams(window.location.search).get("public") === "1";
  const [usuario, setUsuario] = useState(() => {
    try { const u = localStorage.getItem("prode_usuario"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [usuarios, setUsuarios] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [picks, setPicks] = useState({});
  const [allPicks, setAllPicks] = useState({});
  const [tab, setTab] = useState("partidos");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [podioPredicciones, setPodioPredicciones] = useState({});
  const [podioResultado, setPodioResultado] = useState(null);

  const cargarPartidos = async () => { const { data } = await supabase.from("partidos").select("*").order("id"); if (data) setPartidos(data); };
  const cargarUsuarios = async () => { const { data } = await supabase.from("usuarios").select("*").order("nombre"); if (data) setUsuarios(data); };
  const cargarPicks = async (uid) => { const { data } = await supabase.from("picks").select("*").eq("usuario_id", uid); if (data) { const map = {}; data.forEach(p => { map[p.partido_id] = p; }); setPicks(map); } };
  const cargarAllPicks = async () => { const { data } = await supabase.from("picks").select("*"); if (data) { const map = {}; data.forEach(p => { if (!map[p.usuario_id]) map[p.usuario_id] = {}; map[p.usuario_id][p.partido_id] = p; }); setAllPicks(map); } };

  const handleLogin = async (u) => {
    localStorage.setItem("prode_usuario", JSON.stringify(u));
    // Cargar datos ANTES de setear el usuario para evitar pantalla en blanco
    const [rPartidos, rUsuarios, rPicks, rAllPicks] = await Promise.all([
      supabase.from("partidos").select("*").order("id"),
      supabase.from("usuarios").select("*").order("nombre"),
      supabase.from("picks").select("*").eq("usuario_id", u.id),
      supabase.from("picks").select("*"),
    ]);
    if (rPartidos.data) setPartidos(rPartidos.data);
    if (rUsuarios.data) setUsuarios(rUsuarios.data);
    if (rPicks.data) { const map = {}; rPicks.data.forEach(p => { map[p.partido_id] = p; }); setPicks(map); }
    if (rAllPicks.data) { const map = {}; rAllPicks.data.forEach(p => { if (!map[p.usuario_id]) map[p.usuario_id] = {}; map[p.usuario_id][p.partido_id] = p; }); setAllPicks(map); }
    // Cargar podio
    const [rPodioPreds, rPodioRes] = await Promise.all([
      supabase.from("podio_predicciones").select("*"),
      supabase.from("podio_resultado").select("*").single(),
    ]);
    if (rPodioPreds.data) { const map = {}; rPodioPreds.data.forEach(p => { map[p.usuario_id] = p; }); setPodioPredicciones(map); }
    if (rPodioRes.data) setPodioResultado(rPodioRes.data);
    // Setear usuario DESPUÉS de tener los datos listos
    setUsuario(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("prode_usuario");
    setUsuario(null);
  };

  useEffect(() => {
    if (esPublica) { cargarUsuarios(); cargarPartidos(); cargarAllPicks(); }
    else if (usuario?.id) { cargarPartidos(); cargarUsuarios(); cargarPicks(usuario.id); cargarAllPicks(); }
  }, [usuario?.id, esPublica]);

  // Recordatorio por mail — revisar cada 30 minutos si hay partidos sin pick en 2 horas
  useEffect(() => {
    if (!usuario || usuario.es_admin || esPublica) return;
    const enviarRecordatorio = async () => {
      const ahora = new Date();
      const pendientes = partidos.filter(p => {
        const inicio = parseFechaPartido(p.fecha, p.hora);
        const diff = inicio - ahora;
        if (diff <= 0 || diff > 2 * 60 * 60 * 1000) return false;
        const pick = picks[p.id];
        return !pick || pick.goles_local === null || pick.goles_local === undefined;
      });
      if (pendientes.length === 0) return;
      // Verificar que no mandamos mail en la última hora (usando localStorage)
      const key = "prode_recordatorio_" + usuario.id;
      const ultimo = localStorage.getItem(key);
      if (ultimo && Date.now() - Number(ultimo) < 60 * 60 * 1000) return;
      localStorage.setItem(key, Date.now().toString());
      try {
        await fetch("/api/notify-recordatorio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: usuario.nombre,
            email: usuario.email,
            partidos: pendientes.map(p => ({ fecha: p.fecha, hora: p.hora, local: p.local, visitante: p.visitante, canal: p.canal })),
          }),
        });
      } catch (e) { console.log("Error enviando recordatorio:", e); }
    };
    const id = setInterval(enviarRecordatorio, 30 * 60 * 1000); // cada 30 min
    enviarRecordatorio(); // también al entrar
    return () => clearInterval(id);
  }, [usuario?.id, partidos, picks]);

  // Vista pública — solo muestra la tabla sin login
  if (esPublica) return (
    <><style>{css}</style>
    <div className="app">
      <header className="header">
        <div className="header-logo">PRODE <span>MUNDIAL</span></div>
        <div style={{ fontSize: 13, color: "var(--texto2)" }}>Vista pública</div>
      </header>
      <main className="main">
        {usuarios.length > 0
          ? <TabTabla usuarios={usuarios} allPicks={allPicks} partidos={partidos} esPublica={true} podioPredicciones={podioPredicciones} podioResultado={podioResultado} />
          : <div className="loading">Cargando...</div>}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a href="/" style={{ color: "var(--verde)", fontSize: 14, textDecoration: "none" }}>→ Ingresar al prode</a>
        </div>
      </main>
    </div></>
  );

  const handlePickSaved = async (partidoId, pickData) => {
    const { data } = await supabase.from("picks").upsert([{ usuario_id: usuario.id, partido_id: partidoId, ...pickData }], { onConflict: "usuario_id,partido_id" }).select().single();
    if (data) { setPicks(prev => ({ ...prev, [partidoId]: data })); setAllPicks(prev => ({ ...prev, [usuario.id]: { ...(prev[usuario.id] || {}), [partidoId]: data } })); }
  };

  const handlePickDeleted = async (partidoId) => {
    await supabase.from("picks").delete().eq("usuario_id", usuario.id).eq("partido_id", partidoId);
    setPicks(prev => { const n = { ...prev }; delete n[partidoId]; return n; });
    setAllPicks(prev => { const n = { ...prev }; if (n[usuario.id]) { n[usuario.id] = { ...n[usuario.id] }; delete n[usuario.id][partidoId]; } return n; });
  };
  const handleGuardarPrediccion = async (pred) => {
    const { data } = await supabase.from("podio_predicciones")
      .upsert([{ usuario_id: usuario.id, ...pred }], { onConflict: "usuario_id" })
      .select().single();
    if (data) setPodioPredicciones(prev => ({ ...prev, [usuario.id]: data }));
  };

  const handleGuardarResultado = async (res) => {
    const existing = await supabase.from("podio_resultado").select("id").single();
    if (existing.data) {
      await supabase.from("podio_resultado").update(res).eq("id", existing.data.id);
    } else {
      await supabase.from("podio_resultado").insert([res]);
    }
    setPodioResultado(res);
  };

  const handleAprobar = async (uid) => {
    await supabase.from("usuarios").update({ aprobado: true }).eq("id", uid);
    // Notificar al usuario que fue aprobado
    const u = usuarios.find(u => u.id === uid);
    if (u) {
      try {
        await fetch("/api/notify-aprobado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: u.nombre, email: u.email }),
        });
      } catch (e) { console.log("Error enviando notificación:", e); }
    }
    cargarUsuarios();
  };
  const handleRechazar = async (uid) => { await supabase.from("usuarios").delete().eq("id", uid); cargarUsuarios(); };
  const handleResultadoCargado = async (partidoId, resultado) => { await supabase.from("partidos").update(resultado).eq("id", partidoId); cargarPartidos(); };
  const handleResetPassword = async (uid, nombre) => {
    const nueva = "mundial2026";
    await supabase.from("usuarios").update({ password: nueva }).eq("id", uid);
    alert(`Contraseña de ${nombre} reseteada a: ${nueva}\nMandásela por WhatsApp para que la cambie desde "Mi cuenta".`);
  };

  if (!usuario) return (<><style>{css}</style><Login onLogin={handleLogin} /></>);
  if (!usuario.aprobado) return (
    <><style>{css}</style>
    <div className="pendiente-wrap"><div className="pendiente-card">
      <div className="pendiente-icon">⏳</div>
      <div className="pendiente-title">CUENTA PENDIENTE</div>
      <div className="pendiente-text">Tu registro está siendo revisado. Te avisarán cuando tu cuenta esté aprobada.</div>
      <button className="btn-logout" style={{ marginTop: 24 }} onClick={handleLogout}>Volver</button>
    </div></div></>
  );

  // Badge: partidos que cierran en las próximas 24hs y no tienen pick
  const pendientes = partidos.filter(p => {
    const inicio = parseFechaPartido(p.fecha, p.hora);
    const diff = inicio - new Date();
    if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return false; // solo próximas 24hs
    const pick = picks[p.id];
    return !pick || pick.goles_local === null || pick.goles_local === undefined;
  }).length;

  const tabs = [
    { id: "partidos", label: "Partidos", badge: pendientes > 0 ? pendientes : null },
    { id: "grupos", label: "Grupos" },
    { id: "llaves", label: "Llaves" },
    { id: "picks", label: "Picks" },
    { id: "tabla", label: "Tabla" },
    { id: "podio", label: "🏆 Podio" },
    { id: "reglas", label: "Reglas" },
    { id: "cuenta", label: "Mi cuenta" },
    ...(usuario.es_admin ? [{ id: "admin", label: "⚙️ Admin" }] : [])
  ];

  const handleGrupoClick = (grupo) => {
    setGrupoSeleccionado(grupo);
    setTab("grupos");
  };

  return (
    <><style>{css}</style>
    <div className="app">
      <header className="header">
        <div className="header-logo">PRODE <span>MUNDIAL</span></div>
        <div className="header-right"><span className="header-name">{usuario.nombre}</span><button className="btn-logout" onClick={handleLogout}>Salir</button></div>
      </header>
      <nav className="nav">{tabs.map(t => (
        <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
          <span className="nav-tab-inner">
            {t.label}
            {t.badge && <span className="nav-badge">{t.badge}</span>}
          </span>
        </button>
      ))}</nav>
      <main className="main">
        {tab === "partidos" && <TabPartidos usuario={usuario} partidos={partidos} picks={picks} onPickSaved={handlePickSaved} onPickDeleted={handlePickDeleted} onGrupoClick={handleGrupoClick} allPicks={allPicks} usuarios={usuarios} />}
        {tab === "grupos" && <TabGrupos partidos={partidos} grupoInicial={grupoSeleccionado} />}
        {tab === "llaves" && <TabLlaves partidos={partidos} />}
        {tab === "picks" && <TabPicksGlobales partidos={partidos} allPicks={allPicks} usuarios={usuarios} />}
        {tab === "tabla" && <TabTabla usuarios={usuarios} allPicks={allPicks} partidos={partidos} esPublica={false} podioPredicciones={podioPredicciones} podioResultado={podioResultado} />}
        {tab === "reglas" && <TabComoFunciona />}
        {tab === "podio" && <TabPodio usuario={usuario} partidos={partidos} usuarios={usuarios} podioPredicciones={podioPredicciones} podioResultado={podioResultado} onGuardarPrediccion={handleGuardarPrediccion} onGuardarResultado={handleGuardarResultado} esAdmin={usuario.es_admin} />}
        {tab === "cuenta" && <TabCuenta usuario={usuario} onPasswordChanged={(u) => { localStorage.setItem("prode_usuario", JSON.stringify(u)); setUsuario(u); }} partidos={partidos} allPicks={allPicks} />}
        {tab === "admin" && usuario.es_admin && <TabAdmin usuarios={usuarios} partidos={partidos} onAprobar={handleAprobar} onRechazar={handleRechazar} onResultadoCargado={handleResultadoCargado} onResetPassword={handleResetPassword} />}
      </main>
    </div></>
  );
}
