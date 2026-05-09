import { useState, useEffect } from "react";

// ─── DATOS MOCK ───────────────────────────────────────────────────────────────
const PARTIDOS_GRUPOS = [
  { id: 1, fase: "Grupos", grupo: "A", local: "Argentina", visitante: "Marruecos", fecha: "2026-06-15", hora: "15:00", resultado: null },
  { id: 2, fase: "Grupos", grupo: "A", local: "España", visitante: "Portugal", fecha: "2026-06-15", hora: "18:00", resultado: null },
  { id: 3, fase: "Grupos", grupo: "B", local: "Brasil", visitante: "Francia", fecha: "2026-06-16", hora: "15:00", resultado: null },
  { id: 4, fase: "Grupos", grupo: "B", local: "Alemania", visitante: "Inglaterra", fecha: "2026-06-16", hora: "18:00", resultado: null },
  { id: 5, fase: "Octavos", grupo: null, local: "1A", visitante: "2B", fecha: "2026-07-01", hora: "18:00", resultado: null },
];

const USUARIOS_MOCK = [
  { id: "admin", nombre: "Pablo (Admin)", email: "pablo@enard.com", password: "admin123", aprobado: true, esAdmin: true },
  { id: "u1", nombre: "Lucas Puglisi", email: "lucas@mail.com", password: "pass123", aprobado: true, esAdmin: false },
  { id: "u2", nombre: "Gastón Fuentes", email: "gaston@mail.com", password: "pass123", aprobado: false, esAdmin: false },
  { id: "u3", nombre: "Nico Garibotti", email: "nico@mail.com", password: "pass123", aprobado: false, esAdmin: false },
];

const PICKS_MOCK = {
  u1: {
    1: { golesLocal: 2, golesVisitante: 1, clasificado: null },
    2: { golesLocal: 1, golesVisitante: 1, clasificado: null },
    3: { golesLocal: 0, golesVisitante: 2, clasificado: null },
  }
};

// ─── LÓGICA DE PUNTUACIÓN ─────────────────────────────────────────────────────
function calcularPuntos(pick, resultado, fase) {
  if (!pick || !resultado) return 0;
  let puntos = 0;
  const resLocal = resultado.golesLocal;
  const resVisitante = resultado.golesVisitante;
  const pickLocal = pick.golesLocal;
  const pickVisitante = pick.golesVisitante;

  const res1x2 = resLocal > resVisitante ? "L" : resLocal < resVisitante ? "V" : "E";
  const pick1x2 = pickLocal > pickVisitante ? "L" : pickLocal < pickVisitante ? "V" : "E";

  if (pick1x2 === res1x2) puntos += 1;
  if (pickLocal === resLocal && pickVisitante === resVisitante) puntos += 2; // total 3

  if (fase !== "Grupos" && pick.clasificado && resultado.clasificado) {
    if (pick.clasificado === resultado.clasificado) puntos += 1;
  }
  return puntos;
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --verde: #00c46a;
    --verde-dark: #009e55;
    --rojo: #ff3b3b;
    --oro: #f5c518;
    --fondo: #0a0f0d;
    --fondo2: #111a15;
    --fondo3: #1a2820;
    --borde: #1e3028;
    --texto: #e8f5ee;
    --texto2: #7a9e8a;
    --blanco: #ffffff;
  }

  body { background: var(--fondo); color: var(--texto); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* HEADER */
  .header {
    background: var(--fondo2);
    border-bottom: 1px solid var(--borde);
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-logo {
    font-family: 'Bebas Neue', cursive;
    font-size: 26px;
    color: var(--verde);
    letter-spacing: 2px;
  }
  .header-logo span { color: var(--oro); }
  .header-user { display: flex; align-items: center; gap: 12px; }
  .header-name { font-size: 14px; color: var(--texto2); }
  .btn-logout {
    background: none;
    border: 1px solid var(--borde);
    color: var(--texto2);
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .btn-logout:hover { border-color: var(--rojo); color: var(--rojo); }

  /* NAV */
  .nav {
    background: var(--fondo2);
    border-bottom: 1px solid var(--borde);
    display: flex;
    padding: 0 24px;
    gap: 4px;
  }
  .nav-tab {
    background: none;
    border: none;
    color: var(--texto2);
    padding: 14px 18px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .nav-tab:hover { color: var(--texto); }
  .nav-tab.active { color: var(--verde); border-bottom-color: var(--verde); }

  /* MAIN */
  .main { flex: 1; padding: 32px 24px; max-width: 900px; margin: 0 auto; width: 100%; }

  /* LOGIN */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--fondo);
    padding: 24px;
  }
  .login-card {
    background: var(--fondo2);
    border: 1px solid var(--borde);
    border-radius: 16px;
    padding: 48px 40px;
    width: 100%;
    max-width: 420px;
  }
  .login-title {
    font-family: 'Bebas Neue', cursive;
    font-size: 42px;
    color: var(--verde);
    letter-spacing: 3px;
    margin-bottom: 4px;
  }
  .login-title span { color: var(--oro); }
  .login-sub { color: var(--texto2); font-size: 14px; margin-bottom: 32px; }
  .login-tabs { display: flex; gap: 0; margin-bottom: 28px; border-bottom: 1px solid var(--borde); }
  .login-tab {
    background: none;
    border: none;
    color: var(--texto2);
    padding: 10px 20px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
  }
  .login-tab.active { color: var(--verde); border-bottom-color: var(--verde); }

  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 12px; color: var(--texto2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input {
    width: 100%;
    background: var(--fondo3);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 12px 14px;
    color: var(--texto);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus { border-color: var(--verde); }
  .btn-primary {
    width: 100%;
    background: var(--verde);
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 14px;
    font-family: 'Bebas Neue', cursive;
    font-size: 18px;
    letter-spacing: 2px;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 8px;
  }
  .btn-primary:hover { background: var(--verde-dark); }
  .form-error { color: var(--rojo); font-size: 13px; margin-top: 12px; text-align: center; }
  .form-success { color: var(--verde); font-size: 13px; margin-top: 12px; text-align: center; }

  /* SECCIÓN TÍTULO */
  .section-title {
    font-family: 'Bebas Neue', cursive;
    font-size: 28px;
    color: var(--texto);
    letter-spacing: 2px;
    margin-bottom: 8px;
  }
  .section-sub { color: var(--texto2); font-size: 14px; margin-bottom: 28px; }

  /* PARTIDOS */
  .fase-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--texto2);
    margin-bottom: 12px;
    margin-top: 28px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--borde);
  }
  .partido-card {
    background: var(--fondo2);
    border: 1px solid var(--borde);
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }
  .partido-card:hover { border-color: #2a4035; }
  .partido-card.con-pick { border-left: 3px solid var(--verde); }
  .partido-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .partido-fecha { font-size: 12px; color: var(--texto2); }
  .partido-grupo { font-size: 11px; background: var(--fondo3); border: 1px solid var(--borde); padding: 3px 10px; border-radius: 20px; color: var(--texto2); }
  .partido-equipos { display: flex; align-items: center; gap: 16px; }
  .equipo-nombre { flex: 1; font-size: 17px; font-weight: 600; }
  .equipo-nombre.visitante { text-align: right; }
  .vs { color: var(--texto2); font-size: 13px; font-weight: 300; flex-shrink: 0; }

  /* PICK INPUTS */
  .pick-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--borde); }
  .pick-label { font-size: 12px; color: var(--texto2); flex: 1; }
  .score-inputs { display: flex; align-items: center; gap: 8px; }
  .score-input {
    width: 52px;
    background: var(--fondo3);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 10px;
    color: var(--texto);
    font-family: 'Bebas Neue', cursive;
    font-size: 22px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s;
  }
  .score-input:focus { border-color: var(--verde); }
  .score-sep { color: var(--texto2); font-size: 20px; font-family: 'Bebas Neue', cursive; }

  /* CLASIFICADO */
  .clasificado-row { margin-top: 12px; display: flex; align-items: center; gap: 12px; }
  .clasificado-label { font-size: 12px; color: var(--texto2); }
  .clasificado-btns { display: flex; gap: 8px; }
  .clas-btn {
    background: var(--fondo3);
    border: 1px solid var(--borde);
    color: var(--texto2);
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .clas-btn.active { background: var(--verde); border-color: var(--verde); color: #000; font-weight: 600; }

  /* PUNTAJE BADGE */
  .puntos-badge {
    background: var(--verde);
    color: #000;
    font-family: 'Bebas Neue', cursive;
    font-size: 18px;
    padding: 4px 12px;
    border-radius: 6px;
    letter-spacing: 1px;
  }
  .puntos-badge.cero { background: var(--fondo3); color: var(--texto2); }

  /* GUARDAR BTN */
  .btn-guardar {
    background: var(--verde);
    color: #000;
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-family: 'Bebas Neue', cursive;
    font-size: 16px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 8px;
  }
  .btn-guardar:hover { background: var(--verde-dark); }
  .save-confirm { font-size: 13px; color: var(--verde); margin-top: 8px; }

  /* TABLA */
  .tabla-wrap { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 12px; overflow: hidden; }
  .tabla { width: 100%; border-collapse: collapse; }
  .tabla th { background: var(--fondo3); padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--texto2); font-weight: 600; }
  .tabla td { padding: 14px 16px; border-top: 1px solid var(--borde); font-size: 15px; }
  .tabla tr:hover td { background: var(--fondo3); }
  .pos-num { font-family: 'Bebas Neue', cursive; font-size: 20px; color: var(--texto2); }
  .pos-1 .pos-num { color: var(--oro); }
  .pos-2 .pos-num { color: #c0c0c0; }
  .pos-3 .pos-num { color: #cd7f32; }
  .pts-total { font-family: 'Bebas Neue', cursive; font-size: 22px; color: var(--verde); }
  .pending-badge { font-size: 11px; background: var(--fondo3); border: 1px solid var(--borde); padding: 3px 10px; border-radius: 20px; color: var(--oro); }

  /* ADMIN */
  .admin-section { margin-bottom: 40px; }
  .admin-card { background: var(--fondo2); border: 1px solid var(--borde); border-radius: 12px; padding: 20px 24px; margin-bottom: 10px; }
  .admin-user-row { display: flex; align-items: center; justify-content: space-between; }
  .admin-user-info { }
  .admin-user-nombre { font-size: 16px; font-weight: 500; }
  .admin-user-email { font-size: 13px; color: var(--texto2); margin-top: 2px; }
  .estado-badge { font-size: 11px; padding: 4px 12px; border-radius: 20px; font-weight: 600; }
  .estado-aprobado { background: rgba(0,196,106,0.15); color: var(--verde); }
  .estado-pendiente { background: rgba(245,197,24,0.15); color: var(--oro); }
  .btn-aprobar {
    background: var(--verde);
    color: #000;
    border: none;
    border-radius: 6px;
    padding: 8px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn-aprobar:hover { background: var(--verde-dark); }
  .btn-rechazar {
    background: none;
    color: var(--rojo);
    border: 1px solid var(--rojo);
    border-radius: 6px;
    padding: 8px 18px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 8px;
  }
  .resultado-inputs { display: flex; align-items: center; gap: 12px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--borde); }
  .resultado-input {
    width: 60px;
    background: var(--fondo3);
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 10px;
    color: var(--texto);
    font-family: 'Bebas Neue', cursive;
    font-size: 22px;
    text-align: center;
    outline: none;
    transition: border-color 0.2s;
  }
  .resultado-input:focus { border-color: var(--oro); }
  .btn-cargar-res {
    background: var(--oro);
    color: #000;
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-family: 'Bebas Neue', cursive;
    font-size: 15px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .btn-cargar-res:hover { opacity: 0.85; }
  .resultado-cargado { font-family: 'Bebas Neue', cursive; font-size: 28px; color: var(--oro); letter-spacing: 2px; }

  /* EMPTY STATE */
  .empty { text-align: center; padding: 60px 24px; color: var(--texto2); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
  .empty-text { font-size: 16px; }

  /* PENDIENTE APROBACIÓN */
  .pendiente-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .pendiente-card {
    background: var(--fondo2);
    border: 1px solid var(--borde);
    border-radius: 16px;
    padding: 48px 40px;
    text-align: center;
    max-width: 420px;
  }
  .pendiente-icon { font-size: 52px; margin-bottom: 20px; }
  .pendiente-title { font-family: 'Bebas Neue', cursive; font-size: 28px; color: var(--oro); letter-spacing: 2px; margin-bottom: 12px; }
  .pendiente-text { color: var(--texto2); font-size: 15px; line-height: 1.6; }

  @media (max-width: 600px) {
    .main { padding: 24px 16px; }
    .login-card { padding: 36px 24px; }
    .partido-equipos { gap: 8px; }
    .equipo-nombre { font-size: 14px; }
  }
`;

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usuarios, setUsuarios] = useState(USUARIOS_MOCK);

  const handleLogin = () => {
    const u = usuarios.find(u => u.email === email && u.password === password);
    if (!u) { setError("Email o contraseña incorrectos"); return; }
    onLogin(u, usuarios, setUsuarios);
  };

  const handleRegistro = () => {
    if (!nombre || !email || !password) { setError("Completá todos los campos"); return; }
    if (usuarios.find(u => u.email === email)) { setError("Ya existe una cuenta con ese email"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    const nuevo = { id: `u${Date.now()}`, nombre, email, password, aprobado: false, esAdmin: false };
    setUsuarios(prev => [...prev, nuevo]);
    setError("");
    setSuccess("¡Registro exitoso! Tu cuenta está pendiente de aprobación.");
    setTab("login");
    setNombre(""); setEmail(""); setPassword("");
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
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}
            <button className="btn-primary" onClick={handleLogin}>ENTRAR</button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="btn-primary" onClick={handleRegistro}>REGISTRARSE</button>
          </>
        )}
        <div style={{ marginTop: 20, fontSize: 12, color: "var(--texto2)", textAlign: "center" }}>
          Demo: pablo@enard.com / admin123
        </div>
      </div>
    </div>
  );
}

function PartidoCard({ partido, pick, onPickChange, esAdmin, resultado, onResultadoChange }) {
  const [localPick, setLocalPick] = useState(pick || { golesLocal: "", golesVisitante: "", clasificado: null });
  const [saved, setSaved] = useState(false);
  const [adminLocal, setAdminLocal] = useState("");
  const [adminVisitante, setAdminVisitante] = useState("");
  const [adminClasificado, setAdminClasificado] = useState(null);

  const tienePick = localPick.golesLocal !== "" && localPick.golesVisitante !== "";
  const esEliminatoria = partido.fase !== "Grupos";

  // determinar si hay empate en el pick para mostrar clasificado
  const hayEmpate = tienePick && localPick.golesLocal === localPick.golesVisitante;

  const handleSave = () => {
    if (!tienePick) return;
    onPickChange(partido.id, localPick);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const pts = resultado ? calcularPuntos(localPick, resultado, partido.fase) : null;

  return (
    <div className={`partido-card ${tienePick ? "con-pick" : ""}`}>
      <div className="partido-meta">
        <span className="partido-fecha">{partido.fecha} · {partido.hora}</span>
        {partido.grupo && <span className="partido-grupo">Grupo {partido.grupo}</span>}
        {!partido.grupo && <span className="partido-grupo">{partido.fase}</span>}
      </div>
      <div className="partido-equipos">
        <span className="equipo-nombre">{partido.local}</span>
        <span className="vs">VS</span>
        <span className="equipo-nombre visitante">{partido.visitante}</span>
      </div>

      {resultado && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--texto2)" }}>Resultado:</span>
          <span className="resultado-cargado">{resultado.golesLocal} - {resultado.golesVisitante}</span>
          {pts !== null && (
            <span className={`puntos-badge ${pts === 0 ? "cero" : ""}`}>{pts} pts</span>
          )}
        </div>
      )}

      {!esAdmin && (
        <div className="pick-row">
          <span className="pick-label">Tu pronóstico</span>
          <div className="score-inputs">
            <input
              className="score-input"
              type="number"
              min="0"
              max="20"
              value={localPick.golesLocal}
              onChange={e => setLocalPick(p => ({ ...p, golesLocal: e.target.value === "" ? "" : Number(e.target.value) }))}
              placeholder="0"
            />
            <span className="score-sep">-</span>
            <input
              className="score-input"
              type="number"
              min="0"
              max="20"
              value={localPick.golesVisitante}
              onChange={e => setLocalPick(p => ({ ...p, golesVisitante: e.target.value === "" ? "" : Number(e.target.value) }))}
              placeholder="0"
            />
          </div>
          <button className="btn-guardar" onClick={handleSave}>GUARDAR</button>
          {saved && <span className="save-confirm">✓ Guardado</span>}
        </div>
      )}

      {!esAdmin && esEliminatoria && hayEmpate && (
        <div className="clasificado-row">
          <span className="clasificado-label">¿Quién clasifica?</span>
          <div className="clasificado-btns">
            <button className={`clas-btn ${localPick.clasificado === partido.local ? "active" : ""}`} onClick={() => setLocalPick(p => ({ ...p, clasificado: partido.local }))}>{partido.local}</button>
            <button className={`clas-btn ${localPick.clasificado === partido.visitante ? "active" : ""}`} onClick={() => setLocalPick(p => ({ ...p, clasificado: partido.visitante }))}>{partido.visitante}</button>
          </div>
        </div>
      )}

      {esAdmin && (
        <div className="resultado-inputs">
          <span style={{ fontSize: 12, color: "var(--texto2)" }}>Cargar resultado:</span>
          <input className="resultado-input" type="number" min="0" placeholder="0" value={adminLocal} onChange={e => setAdminLocal(e.target.value)} />
          <span style={{ color: "var(--texto2)", fontFamily: "'Bebas Neue'" }}>-</span>
          <input className="resultado-input" type="number" min="0" placeholder="0" value={adminVisitante} onChange={e => setAdminVisitante(e.target.value)} />
          {esEliminatoria && (
            <>
              <span style={{ fontSize: 12, color: "var(--texto2)" }}>Clasifica:</span>
              <div className="clasificado-btns">
                <button className={`clas-btn ${adminClasificado === partido.local ? "active" : ""}`} onClick={() => setAdminClasificado(partido.local)}>{partido.local}</button>
                <button className={`clas-btn ${adminClasificado === partido.visitante ? "active" : ""}`} onClick={() => setAdminClasificado(partido.visitante)}>{partido.visitante}</button>
              </div>
            </>
          )}
          <button className="btn-cargar-res" onClick={() => {
            if (adminLocal === "" || adminVisitante === "") return;
            onResultadoChange(partido.id, { golesLocal: Number(adminLocal), golesVisitante: Number(adminVisitante), clasificado: adminClasificado });
          }}>CARGAR</button>
        </div>
      )}
    </div>
  );
}

function TabPartidos({ usuario, partidos, picks, onPickChange, resultados }) {
  const fases = [...new Set(partidos.map(p => p.fase))];
  return (
    <div>
      <div className="section-title">PARTIDOS</div>
      <div className="section-sub">Cargá tus pronósticos antes del inicio de cada partido</div>
      {fases.map(fase => (
        <div key={fase}>
          <div className="fase-label">{fase}</div>
          {partidos.filter(p => p.fase === fase).map(p => (
            <PartidoCard
              key={p.id}
              partido={p}
              pick={picks[usuario.id]?.[p.id]}
              onPickChange={onPickChange}
              esAdmin={false}
              resultado={resultados[p.id]}
              onResultadoChange={() => {}}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TabTabla({ usuarios, picks, resultados, partidos }) {
  const aprobados = usuarios.filter(u => u.aprobado && !u.esAdmin);

  const calcTotal = (userId) => {
    let total = 0;
    partidos.forEach(p => {
      const pick = picks[userId]?.[p.id];
      const res = resultados[p.id];
      if (pick && res) total += calcularPuntos(pick, res, p.fase);
    });
    return total;
  };

  const tabla = aprobados
    .map(u => ({ ...u, pts: calcTotal(u.id) }))
    .sort((a, b) => b.pts - a.pts);

  if (tabla.length === 0) return (
    <div className="empty">
      <div className="empty-icon">🏆</div>
      <div className="empty-text">Aún no hay participantes aprobados</div>
    </div>
  );

  return (
    <div>
      <div className="section-title">TABLA DE POSICIONES</div>
      <div className="section-sub">Actualizada en tiempo real con cada resultado</div>
      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {tabla.map((u, i) => (
              <tr key={u.id} className={`pos-${i + 1}`}>
                <td><span className="pos-num">{i + 1}</span></td>
                <td>{u.nombre}</td>
                <td><span className="pts-total">{u.pts}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabAdmin({ usuarios, setUsuarios, partidos, resultados, onResultadoChange }) {
  const pendientes = usuarios.filter(u => !u.aprobado && !u.esAdmin);
  const aprobados = usuarios.filter(u => u.aprobado && !u.esAdmin);

  return (
    <div>
      <div className="section-title">PANEL DE ADMINISTRACIÓN</div>

      <div className="admin-section">
        <div className="fase-label">Usuarios pendientes de aprobación ({pendientes.length})</div>
        {pendientes.length === 0 && <div style={{ color: "var(--texto2)", fontSize: 14, padding: "16px 0" }}>No hay solicitudes pendientes</div>}
        {pendientes.map(u => (
          <div key={u.id} className="admin-card">
            <div className="admin-user-row">
              <div className="admin-user-info">
                <div className="admin-user-nombre">{u.nombre}</div>
                <div className="admin-user-email">{u.email}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="estado-badge estado-pendiente">Pendiente</span>
                <button className="btn-aprobar" onClick={() => setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, aprobado: true } : x))}>Aprobar</button>
                <button className="btn-rechazar" onClick={() => setUsuarios(prev => prev.filter(x => x.id !== u.id))}>Rechazar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="fase-label">Usuarios aprobados ({aprobados.length})</div>
        {aprobados.map(u => (
          <div key={u.id} className="admin-card">
            <div className="admin-user-row">
              <div className="admin-user-info">
                <div className="admin-user-nombre">{u.nombre}</div>
                <div className="admin-user-email">{u.email}</div>
              </div>
              <span className="estado-badge estado-aprobado">Aprobado</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="fase-label">Cargar resultados</div>
        {partidos.map(p => (
          <PartidoCard
            key={p.id}
            partido={p}
            pick={null}
            onPickChange={() => {}}
            esAdmin={true}
            resultado={resultados[p.id]}
            onResultadoChange={onResultadoChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ─────────────────────────────────────────────────────────────
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState(USUARIOS_MOCK);
  const [partidos] = useState(PARTIDOS_GRUPOS);
  const [picks, setPicks] = useState(PICKS_MOCK);
  const [resultados, setResultados] = useState({});
  const [tab, setTab] = useState("partidos");

  const handleLogin = (u, todosUsuarios, setTodosUsuarios) => {
    setUsuario(u);
    setUsuarios(todosUsuarios);
  };

  const handlePickChange = (partidoId, pick) => {
    setPicks(prev => ({
      ...prev,
      [usuario.id]: { ...(prev[usuario.id] || {}), [partidoId]: pick }
    }));
  };

  const handleResultadoChange = (partidoId, resultado) => {
    setResultados(prev => ({ ...prev, [partidoId]: resultado }));
  };

  if (!usuario) return (
    <>
      <style>{css}</style>
      <Login onLogin={handleLogin} />
    </>
  );

  if (!usuario.aprobado) return (
    <>
      <style>{css}</style>
      <div className="pendiente-wrap">
        <div className="pendiente-card">
          <div className="pendiente-icon">⏳</div>
          <div className="pendiente-title">CUENTA PENDIENTE</div>
          <div className="pendiente-text">Tu registro está siendo revisado por el administrador. Te avisarán cuando tu cuenta esté aprobada.</div>
          <button className="btn-logout" style={{ marginTop: 24 }} onClick={() => setUsuario(null)}>Volver</button>
        </div>
      </div>
    </>
  );

  const tabs = [
    { id: "partidos", label: "Partidos" },
    { id: "tabla", label: "Tabla" },
    ...(usuario.esAdmin ? [{ id: "admin", label: "⚙️ Admin" }] : []),
  ];

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="header">
          <div className="header-logo">PRODE <span>MUNDIAL</span></div>
          <div className="header-user">
            <span className="header-name">{usuario.nombre}</span>
            <button className="btn-logout" onClick={() => setUsuario(null)}>Salir</button>
          </div>
        </header>
        <nav className="nav">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <main className="main">
          {tab === "partidos" && <TabPartidos usuario={usuario} partidos={partidos} picks={picks} onPickChange={handlePickChange} resultados={resultados} />}
          {tab === "tabla" && <TabTabla usuarios={usuarios} picks={picks} resultados={resultados} partidos={partidos} />}
          {tab === "admin" && usuario.esAdmin && <TabAdmin usuarios={usuarios} setUsuarios={setUsuarios} partidos={partidos} resultados={resultados} onResultadoChange={handleResultadoChange} />}
        </main>
      </div>
    </>
  );
}
