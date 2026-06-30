import { useState, useEffect, useCallback, useMemo } from "react";

// ─── INITIAL DATA ────────────────────────────────────────────────────────────
const BUILT_IN_MEDICINES = [
  "Aconite", "Allium Cepa", "Apis Mellifica", "Argentum Nitricum", "Arnica Montana",
  "Arsenicum Album", "Belladonna", "Bryonia Alba", "Calcarea Carbonica", "Calcarea Phosphorica",
  "Calendula", "Cantharis", "Carbo Vegetabilis", "Causticum", "Chamomilla",
  "China Officinalis", "Cocculus Indicus", "Coffea Cruda", "Colocynthis", "Drosera",
  "Dulcamara", "Euphrasia", "Ferrum Phosphoricum", "Gelsemium", "Graphites",
  "Hepar Sulphuris", "Hypericum", "Ignatia Amara", "Ipecacuanha", "Kali Bichromicum",
  "Kali Carbonicum", "Kali Phosphoricum", "Lachesis", "Ledum Palustre", "Lycopodium",
  "Magnesia Phosphorica", "Mercurius Solubilis", "Natrum Muriaticum", "Natrum Sulphuricum",
  "Nux Vomica", "Phosphorus", "Phytolacca", "Pulsatilla", "Rhus Toxicodendron",
  "Ruta Graveolens", "Sepia", "Silicea", "Spongia Tosta", "Staphysagria",
  "Sulphur", "Symphytum", "Thuja Occidentalis", "Veratrum Album", "Zincum Metallicum"
];

const POTENCIES = ["6C", "12C", "30C", "200C", "1M", "10M", "50M", "CM", "LM1", "LM2", "LM3", "Q"];

const DEFAULT_PIN = "1234";

const generateId = () => {
  const now = new Date();
  const prefix = "P";
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${ts}${rand}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const todayISO = () => new Date().toISOString().split("T")[0];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const storage = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  // Layout
  app: { fontFamily: "'Inter', system-ui, sans-serif", background: "#F5F7FA", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" },
  screen: { minHeight: "100vh", background: "#F5F7FA", paddingBottom: 24 },
  
  // Header
  header: { background: "#1565C0", color: "#fff", padding: "16px 20px 14px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(21,101,192,0.25)" },
  headerTitle: { fontSize: 18, fontWeight: 700, flex: 1, letterSpacing: 0.2 },
  backBtn: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 18, cursor: "pointer", lineHeight: 1 },
  headerAction: { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  // Cards
  card: { background: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", border: "1px solid #EEF1F6" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#6B7280", lineHeight: 1.5 },

  // Inputs
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 },
  input: { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1.5px solid #D1D9E6", fontSize: 16, background: "#fff", color: "#111", outline: "none", boxSizing: "border-box", WebkitAppearance: "none" },
  inputFocus: { border: "1.5px solid #1565C0" },
  select: { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1.5px solid #D1D9E6", fontSize: 16, background: "#fff", color: "#111", outline: "none", boxSizing: "border-box", appearance: "none" },
  textarea: { width: "100%", padding: "13px 14px", borderRadius: 10, border: "1.5px solid #D1D9E6", fontSize: 15, background: "#fff", color: "#111", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80, fontFamily: "inherit" },
  field: { marginBottom: 16 },

  // Buttons
  btnPrimary: { display: "block", width: "100%", background: "#1565C0", color: "#fff", border: "none", borderRadius: 12, padding: "16px", fontSize: 17, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, textAlign: "center" },
  btnSecondary: { display: "block", width: "100%", background: "#EEF3FB", color: "#1565C0", border: "1.5px solid #1565C0", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "center" },
  btnDanger: { display: "block", width: "100%", background: "#FEE2E2", color: "#B91C1C", border: "1.5px solid #FCA5A5", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "center" },
  btnSmall: { background: "#1565C0", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnSmallGhost: { background: "#EEF3FB", color: "#1565C0", border: "1.5px solid #C7D9F5", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  // Dashboard tiles
  tile: { background: "#fff", borderRadius: 16, padding: "22px 18px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #EEF1F6", cursor: "pointer", marginBottom: 12 },
  tileIcon: { fontSize: 28, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14, flexShrink: 0 },
  tileText: { fontSize: 17, fontWeight: 700, color: "#1A1A2E" },
  tileSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  // Misc
  divider: { height: 1, background: "#EEF1F6", margin: "12px 0" },
  badge: { display: "inline-block", background: "#EEF3FB", color: "#1565C0", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 },
  badgeRed: { display: "inline-block", background: "#FEE2E2", color: "#B91C1C", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 },
  badgeGreen: { display: "inline-block", background: "#D1FAE5", color: "#065F46", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 },
  row: { display: "flex", alignItems: "center", gap: 10 },
  spaceBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  sectionPad: { padding: "0 16px" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.8, padding: "16px 16px 8px" },
  emptyState: { textAlign: "center", padding: "48px 24px", color: "#9CA3AF" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: 600, color: "#6B7280" },
  emptySub: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  amtPos: { color: "#B91C1C", fontWeight: 700 },
  amtZero: { color: "#065F46", fontWeight: 700 },
  pinDot: { width: 16, height: 16, borderRadius: "50%", background: "#1565C0", display: "inline-block", margin: "0 6px" },
  pinDotEmpty: { width: 16, height: 16, borderRadius: "50%", border: "2px solid #C7D9F5", display: "inline-block", margin: "0 6px" },
  pinKey: { width: 72, height: 72, borderRadius: 16, border: "1.5px solid #D1D9E6", background: "#fff", fontSize: 24, fontWeight: 700, cursor: "pointer", color: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  pinGrid: { display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 12, justifyContent: "center", margin: "24px 0" },
};

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useLocalState(key, initial) {
  const [val, setVal] = useState(() => storage.get(key, initial));
  const save = useCallback((v) => {
    const next = typeof v === "function" ? v(val) : v;
    setVal(next);
    storage.set(key, next);
  }, [key, val]);
  return [val, save];
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Header({ title, onBack, action }) {
  return (
    <div style={S.header}>
      {onBack && <button style={S.backBtn} onClick={onBack}>←</button>}
      <span style={S.headerTitle}>{title}</span>
      {action && <button style={S.headerAction} onClick={action.fn}>{action.label}</button>}
    </div>
  );
}

function Field({ label, children }) {
  return <div style={S.field}><label style={S.label}>{label}</label>{children}</div>;
}

function Input({ value, onChange, placeholder, type = "text", readOnly }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ ...S.input, ...(focus ? S.inputFocus : {}), ...(readOnly ? { background: "#F5F7FA", color: "#6B7280" } : {}) }}
    />
  );
}

function MedicineInput({ value, onChange, medicines, onAddNew }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");

  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    return medicines
      .filter(m => m.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => (b.uses || 0) - (a.uses || 0))
      .slice(0, 6);
  }, [q, medicines]);

  const notFound = q.trim().length > 1 && suggestions.length === 0;

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={q}
        onChange={e => { setQ(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder="Type medicine name…"
        style={S.input}
      />
      {open && q.trim().length > 0 && (
        <div style={{ position: "absolute", zIndex: 50, background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", left: 0, right: 0, top: "calc(100% + 4px)", overflow: "hidden", border: "1px solid #EEF1F6" }}>
          {suggestions.map((m, i) => (
            <div key={i} onMouseDown={() => { setQ(m.name); onChange(m.name); setOpen(false); }}
              style={{ padding: "12px 16px", cursor: "pointer", fontSize: 15, borderBottom: i < suggestions.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{m.name}</span>
              {m.uses > 0 && <span style={{ fontSize: 11, color: "#9CA3AF" }}>used {m.uses}×</span>}
            </div>
          ))}
          {notFound && (
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 8 }}>Medicine not found.</div>
              <button style={S.btnSmall} onMouseDown={() => { onAddNew(q); setOpen(false); }}>+ Add "{q}"</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#1A1A2E", color: "#fff", borderRadius: 12, padding: "12px 22px", fontSize: 15, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 16px rgba(0,0,0,0.25)", whiteSpace: "nowrap" }}>
      {msg}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ ...S.spaceBetween, marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 15, cursor: "pointer", color: "#6B7280", fontWeight: 700 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── SCREENS ─────────────────────────────────────────────────────────────────

// LOGIN
function LoginScreen({ onLogin }) {
  const [pin] = useLocalState("hc_pin", DEFAULT_PIN);
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  const press = (k) => {
    if (k === "del") { setEntered(p => p.slice(0, -1)); setError(false); return; }
    if (entered.length >= 4) return;
    const next = entered + k;
    setEntered(next);
    if (next.length === 4) {
      if (next === pin) { setTimeout(() => onLogin(), 120); }
      else { setError(true); setTimeout(() => setEntered(""), 600); }
    }
  };

  const keys = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","del"]];

  return (
    <div style={{ ...S.screen, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#1565C0", marginBottom: 4 }}>HomeoClinic</div>
      <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 40 }}>Doctor's Private Register</div>
      <div style={{ marginBottom: 8 }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={i < entered.length ? S.pinDot : S.pinDotEmpty} />
        ))}
      </div>
      {error && <div style={{ color: "#B91C1C", fontSize: 14, fontWeight: 600, marginTop: 8 }}>Wrong PIN. Try again.</div>}
      <div style={S.pinGrid}>
        {keys.flat().map((k, i) => (
          <div key={i} onClick={() => k && press(k)} style={{ ...S.pinKey, ...(k === "" ? { background: "transparent", border: "none", boxShadow: "none", cursor: "default" } : {}), ...(error ? { borderColor: "#FCA5A5" } : {}) }}>
            {k === "del" ? "⌫" : k}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#C4C9D4", marginTop: 16 }}>Default PIN: 1234</div>
    </div>
  );
}

// DASHBOARD
function Dashboard({ patients, onNav }) {
  const pendingCount = patients.filter(p => (p.balance || 0) > 0).length;

  const tiles = [
    { icon: "👤", label: "New Patient", sub: "Register a new patient", screen: "new_patient", bg: "#EEF3FB" },
    { icon: "🔍", label: "Search Patient", sub: "Find by name, ID or mobile", screen: "search", bg: "#F0FDF4" },
    { icon: "💰", label: "Pending Balance", sub: `${pendingCount} patient${pendingCount !== 1 ? "s" : ""} with dues`, screen: "pending", bg: "#FFF7ED" },
    { icon: "💾", label: "Backup", sub: "Export or restore your data", screen: "backup", bg: "#F5F3FF" },
    { icon: "⚙️", label: "Settings", sub: "PIN, medicines, preferences", screen: "settings", bg: "#FDF2F8" },
  ];

  return (
    <div style={S.screen}>
      <div style={{ ...S.header, flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>🌿 HomeoClinic</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{patients.length} patients registered</div>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        {tiles.map(t => (
          <div key={t.screen} style={S.tile} onClick={() => onNav(t.screen)}>
            <div style={{ ...S.tileIcon, background: t.bg }}>{t.icon}</div>
            <div>
              <div style={S.tileText}>{t.label}</div>
              <div style={S.tileSub}>{t.sub}</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#C4C9D4", fontSize: 20 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// NEW PATIENT
function NewPatientScreen({ onBack, onSave }) {
  const id = useMemo(() => generateId(), []);
  const [form, setForm] = useState({ name: "", age: "", gender: "", mobile: "", address: "", complaint: "" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const canSave = form.name.trim() && form.age && form.gender;

  const save = () => {
    if (!canSave) return;
    onSave({
      id, name: form.name.trim(), age: form.age, gender: form.gender,
      mobile: form.mobile.trim(), address: form.address.trim(),
      complaint: form.complaint.trim(), regDate: todayISO(),
      visits: [], balance: 0,
    });
  };

  return (
    <div style={S.screen}>
      <Header title="New Patient" onBack={onBack} />
      <div style={{ padding: "16px 16px 0" }}>
        <Field label="Patient ID">
          <Input value={id} readOnly />
        </Field>
        <Field label="Full Name *">
          <Input value={form.name} onChange={set("name")} placeholder="Patient's full name" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Age *">
            <Input value={form.age} onChange={set("age")} placeholder="e.g. 34" type="number" />
          </Field>
          <Field label="Gender *">
            <select value={form.gender} onChange={e => set("gender")(e.target.value)} style={S.select}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
        </div>
        <Field label="Mobile Number">
          <Input value={form.mobile} onChange={set("mobile")} placeholder="10-digit mobile" type="tel" />
        </Field>
        <Field label="Address">
          <Input value={form.address} onChange={set("address")} placeholder="City / Area" />
        </Field>
        <Field label="Chief Complaint">
          <textarea value={form.complaint} onChange={e => set("complaint")(e.target.value)} placeholder="Main symptoms / reason for visit…" style={S.textarea} />
        </Field>
        <Field label="Registration Date">
          <Input value={formatDate(todayISO())} readOnly />
        </Field>
        <button style={{ ...S.btnPrimary, opacity: canSave ? 1 : 0.5 }} onClick={save}>Save Patient</button>
        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}

// SEARCH
function SearchScreen({ patients, onBack, onSelect }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return patients.filter(p =>
      p.id.toLowerCase().includes(t) ||
      p.name.toLowerCase().includes(t) ||
      (p.mobile || "").includes(t)
    ).slice(0, 30);
  }, [q, patients]);

  return (
    <div style={S.screen}>
      <Header title="Search Patient" onBack={onBack} />
      <div style={{ padding: "16px 16px 8px" }}>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Name, Patient ID or Mobile…"
          style={{ ...S.input, fontSize: 17, padding: "14px 16px" }}
        />
      </div>
      {q.trim().length === 0 && (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🔍</div>
          <div style={S.emptyText}>Search patients</div>
          <div style={S.emptySub}>Type name, ID, or mobile number</div>
        </div>
      )}
      {q.trim().length > 0 && results.length === 0 && (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>😶</div>
          <div style={S.emptyText}>No patients found</div>
          <div style={S.emptySub}>Try a different name or ID</div>
        </div>
      )}
      <div style={{ padding: "0 16px" }}>
        {results.map(p => (
          <PatientCard key={p.id} patient={p} onClick={() => onSelect(p)} />
        ))}
      </div>
    </div>
  );
}

function PatientCard({ patient: p, onClick }) {
  const lastVisit = p.visits?.length ? p.visits[p.visits.length - 1].date : null;
  return (
    <div style={{ ...S.card, cursor: "pointer" }} onClick={onClick}>
      <div style={S.spaceBetween}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E" }}>{p.name}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
            {p.id} · {p.age}y {p.gender} {p.mobile ? `· ${p.mobile}` : ""}
          </div>
        </div>
        {(p.balance || 0) > 0 && (
          <span style={S.badgeRed}>₹{p.balance}</span>
        )}
      </div>
      {lastVisit && <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>Last visit: {formatDate(lastVisit)}</div>}
    </div>
  );
}

// PATIENT PROFILE
function PatientProfile({ patient, onBack, onUpdate, medicines }) {
  const [tab, setTab] = useState("overview"); // overview | history
  const [showVisit, setShowVisit] = useState(false);
  const [toast, setToast] = useState(null);

  const addVisit = (visit) => {
    const prevBalance = patient.balance || 0;
    const newBalance = prevBalance + (parseFloat(visit.amount) || 0) - (parseFloat(visit.received) || 0);
    const newVisit = { ...visit, id: Date.now().toString(), date: todayISO(), balanceAfter: Math.max(0, newBalance) };
    const updated = {
      ...patient,
      visits: [...(patient.visits || []), newVisit],
      balance: Math.max(0, newBalance),
      lastVisit: todayISO(),
    };
    onUpdate(updated);
    setToast("Visit saved ✓");
    setShowVisit(false);
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "history", label: `History (${patient.visits?.length || 0})` },
  ];

  return (
    <div style={S.screen}>
      <Header title={patient.name} onBack={onBack} />

      {/* Patient summary strip */}
      <div style={{ background: "#1565C0", color: "#fff", padding: "14px 20px 16px" }}>
        <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
          <div><span style={{ opacity: 0.7 }}>ID </span>{patient.id}</div>
          <div><span style={{ opacity: 0.7 }}>Age </span>{patient.age} {patient.gender}</div>
          {patient.mobile && <div><span style={{ opacity: 0.7 }}>📞 </span>{patient.mobile}</div>}
        </div>
        {(patient.balance || 0) > 0 && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, opacity: 0.85 }}>Outstanding Balance</span>
            <span style={{ fontSize: 20, fontWeight: 800 }}>₹{patient.balance}</span>
          </div>
        )}
        {(patient.balance || 0) === 0 && (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>✓ No pending dues</div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1.5px solid #EEF1F6" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: "12px", border: "none", background: "transparent", fontSize: 14, fontWeight: 700, cursor: "pointer", color: tab === t.id ? "#1565C0" : "#6B7280", borderBottom: tab === t.id ? "2.5px solid #1565C0" : "2.5px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {tab === "overview" && (
          <>
            <div style={S.card}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>Patient Details</div>
              <Row label="Registered" value={formatDate(patient.regDate)} />
              <Row label="Chief Complaint" value={patient.complaint || "—"} />
              <Row label="Address" value={patient.address || "—"} />
              <Row label="Visits" value={patient.visits?.length || 0} />
              <Row label="Last Visit" value={formatDate(patient.lastVisit)} />
            </div>
            <button style={S.btnPrimary} onClick={() => setShowVisit(true)}>+ Add Follow-up Visit</button>
          </>
        )}

        {tab === "history" && (
          <>
            {(!patient.visits || patient.visits.length === 0) ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>📋</div>
                <div style={S.emptyText}>No visits yet</div>
                <div style={S.emptySub}>Add the first follow-up visit</div>
              </div>
            ) : (
              [...patient.visits].reverse().map((v, i) => (
                <VisitCard key={v.id || i} visit={v} />
              ))
            )}
            <button style={{ ...S.btnPrimary, marginTop: 12 }} onClick={() => setShowVisit(true)}>+ Add Follow-up Visit</button>
          </>
        )}
        <div style={{ height: 32 }} />
      </div>

      {showVisit && (
        <AddVisitModal
          patient={patient}
          medicines={medicines}
          onSave={addVisit}
          onClose={() => setShowVisit(false)}
        />
      )}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 13, color: "#6B7280" }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function VisitCard({ visit: v }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...S.card, marginBottom: 10 }}>
      <div style={{ ...S.spaceBetween, cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>{formatDate(v.date)}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{v.symptoms?.slice(0, 50) || "No symptoms noted"}{v.symptoms?.length > 50 ? "…" : ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 700, ...(v.balanceAfter > 0 ? { color: "#B91C1C" } : { color: "#065F46" }) }}>
            ₹{v.balanceAfter || 0}
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>balance</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          {v.symptoms && <Row label="Symptoms" value={v.symptoms} />}
          {v.notes && <Row label="Clinical Notes" value={v.notes} />}
          {v.medicine && <Row label="Medicine" value={v.medicine} />}
          {v.potency && <Row label="Potency" value={v.potency} />}
          {v.dose && <Row label="Dose / Duration" value={v.dose} />}
          <Row label="Amount" value={`₹${v.amount || 0}`} />
          <Row label="Paid" value={`₹${v.received || 0}`} />
          <Row label="Balance" value={`₹${v.balanceAfter || 0}`} />
        </div>
      )}
      <div style={{ fontSize: 12, color: "#C4C9D4", marginTop: 6, textAlign: "right" }}>{open ? "▲ hide" : "▼ details"}</div>
    </div>
  );
}

// ADD VISIT MODAL
function AddVisitModal({ patient, medicines, onSave, onClose }) {
  const prevBalance = patient.balance || 0;
  const [form, setForm] = useState({ symptoms: "", notes: "", medicine: "", potency: "", dose: "", amount: "", received: "" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const amount = parseFloat(form.amount) || 0;
  const received = parseFloat(form.received) || 0;
  const outstanding = prevBalance + amount - received;

  const save = () => onSave(form);

  const addMedicineToLib = (name) => {
    const existing = medicines.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      // handled by parent
    }
  };

  return (
    <Modal title="Add Follow-up Visit" onClose={onClose}>
      <Field label="Symptoms / Complaint">
        <textarea value={form.symptoms} onChange={e => set("symptoms")(e.target.value)} placeholder="Current symptoms…" style={{ ...S.textarea, minHeight: 70 }} />
      </Field>
      <Field label="Clinical Notes">
        <textarea value={form.notes} onChange={e => set("notes")(e.target.value)} placeholder="Observations, findings…" style={{ ...S.textarea, minHeight: 60 }} />
      </Field>
      <Field label="Medicine">
        <MedicineInput
          value={form.medicine}
          onChange={set("medicine")}
          medicines={medicines}
          onAddNew={(name) => { set("medicine")(name); addMedicineToLib(name); }}
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Potency">
          <select value={form.potency} onChange={e => set("potency")(e.target.value)} style={S.select}>
            <option value="">Select</option>
            {POTENCIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Dose / Duration">
          <Input value={form.dose} onChange={set("dose")} placeholder="e.g. 3×/day, 7d" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Amount (₹)">
          <Input value={form.amount} onChange={set("amount")} placeholder="0" type="number" />
        </Field>
        <Field label="Amount Received (₹)">
          <Input value={form.received} onChange={set("received")} placeholder="0" type="number" />
        </Field>
      </div>

      {/* Balance preview */}
      <div style={{ background: outstanding > 0 ? "#FEF2F2" : "#F0FDF4", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Balance Calculation</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Previous balance</span><span>₹{prevBalance}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>+ Current amount</span><span>₹{amount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>− Amount received</span><span>₹{received}</span>
          </div>
          <div style={{ height: 1, background: outstanding > 0 ? "#FECACA" : "#BBF7D0", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, color: outstanding > 0 ? "#B91C1C" : "#065F46" }}>
            <span>Outstanding</span><span>₹{Math.max(0, outstanding)}</span>
          </div>
        </div>
      </div>

      <button style={S.btnPrimary} onClick={save}>Save Visit</button>
    </Modal>
  );
}

// PENDING BALANCE
function PendingScreen({ patients, onBack, onSelect }) {
  const pending = patients.filter(p => (p.balance || 0) > 0).sort((a, b) => b.balance - a.balance);
  const total = pending.reduce((s, p) => s + (p.balance || 0), 0);

  return (
    <div style={S.screen}>
      <Header title="Pending Balance" onBack={onBack} />
      {pending.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>🎉</div>
          <div style={S.emptyText}>All clear!</div>
          <div style={S.emptySub}>No patients with pending dues</div>
        </div>
      ) : (
        <>
          <div style={{ background: "#B91C1C", color: "#fff", padding: "14px 20px" }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>Total Outstanding</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>₹{total}</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{pending.length} patients</div>
          </div>
          <div style={{ padding: "16px 16px 0" }}>
            {pending.map(p => (
              <div key={p.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => onSelect(p)}>
                <div style={S.spaceBetween}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{p.id} {p.mobile ? `· ${p.mobile}` : ""}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#B91C1C" }}>₹{p.balance}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// BACKUP SCREEN
function BackupScreen({ patients, medicines, onBack, onRestore, setToast }) {
  const exportData = () => {
    const data = { version: 1, exportedAt: new Date().toISOString(), patients, medicines };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `homeoclinic_backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast("Backup exported ✓");
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.patients && Array.isArray(data.patients)) {
          onRestore(data.patients, data.medicines || []);
          setToast(`Restored ${data.patients.length} patients ✓`);
        } else { setToast("Invalid backup file"); }
      } catch { setToast("Could not read file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={S.screen}>
      <Header title="Backup & Restore" onBack={onBack} />
      <div style={{ padding: "16px 16px 0" }}>
        <div style={S.card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Current Data</div>
          <Row label="Total Patients" value={patients.length} />
          <Row label="Total Medicines" value={medicines.length} />
          <Row label="Total Visits" value={patients.reduce((s, p) => s + (p.visits?.length || 0), 0)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>💾 Local Backup</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 14 }}>Download a JSON file of all your data. Keep it safe — restore anytime.</div>
          <button style={S.btnPrimary} onClick={exportData}>Export Backup File</button>
        </div>

        <div style={S.divider} />

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>📥 Restore Backup</div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 14 }}>This will replace all current data. Make sure to export first.</div>
          <label style={{ ...S.btnDanger, cursor: "pointer" }}>
            Select Backup File
            <input type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
          </label>
        </div>

        <div style={{ ...S.card, marginTop: 16, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ fontSize: 13, color: "#92400E" }}>ℹ️ This app works fully offline. Cloud backup is not needed — keep your backup file on Google Drive or WhatsApp for safety.</div>
        </div>
      </div>
    </div>
  );
}

// SETTINGS SCREEN
function SettingsScreen({ onBack, medicines, onMedicinesUpdate, setToast }) {
  const [pin, setPin] = useLocalState("hc_pin", DEFAULT_PIN);
  const [screen, setScreen] = useState("main"); // main | pin | medicine_lib
  const [newPin, setNewPin] = useState(["", ""]);
  const [medQ, setMedQ] = useState("");

  const filteredMeds = useMemo(() => {
    const t = medQ.trim().toLowerCase();
    if (!t) return medicines;
    return medicines.filter(m => m.name.toLowerCase().includes(t));
  }, [medQ, medicines]);

  if (screen === "pin") {
    return (
      <div style={S.screen}>
        <Header title="Change PIN" onBack={() => setScreen("main")} />
        <div style={{ padding: "24px 20px" }}>
          <Field label="New PIN (4 digits)">
            <Input value={newPin[0]} onChange={v => setNewPin([v, newPin[1]])} placeholder="New PIN" type="password" />
          </Field>
          <Field label="Confirm New PIN">
            <Input value={newPin[1]} onChange={v => setNewPin([newPin[0], v])} placeholder="Confirm PIN" type="password" />
          </Field>
          <button style={S.btnPrimary} onClick={() => {
            if (newPin[0].length < 4) return setToast("PIN must be 4 digits");
            if (newPin[0] !== newPin[1]) return setToast("PINs do not match");
            setPin(newPin[0]); setToast("PIN changed ✓"); setScreen("main");
          }}>Save New PIN</button>
        </div>
      </div>
    );
  }

  if (screen === "medicine_lib") {
    return (
      <div style={S.screen}>
        <Header title="Medicine Library" onBack={() => setScreen("main")} action={{ label: "Done", fn: () => setScreen("main") }} />
        <div style={{ padding: "12px 16px" }}>
          <input value={medQ} onChange={e => setMedQ(e.target.value)} placeholder="Search medicines…" style={{ ...S.input, marginBottom: 12 }} />
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>{filteredMeds.length} medicines</div>
          {filteredMeds.map((m, i) => (
            <div key={i} style={{ ...S.card, padding: "12px 16px", ...S.spaceBetween, marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</span>
              <div style={{ ...S.row, gap: 8 }}>
                {m.uses > 0 && <span style={{ fontSize: 12, color: "#9CA3AF" }}>{m.uses}×</span>}
                {!m.builtin && (
                  <button onClick={() => {
                    onMedicinesUpdate(medicines.filter((_, idx) => idx !== medicines.indexOf(m)));
                    setToast("Medicine removed");
                  }} style={{ background: "#FEE2E2", border: "none", color: "#B91C1C", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <Header title="Settings" onBack={onBack} />
      <div style={{ padding: "16px 16px 0" }}>
        {[
          { icon: "🔐", label: "Change PIN", fn: () => setScreen("pin") },
          { icon: "💊", label: "Medicine Library", sub: `${medicines.length} medicines`, fn: () => setScreen("medicine_lib") },
        ].map((item, i) => (
          <div key={i} style={{ ...S.tile, marginBottom: 10 }} onClick={item.fn}>
            <div style={{ fontSize: 24 }}>{item.icon}</div>
            <div>
              <div style={S.tileText}>{item.label}</div>
              {item.sub && <div style={S.tileSub}>{item.sub}</div>}
            </div>
            <div style={{ marginLeft: "auto", color: "#C4C9D4", fontSize: 20 }}>›</div>
          </div>
        ))}
        <div style={{ ...S.card, marginTop: 8, background: "#F8FAFF" }}>
          <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center" }}>HomeoClinic v1.0<br />All data stored locally on this device</div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const [patients, setPatients] = useLocalState("hc_patients", []);
  const [medicines, setMedicines] = useLocalState("hc_medicines", () =>
    BUILT_IN_MEDICINES.map(name => ({ name, uses: 0, builtin: true }))
  );

  const showToast = (msg) => setToast(msg);

  const go = (s, data = null) => { setScreen(s); if (data) setSelected(data); };

  const savePatient = (patient) => {
    setPatients(prev => [...prev, patient]);
    showToast(`${patient.name} registered ✓`);
    go("search");
  };

  const updatePatient = (updated) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  };

  const addMedicineToLib = useCallback((name) => {
    setMedicines(prev => {
      const exists = prev.find(m => m.name.toLowerCase() === name.toLowerCase());
      if (!exists) return [...prev, { name, uses: 1, builtin: false }];
      return prev.map(m => m.name.toLowerCase() === name.toLowerCase() ? { ...m, uses: (m.uses || 0) + 1 } : m);
    });
  }, [setMedicines]);

  const medicinesWithUsage = useMemo(() => medicines.sort((a, b) => (b.uses || 0) - (a.uses || 0)), [medicines]);

  if (!auth) return <LoginScreen onLogin={() => setAuth(true)} />;

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <Dashboard patients={patients} onNav={go} />;
      case "new_patient":
        return <NewPatientScreen onBack={() => go("dashboard")} onSave={savePatient} />;
      case "search":
        return <SearchScreen patients={patients} onBack={() => go("dashboard")} onSelect={p => go("profile", p)} />;
      case "profile":
        return selected ? (
          <PatientProfile
            patient={patients.find(p => p.id === selected.id) || selected}
            onBack={() => go("search")}
            onUpdate={updatePatient}
            medicines={medicinesWithUsage}
            addMedicine={addMedicineToLib}
          />
        ) : null;
      case "pending":
        return <PendingScreen patients={patients} onBack={() => go("dashboard")} onSelect={p => go("profile", p)} />;
      case "backup":
        return (
          <BackupScreen
            patients={patients} medicines={medicines}
            onBack={() => go("dashboard")}
            onRestore={(p, m) => { setPatients(p); if (m?.length) setMedicines(m); }}
            setToast={showToast}
          />
        );
      case "settings":
        return <SettingsScreen onBack={() => go("dashboard")} medicines={medicines} onMedicinesUpdate={setMedicines} setToast={showToast} />;
      default:
        return <Dashboard patients={patients} onNav={go} />;
    }
  };

  return (
    <div style={S.app}>
      {renderScreen()}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
