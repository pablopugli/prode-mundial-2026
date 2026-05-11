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
`;

function Login({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
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
    if (!nombre || !email || !password) { setError("Completá todos los campos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    const { error } = await supabase.from("usuarios").insert([{ nombre: nombre.trim(), email: email.trim(), password, aprobado: false, es_admin: false }]);
    setLoading(false);
    if (error) { setError(error.code === "23505" ? "Ya existe una cuenta con ese email" : "Error al registrarse"); return; }
    setSuccess("¡Registro exitoso! Tu cuenta está pendiente de aprobación.");
    setNombre(""); setEmail(""); setPassword("");
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

function PartidoCard({ partido, pick, onPickSaved, esAdmin, onResultadoCargado }) {
  const [gl, setGl] = useState(pick?.goles_local ?? "");
  const [gv, setGv] = useState(pick?.goles_visitante ?? "");
  const [clasificado, setClasificado] = useState(pick?.clasificado ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adminGl, setAdminGl] = useState(partido.goles_local ?? "");
  const [adminGv, setAdminGv] = useState(partido.goles_visitante ?? "");
  const [adminClas, setAdminClas] = useState(partido.clasificado ?? null);
  const [editando, setEditando] = useState(false);
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
        <span className="partido-grupo">{partido.grupo ? `Grupo ${partido.grupo}` : partido.fase}</span>
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
      {esAdmin && tieneResultado && !editando && (
        <div className="resultado-inputs">
          <span style={{ fontSize: 12, color: "var(--verde)" }}>✓ Cargado: {partido.goles_local} - {partido.goles_visitante}</span>
          <button style={{ background: "none", border: "1px solid var(--borde)", color: "var(--texto2)", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} onClick={() => setEditando(true)}>Editar</button>
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

function TabGrupos({ partidos }) {
  const grupos = [...new Set(partidos.filter(p => p.fase === "Grupos").map(p => p.grupo))].sort();
  return (
    <div>
      <div className="section-title">GRUPOS</div>
      <div className="section-sub">Posiciones actualizadas con cada resultado cargado</div>
      {grupos.map(grupo => {
        const tabla = calcPosGrupo(partidos, grupo);
        return (
          <div key={grupo} className="admin-card" style={{ marginBottom: 16 }}>
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

function TabPartidos({ usuario, partidos, picks, onPickSaved }) {
  if (partidos.length === 0) return <div className="loading">Cargando partidos...</div>;
  return (
    <div>
      <div className="section-title">PARTIDOS</div>
      <div className="section-sub">Cargá tus pronósticos antes del inicio de cada partido</div>
      {partidos.map(p => (
        <PartidoCard key={p.id} partido={p} pick={picks[p.id]} onPickSaved={onPickSaved} esAdmin={false} onResultadoCargado={() => {}} />
      ))}
    </div>
  );
}

function TabTabla({ usuarios, allPicks, partidos }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);
  const calcTotal = (uid) => partidos.reduce((t, p) => t + (calcularPuntos(allPicks[uid]?.[p.id], p) || 0), 0);
  const tabla = aprobados.map(u => ({ ...u, pts: calcTotal(u.id) })).sort((a, b) => b.pts - a.pts);
  if (tabla.length === 0) return <div className="empty">No hay participantes aprobados aún</div>;
  return (
    <div>
      <div className="section-title">TABLA DE POSICIONES</div>
      <div className="section-sub">Actualizada en tiempo real con cada resultado</div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead><tr><th>#</th><th>Jugador</th><th>Puntos</th></tr></thead>
          <tbody>{tabla.map((u, i) => (
            <tr key={u.id} className={`pos-${i + 1}`}>
              <td><span className="pos-num">{i + 1}</span></td>
              <td>{u.nombre}</td>
              <td><span className="pts-total">{u.pts}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function TabAdmin({ usuarios, partidos, onAprobar, onRechazar, onResultadoCargado }) {
  const pendientes = usuarios.filter(u => !u.aprobado && !u.es_admin);
  const aprobados = usuarios.filter(u => u.aprobado && !u.es_admin);
  return (
    <div>
      <div className="section-title">ADMINISTRACIÓN</div>
      <div className="fase-label">Pendientes ({pendientes.length})</div>
      {pendientes.length === 0 && <div style={{ color: "var(--texto2)", fontSize: 14, padding: "16px 0" }}>No hay solicitudes pendientes</div>}
      {pendientes.map(u => (
        <div key={u.id} className="admin-card">
          <div className="admin-user-row">
            <div><div className="admin-user-nombre">{u.nombre}</div><div className="admin-user-email">{u.email}</div></div>
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
            <div><div className="admin-user-nombre">{u.nombre}</div><div className="admin-user-email">{u.email}</div></div>
            <span className="estado-badge estado-aprobado">Aprobado</span>
          </div>
        </div>
      ))}
      <div className="fase-label" style={{ marginTop: 28 }}>Cargar resultados</div>
      {partidos.map(p => <PartidoCard key={p.id} partido={p} pick={null} onPickSaved={() => {}} esAdmin={true} onResultadoCargado={onResultadoCargado} />)}
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

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try { const u = localStorage.getItem("prode_usuario"); return u ? JSON.parse(u) : null; } catch { return null; }
  });
  const [usuarios, setUsuarios] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [picks, setPicks] = useState({});
  const [allPicks, setAllPicks] = useState({});
  const [tab, setTab] = useState("partidos");

  const cargarPartidos = async () => { const { data } = await supabase.from("partidos").select("*").order("id"); if (data) setPartidos(data); };
  const cargarUsuarios = async () => { const { data } = await supabase.from("usuarios").select("*").order("nombre"); if (data) setUsuarios(data); };
  const cargarPicks = async (uid) => { const { data } = await supabase.from("picks").select("*").eq("usuario_id", uid); if (data) { const map = {}; data.forEach(p => { map[p.partido_id] = p; }); setPicks(map); } };
  const cargarAllPicks = async () => { const { data } = await supabase.from("picks").select("*"); if (data) { const map = {}; data.forEach(p => { if (!map[p.usuario_id]) map[p.usuario_id] = {}; map[p.usuario_id][p.partido_id] = p; }); setAllPicks(map); } };

  useEffect(() => { if (usuario) { cargarPartidos(); cargarUsuarios(); cargarPicks(usuario.id); cargarAllPicks(); } }, [usuario]);

  const handleLogin = (u) => {
    localStorage.setItem("prode_usuario", JSON.stringify(u));
    setUsuario(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("prode_usuario");
    setUsuario(null);
  };

  const handlePickSaved = async (partidoId, pickData) => {
    const { data } = await supabase.from("picks").upsert([{ usuario_id: usuario.id, partido_id: partidoId, ...pickData }], { onConflict: "usuario_id,partido_id" }).select().single();
    if (data) { setPicks(prev => ({ ...prev, [partidoId]: data })); setAllPicks(prev => ({ ...prev, [usuario.id]: { ...(prev[usuario.id] || {}), [partidoId]: data } })); }
  };
  const handleAprobar = async (uid) => { await supabase.from("usuarios").update({ aprobado: true }).eq("id", uid); cargarUsuarios(); };
  const handleRechazar = async (uid) => { await supabase.from("usuarios").delete().eq("id", uid); cargarUsuarios(); };
  const handleResultadoCargado = async (partidoId, resultado) => { await supabase.from("partidos").update(resultado).eq("id", partidoId); cargarPartidos(); };

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

  const tabs = [
    { id: "partidos", label: "Partidos" },
    { id: "grupos", label: "Grupos" },
    { id: "llaves", label: "Llaves" },
    { id: "tabla", label: "Tabla" },
    ...(usuario.es_admin ? [{ id: "admin", label: "⚙️ Admin" }] : [])
  ];

  return (
    <><style>{css}</style>
    <div className="app">
      <header className="header">
        <div className="header-logo">PRODE <span>MUNDIAL</span></div>
        <div className="header-right"><span className="header-name">{usuario.nombre}</span><button className="btn-logout" onClick={handleLogout}>Salir</button></div>
      </header>
      <nav className="nav">{tabs.map(t => <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</nav>
      <main className="main">
        {tab === "partidos" && <TabPartidos usuario={usuario} partidos={partidos} picks={picks} onPickSaved={handlePickSaved} />}
        {tab === "grupos" && <TabGrupos partidos={partidos} />}
        {tab === "llaves" && <TabLlaves partidos={partidos} />}
        {tab === "tabla" && <TabTabla usuarios={usuarios} allPicks={allPicks} partidos={partidos} />}
        {tab === "admin" && usuario.es_admin && <TabAdmin usuarios={usuarios} partidos={partidos} onAprobar={handleAprobar} onRechazar={handleRechazar} onResultadoCargado={handleResultadoCargado} />}
      </main>
    </div></>
  );
}
