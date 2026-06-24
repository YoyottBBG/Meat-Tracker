const { useState, useEffect } = React;

const STORAGE_KEY = "meat-tracker-entries";
const MEAL_TYPES = ["🌅 Petit-déjeuner", "☀️ Déjeuner", "🌙 Dîner", "🍿 Snack"];
const MEAT_TYPES = [
  { label: "🥩 Bœuf",          co2: 27.0 },
  { label: "🐷 Porc",          co2: 12.1 },
  { label: "🍗 Poulet",        co2:  6.9 },
  { label: "🦆 Canard",        co2:  7.5 },
  { label: "🐑 Agneau",        co2: 39.2 },
  { label: "🐟 Poisson",       co2:  6.0 },
  { label: "🦐 Fruits de mer", co2: 18.0 },
  { label: "🥓 Charcuterie",   co2: 14.0 },
  { label: "Autre",            co2: 10.0 },
];
const CO2_MAP = Object.fromEntries(MEAT_TYPES.map(m => [m.label, m.co2]));

const co2For   = e => (e.weight || 0) / 1000 * (CO2_MAP[e.meat] || 10);
const co2Label = kg => kg < 0.01 ? "< 10 g CO₂e" : kg < 1 ? `${(kg*1000).toFixed(0)} g CO₂e` : `${kg.toFixed(2)} kg CO₂e`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("fr-FR", { weekday:"short", day:"numeric", month:"short" });
const dayKey   = iso => iso.slice(0, 10);

const G = "#1a3d2b", GL = "#d4e4d8", GM = "#4a7c5f", BG = "#edf2ee";
const lbl = { display:"block", fontSize:12, fontWeight:700, color:GM, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.04em" };
const inp = { width:"100%", padding:"10px 12px", border:`1.5px solid ${GL}`, borderRadius:10, fontSize:14, marginBottom:14, background:"#f5f8f5", outline:"none" };

function App() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [view, setView]   = useState("log");
  const [saved, setSaved] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm]   = useState({ meat: MEAT_TYPES[0].label, meal: MEAL_TYPES[1], note:"", date:today, weight:150 });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const set = patch => setForm(f => ({ ...f, ...patch }));

  function addEntry() {
    setEntries(es => [{ id: Date.now(), ...form, weight: Number(form.weight) || 0 }, ...es]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    set({ note:"", weight:150 });
  }

  const totalCo2  = entries.reduce((s, e) => s + co2For(e), 0);
  const last7Co2  = entries.filter(e => new Date(e.date) >= new Date(Date.now() - 7*86400000)).reduce((s, e) => s + co2For(e), 0);
  const meatCounts = entries.reduce((a, e) => { a[e.meat] = (a[e.meat]||0)+1; return a; }, {});
  const topMeat   = Object.entries(meatCounts).sort((a,b) => b[1]-a[1])[0];
  const byDay     = entries.reduce((a, e) => { const k=dayKey(e.date); (a[k]=a[k]||[]).push(e); return a; }, {});
  const days      = Object.keys(byDay).sort((a,b) => b.localeCompare(a));

  return React.createElement("div", { style:{ fontFamily:"system-ui,sans-serif", background:BG, minHeight:"100vh" }},

    // Header
    React.createElement("div", { style:{ textAlign:"center", marginBottom:20 }},
      React.createElement("div", { style:{ fontSize:32 }}, "🌿"),
      React.createElement("h1", { style:{ margin:"4px 0 0", fontSize:20, fontWeight:700, color:G }}, "Meat Tracker"),
      React.createElement("p",  { style:{ margin:"2px 0 0", fontSize:13, color:GM }}, "Consomme moins, vis mieux")
    ),

    // Nav
    React.createElement("div", { style:{ display:"flex", gap:6, marginBottom:20, background:GL, borderRadius:12, padding:4 }},
      [["log","➕ Ajouter"],["history","📋 Historique"],["stats","📊 Stats"]].map(([k,l]) =>
        React.createElement("button", { key:k, onClick:()=>setView(k), style:{
          flex:1, padding:"8px 0", border:"none", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:600,
          background: view===k ? "#fff" : "transparent", color: view===k ? G : GM,
          boxShadow: view===k ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
        }}, l)
      )
    ),

    // LOG
    view === "log" && React.createElement("div", { style:{ background:"#fff", borderRadius:16, padding:20, boxShadow:"0 1px 8px rgba(26,61,43,0.08)" }},
      React.createElement("label", { style:lbl }, "Date"),
      React.createElement("input", { type:"date", value:form.date, onChange:e=>set({date:e.target.value}), style:inp }),

      React.createElement("label", { style:lbl }, "Type de viande"),
      React.createElement("div", { style:{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }},
        MEAT_TYPES.map(m => React.createElement("button", { key:m.label, onClick:()=>set({meat:m.label}), style:{
          padding:"6px 10px", borderRadius:8, border:"1.5px solid",
          borderColor: form.meat===m.label ? G : GL,
          background:  form.meat===m.label ? GL : BG,
          color:       form.meat===m.label ? G : "#555",
          fontSize:13, cursor:"pointer", fontWeight: form.meat===m.label ? 700 : 400
        }}, m.label))
      ),

      React.createElement("label", { style:lbl }, "Repas"),
      React.createElement("div", { style:{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }},
        MEAL_TYPES.map(m => React.createElement("button", { key:m, onClick:()=>set({meal:m}), style:{
          padding:"6px 10px", borderRadius:8, border:"1.5px solid",
          borderColor: form.meal===m ? GM : GL,
          background:  form.meal===m ? "#e8f0ea" : BG,
          color:       form.meal===m ? G : "#555",
          fontSize:13, cursor:"pointer", fontWeight: form.meal===m ? 700 : 400
        }}, m))
      ),

      React.createElement("label", { style:lbl }, "Quantité (g)"),
      React.createElement("div", { style:{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }},
        React.createElement("input", { type:"range", min:10, max:600, step:10, value:form.weight, onChange:e=>set({weight:Number(e.target.value)}), style:{ flex:1, accentColor:G } }),
        React.createElement("div", { style:{ minWidth:60, textAlign:"center", background:GL, color:G, fontWeight:700, fontSize:15, borderRadius:8, padding:"5px 8px" }}, `${form.weight}g`)
      ),
      React.createElement("div", { style:{ fontSize:12, color:GM, marginBottom:16 }},
        `🌍 ≈ ${co2Label(co2For({...form, weight:Number(form.weight)}))} pour cette portion`
      ),

      React.createElement("label", { style:lbl }, "Note (optionnel)"),
      React.createElement("input", { placeholder:"Ex: steak au restaurant…", value:form.note, onChange:e=>set({note:e.target.value}), style:{...inp, marginBottom:18} }),

      React.createElement("button", { onClick:addEntry, style:{ width:"100%", padding:13, background:G, color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:"pointer" }},
        saved ? "✅ Enregistré !" : "Enregistrer"
      )
    ),

    // HISTORY
    view === "history" && React.createElement("div", null,
      days.length === 0 && React.createElement("p", { style:{ textAlign:"center", color:"#aaa", marginTop:40 }}, "Aucune entrée pour l'instant."),
      days.map(day => React.createElement("div", { key:day, style:{ marginBottom:16 }},
        React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }},
          React.createElement("span", { style:{ fontSize:12, fontWeight:700, color:"#999", textTransform:"uppercase" }}, fmtDate(day)),
          React.createElement("span", { style:{ fontSize:12, background:GL, color:G, borderRadius:6, padding:"2px 8px", fontWeight:600 }},
            `🌍 ${co2Label(byDay[day].reduce((s,e)=>s+co2For(e),0))}`)
        ),
        byDay[day].map(e => React.createElement("div", { key:e.id, style:{ background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:6, display:"flex", alignItems:"center", gap:10, boxShadow:"0 1px 4px rgba(26,61,43,0.07)" }},
          React.createElement("div", { style:{ flex:1 }},
            React.createElement("div", { style:{ fontWeight:600, fontSize:14 }}, e.meat),
            React.createElement("div", { style:{ fontSize:12, color:"#888", marginTop:2 }}, `${e.meal} · ${e.weight}g${e.note ? " · "+e.note : ""}`),
            React.createElement("div", { style:{ fontSize:12, color:GM, marginTop:3 }}, `🌍 ${co2Label(co2For(e))}`)
          ),
          React.createElement("button", { onClick:()=>setEntries(es=>es.filter(x=>x.id!==e.id)), style:{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#ccc", padding:4 }}, "🗑")
        ))
      ))
    ),

    // STATS
    view === "stats" && React.createElement("div", { style:{ display:"flex", flexDirection:"column", gap:12 }},
      [
        { label:"Total entrées",   value:entries.length,      icon:"🥗" },
        { label:"CO₂ total émis",  value:co2Label(totalCo2),  icon:"🌍" },
        { label:"CO₂ ces 7 jours", value:co2Label(last7Co2),  icon:"📅" },
        { label:"Préférence",      value:topMeat?`${topMeat[0]} (×${topMeat[1]})` : "—", icon:"🏆" },
      ].map(s => React.createElement("div", { key:s.label, style:{ background:"#fff", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 1px 6px rgba(26,61,43,0.08)" }},
        React.createElement("span", { style:{ fontSize:26 }}, s.icon),
        React.createElement("div", null,
          React.createElement("div", { style:{ fontSize:12, color:"#999" }}, s.label),
          React.createElement("div", { style:{ fontSize:18, fontWeight:700, color:G }}, s.value)
        )
      )),

      totalCo2 > 0 && React.createElement("div", { style:{ background:GL, borderRadius:14, padding:"14px 18px" }},
        React.createElement("div", { style:{ fontSize:13, fontWeight:700, color:G, marginBottom:8 }}, "Tes émissions équivalent à…"),
        [
          { icon:"🚗", label:"km en voiture", val:Math.round(totalCo2/0.21) },
          { icon:"✈️", label:"km en avion",   val:Math.round(totalCo2/0.255) },
          { icon:"🌳", label:"jours d'absorption d'un arbre", val:Math.round(totalCo2/0.006) },
        ].map(eq => React.createElement("div", { key:eq.label, style:{ display:"flex", justifyContent:"space-between", fontSize:13, color:G, marginBottom:4 }},
          React.createElement("span", null, `${eq.icon} ${eq.label}`),
          React.createElement("strong", null, eq.val.toLocaleString("fr-FR"))
        ))
      ),

      Object.keys(meatCounts).length > 0 && React.createElement("div", { style:{ background:"#fff", borderRadius:14, padding:"16px 18px", boxShadow:"0 1px 6px rgba(26,61,43,0.08)" }},
        React.createElement("div", { style:{ fontSize:13, color:"#999", marginBottom:12 }}, "Répartition par type"),
        Object.entries(meatCounts).sort((a,b)=>b[1]-a[1]).map(([meat,count]) =>
          React.createElement("div", { key:meat, style:{ marginBottom:8 }},
            React.createElement("div", { style:{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:3 }},
              React.createElement("span", null, meat),
              React.createElement("span", { style:{ fontWeight:600, color:G }}, `${count}×`)
            ),
            React.createElement("div", { style:{ background:GL, borderRadius:6, height:6 }},
              React.createElement("div", { style:{ background:GM, borderRadius:6, height:6, width:`${(count/entries.length)*100}%` }})
            )
          )
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
