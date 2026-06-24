const { useState } = React;

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
const co2For   = e => (e.weight||0)/1000*(CO2_MAP[e.meat]||10);
const co2Label = kg => kg<0.01?"< 10 g CO₂e":kg<1?`${(kg*1000).toFixed(0)} g CO₂e`:`${kg.toFixed(2)} kg CO₂e`;
const fmtDate  = iso => new Date(iso).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
const dayKey   = iso => iso.slice(0,10);
const isoWeek  = d => { const dt=new Date(d); dt.setHours(0,0,0,0); dt.setDate(dt.getDate()+4-(dt.getDay()||7)); const y=dt.getFullYear(); const wk=Math.ceil(((dt-new Date(y,0,1))/86400000+1)/7); return `${y}-W${String(wk).padStart(2,"0")}`; };
const monthKey = iso => iso.slice(0,7);

const G="#1a3d2b",GL="#d4e4d8",GM="#4a7c5f",BG="#edf2ee";
const lbl={display:"block",fontSize:12,fontWeight:700,color:GM,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.04em"};
const inp={width:"100%",padding:"10px 12px",border:`1.5px solid ${GL}`,borderRadius:10,fontSize:14,marginBottom:14,background:"#f5f8f5",outline:"none"};

function computeStreaks(entries) {
  const today = dayKey(new Date().toISOString());
  const meatDays = new Set(entries.map(e => e.date));
  if (entries.length===0) return { current:0, best:0 };
  const firstDay = new Date([...meatDays].sort()[0]);
  const allDays = [];
  for (let d=new Date(firstDay); d<=new Date(today); d.setDate(d.getDate()+1))
    allDays.push(dayKey(d.toISOString()));
  let current=0;
  for (let i=allDays.length-1; i>=0; i--) {
    if (!meatDays.has(allDays[i])) current++; else break;
  }
  let best=0, run=0;
  for (const d of allDays) {
    if (!meatDays.has(d)) { run++; best=Math.max(best,run); } else run=0;
  }
  return { current, best };
}

function groupBy(entries, keyFn) {
  return entries.reduce((a,e)=>{ const k=keyFn(e.date); (a[k]=a[k]||[]).push(e); return a; },{});
}

function StatCard({icon,label,value,sub}) {
  return (
    <div style={{background:"#fff",borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}}>
      <span style={{fontSize:26}}>{icon}</span>
      <div>
        <div style={{fontSize:12,color:"#999"}}>{label}</div>
        <div style={{fontSize:18,fontWeight:700,color:G}}>{value}</div>
        {sub && <div style={{fontSize:11,color:GM,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({data, labelFn}) {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:80,marginTop:8}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
          <div style={{fontSize:10,color:GM,fontWeight:600}}>{d.value||""}</div>
          <div style={{width:"100%",background:GL,borderRadius:4,overflow:"hidden",height:56,display:"flex",alignItems:"flex-end"}}>
            <div style={{width:"100%",background:d.value>0?GM:"transparent",borderRadius:4,height:`${(d.value/max)*100}%`,transition:"height 0.3s"}}/>
          </div>
          <div style={{fontSize:9,color:"#999",textAlign:"center",lineHeight:1.1}}>{labelFn(d.key)}</div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [entries, setEntries] = useState(()=>{ try { return JSON.parse(localStorage.getItem("meat-tracker-entries"))||[]; } catch { return []; } });
  const [view, setView]       = useState("log");
  const [statTab, setStatTab] = useState("overview");
  const [saved, setSaved]     = useState(false);
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState({meat:MEAT_TYPES[0].label,meal:MEAL_TYPES[1],note:"",date:today,weight:150});
  const set = patch => setForm(f=>({...f,...patch}));

  function addEntry() {
    const updated = [{id:Date.now(),...form,weight:Number(form.weight)||0},...entries];
    setEntries(updated);
    localStorage.setItem("meat-tracker-entries",JSON.stringify(updated));
    setSaved(true); setTimeout(()=>setSaved(false),1500);
    set({note:"",weight:150});
  }
  function deleteEntry(id) {
    const updated = entries.filter(e=>e.id!==id);
    setEntries(updated);
    localStorage.setItem("meat-tracker-entries",JSON.stringify(updated));
  }

  const streaks     = computeStreaks(entries);
  const totalCo2    = entries.reduce((s,e)=>s+co2For(e),0);
  const totalWeight = entries.reduce((s,e)=>s+(e.weight||0),0);
  const meatCounts  = entries.reduce((a,e)=>{a[e.meat]=(a[e.meat]||0)+1;return a;},{});
  const topMeat     = Object.entries(meatCounts).sort((a,b)=>b[1]-a[1])[0];
  const byWeek      = groupBy(entries, isoWeek);
  const byMonth     = groupBy(entries, monthKey);
  const byDay       = groupBy(entries, dayKey);
  const days        = Object.keys(byDay).sort((a,b)=>b.localeCompare(a));

  const last8Weeks  = Array.from({length:8},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i*7); const k=isoWeek(d.toISOString()); return {key:k,value:(byWeek[k]||[]).length}; }).reverse();
  const last6Months = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-i); const k=monthKey(d.toISOString()); return {key:k,value:(byMonth[k]||[]).length}; }).reverse();
  const last14Days  = Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); const k=dayKey(d.toISOString()); return {key:k,value:(byDay[k]||[]).length}; });

  const weekLabel  = k => { const [,w]=k.split("-W"); return `S${w}`; };
  const monthLabel = k => new Date(k+"-01").toLocaleDateString("fr-FR",{month:"short"});
  const dayLabel   = k => new Date(k).toLocaleDateString("fr-FR",{weekday:"short"}).slice(0,3);

  return React.createElement("div", {style:{fontFamily:"system-ui,sans-serif",maxWidth:420,margin:"0 auto",padding:16,background:BG,minHeight:"100vh"}},

    // Header
    React.createElement("div",{style:{textAlign:"center",marginBottom:20}},
      React.createElement("div",{style:{fontSize:32}},"🌿"),
      React.createElement("h1",{style:{margin:"4px 0 0",fontSize:20,fontWeight:700,color:G}},"Meat Tracker"),
      React.createElement("p",{style:{margin:"2px 0 0",fontSize:13,color:GM}},"Consomme moins, vis mieux")
    ),

    // Nav
    React.createElement("div",{style:{display:"flex",gap:6,marginBottom:20,background:GL,borderRadius:12,padding:4}},
      [["log","➕ Ajouter"],["history","📋 Historique"],["stats","📊 Stats"]].map(([k,l])=>
        React.createElement("button",{key:k,onClick:()=>setView(k),style:{flex:1,padding:"8px 0",border:"none",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600,background:view===k?"#fff":"transparent",color:view===k?G:GM,boxShadow:view===k?"0 1px 4px rgba(0,0,0,0.1)":"none"}},l)
      )
    ),

    // LOG
    view==="log" && React.createElement("div",{style:{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 8px rgba(26,61,43,0.08)"}},
      React.createElement("label",{style:lbl},"Date"),
      React.createElement("input",{type:"date",value:form.date,onChange:e=>set({date:e.target.value}),style:inp}),
      React.createElement("label",{style:lbl},"Type de viande"),
      React.createElement("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}},
        MEAT_TYPES.map(m=>React.createElement("button",{key:m.label,onClick:()=>set({meat:m.label}),style:{padding:"6px 10px",borderRadius:8,border:"1.5px solid",borderColor:form.meat===m.label?G:GL,background:form.meat===m.label?GL:BG,color:form.meat===m.label?G:"#555",fontSize:13,cursor:"pointer",fontWeight:form.meat===m.label?700:400}},m.label))
      ),
      React.createElement("label",{style:lbl},"Repas"),
      React.createElement("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}},
        MEAL_TYPES.map(m=>React.createElement("button",{key:m,onClick:()=>set({meal:m}),style:{padding:"6px 10px",borderRadius:8,border:"1.5px solid",borderColor:form.meal===m?GM:GL,background:form.meal===m?"#e8f0ea":BG,color:form.meal===m?G:"#555",fontSize:13,cursor:"pointer",fontWeight:form.meal===m?700:400}},m))
      ),
      React.createElement("label",{style:lbl},"Quantité (g)"),
      React.createElement("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6}},
        React.createElement("input",{type:"range",min:10,max:600,step:10,value:form.weight,onChange:e=>set({weight:Number(e.target.value)}),style:{flex:1,accentColor:G}}),
        React.createElement("div",{style:{minWidth:60,textAlign:"center",background:GL,color:G,fontWeight:700,fontSize:15,borderRadius:8,padding:"5px 8px"}},`${form.weight}g`)
      ),
      React.createElement("div",{style:{fontSize:12,color:GM,marginBottom:16}},`🌍 ≈ ${co2Label(co2For({...form,weight:Number(form.weight)}))} pour cette portion`),
      React.createElement("label",{style:lbl},"Note (optionnel)"),
      React.createElement("input",{placeholder:"Ex: steak au restaurant…",value:form.note,onChange:e=>set({note:e.target.value}),style:{...inp,marginBottom:18}}),
      React.createElement("button",{onClick:addEntry,style:{width:"100%",padding:13,background:G,color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}},saved?"✅ Enregistré !":"Enregistrer")
    ),

    // HISTORY
    view==="history" && React.createElement("div",null,
      days.length===0 && React.createElement("p",{style:{textAlign:"center",color:"#aaa",marginTop:40}},"Aucune entrée pour l'instant."),
      days.map(day=>React.createElement("div",{key:day,style:{marginBottom:16}},
        React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},
          React.createElement("span",{style:{fontSize:12,fontWeight:700,color:"#999",textTransform:"uppercase"}},fmtDate(day)),
          React.createElement("span",{style:{fontSize:12,background:GL,color:G,borderRadius:6,padding:"2px 8px",fontWeight:600}},`🌍 ${co2Label(byDay[day].reduce((s,e)=>s+co2For(e),0))}`)
        ),
        byDay[day].map(e=>React.createElement("div",{key:e.id,style:{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:10,boxShadow:"0 1px 4px rgba(26,61,43,0.07)"}},
          React.createElement("div",{style:{flex:1}},
            React.createElement("div",{style:{fontWeight:600,fontSize:14}},e.meat),
            React.createElement("div",{style:{fontSize:12,color:"#888",marginTop:2}},`${e.meal} · ${e.weight}g${e.note?" · "+e.note:""}`),
            React.createElement("div",{style:{fontSize:12,color:GM,marginTop:3}},`🌍 ${co2Label(co2For(e))}`)
          ),
          React.createElement("button",{onClick:()=>deleteEntry(e.id),style:{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#ccc",padding:4}},"🗑")
        ))
      ))
    ),

    // STATS
    view==="stats" && React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:12}},
      // Sous-nav
      React.createElement("div",{style:{display:"flex",gap:6,background:GL,borderRadius:10,padding:3}},
        [["overview","Général"],["daily","Jours"],["weekly","Semaines"],["monthly","Mois"]].map(([k,l])=>
          React.createElement("button",{key:k,onClick:()=>setStatTab(k),style:{flex:1,padding:"6px 0",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,background:statTab===k?"#fff":"transparent",color:statTab===k?G:GM,boxShadow:statTab===k?"0 1px 3px rgba(0,0,0,0.08)":"none"}},l)
        )
      ),

      // OVERVIEW
      statTab==="overview" && React.createElement(React.Fragment,null,
        React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}},
          React.createElement("div",{style:{fontSize:13,fontWeight:700,color:G,marginBottom:12}},"🔥 Jours sans viande"),
          React.createElement("div",{style:{display:"flex",gap:10}},
            [{label:"Streak actuel",value:streaks.current},{label:"Meilleur streak",value:streaks.best}].map(s=>
              React.createElement("div",{key:s.label,style:{flex:1,background:GL,borderRadius:10,padding:"10px 8px",textAlign:"center"}},
                React.createElement("div",{style:{fontSize:22,fontWeight:800,color:G}},s.value),
                React.createElement("div",{style:{fontSize:10,color:GM,fontWeight:600,marginTop:2}},"jour"+(s.value>1?"s":"")),
                React.createElement("div",{style:{fontSize:9,color:"#999",marginTop:3}},s.label)
              )
            )
          )
        ),
        React.createElement(StatCard,{icon:"🥗",label:"Total repas avec viande",value:entries.length}),
        React.createElement(StatCard,{icon:"⚖️",label:"Poids total consommé",value:totalWeight>=1000?`${(totalWeight/1000).toFixed(1)} kg`:`${totalWeight} g`}),
        React.createElement(StatCard,{icon:"🌍",label:"CO₂ total émis",value:co2Label(totalCo2)}),
        topMeat && React.createElement(StatCard,{icon:"🏆",label:"Viande la plus consommée",value:topMeat[0],sub:`${topMeat[1]} fois`}),
        Object.keys(meatCounts).length>0 && React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}},
          React.createElement("div",{style:{fontSize:13,color:"#999",marginBottom:12}},"Répartition par type"),
          Object.entries(meatCounts).sort((a,b)=>b[1]-a[1]).map(([meat,count])=>
            React.createElement("div",{key:meat,style:{marginBottom:8}},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}},
                React.createElement("span",null,meat),
                React.createElement("span",{style:{fontWeight:600,color:G}},`${count}×`)
              ),
              React.createElement("div",{style:{background:GL,borderRadius:6,height:6}},
                React.createElement("div",{style:{background:GM,borderRadius:6,height:6,width:`${(count/entries.length)*100}%`}})
              )
            )
          )
        )
      ),

      // DAILY
      statTab==="daily" && React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}},
        React.createElement("div",{style:{fontSize:13,fontWeight:700,color:G,marginBottom:4}},"Repas avec viande par jour"),
        React.createElement("div",{style:{fontSize:11,color:"#999",marginBottom:8}},"14 derniers jours"),
        React.createElement(BarChart,{data:last14Days,labelFn:dayLabel}),
        React.createElement("div",{style:{marginTop:16,display:"flex",flexDirection:"column",gap:6}},
          last14Days.slice().reverse().filter(d=>d.value>0).map(d=>{
            const dE=byDay[d.key]||[]; const dCo2=dE.reduce((s,e)=>s+co2For(e),0); const dKg=dE.reduce((s,e)=>s+(e.weight||0),0);
            return React.createElement("div",{key:d.key,style:{display:"flex",justifyContent:"space-between",fontSize:12,padding:"8px 10px",background:BG,borderRadius:8}},
              React.createElement("span",{style:{fontWeight:600,color:G}},fmtDate(d.key)),
              React.createElement("span",{style:{color:"#666"}},`${d.value} repas · ${dKg}g · ${co2Label(dCo2)}`)
            );
          })
        )
      ),

      // WEEKLY
      statTab==="weekly" && React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}},
        React.createElement("div",{style:{fontSize:13,fontWeight:700,color:G,marginBottom:4}},"Repas avec viande par semaine"),
        React.createElement("div",{style:{fontSize:11,color:"#999",marginBottom:8}},"8 dernières semaines"),
        React.createElement(BarChart,{data:last8Weeks,labelFn:weekLabel}),
        React.createElement("div",{style:{marginTop:16,display:"flex",flexDirection:"column",gap:6}},
          last8Weeks.slice().reverse().filter(w=>w.value>0).map(w=>{
            const wE=byWeek[w.key]||[]; const wCo2=wE.reduce((s,e)=>s+co2For(e),0); const wKg=wE.reduce((s,e)=>s+(e.weight||0),0);
            return React.createElement("div",{key:w.key,style:{display:"flex",justifyContent:"space-between",fontSize:12,padding:"8px 10px",background:BG,borderRadius:8}},
              React.createElement("span",{style:{fontWeight:600,color:G}},weekLabel(w.key)),
              React.createElement("span",{style:{color:"#666"}},`${w.value} repas · ${wKg}g · ${co2Label(wCo2)}`)
            );
          })
        )
      ),

      // MONTHLY
      statTab==="monthly" && React.createElement("div",{style:{background:"#fff",borderRadius:14,padding:"16px 18px",boxShadow:"0 1px 6px rgba(26,61,43,0.08)"}},
        React.createElement("div",{style:{fontSize:13,fontWeight:700,color:G,marginBottom:4}},"Repas avec viande par mois"),
        React.createElement("div",{style:{fontSize:11,color:"#999",marginBottom:8}},"6 derniers mois"),
        React.createElement(BarChart,{data:last6Months,labelFn:monthLabel}),
        React.createElement("div",{style:{marginTop:16,display:"flex",flexDirection:"column",gap:6}},
          last6Months.slice().reverse().filter(m=>m.value>0).map(m=>{
            const mE=byMonth[m.key]||[]; const mCo2=mE.reduce((s,e)=>s+co2For(e),0); const mKg=mE.reduce((s,e)=>s+(e.weight||0),0);
            return React.createElement("div",{key:m.key,style:{display:"flex",justifyContent:"space-between",fontSize:12,padding:"8px 10px",background:BG,borderRadius:8}},
              React.createElement("span",{style:{fontWeight:600,color:G,textTransform:"capitalize"}},monthLabel(m.key)),
              React.createElement("span",{style:{color:"#666"}},`${m.value} repas · ${mKg}g · ${co2Label(mCo2)}`)
            );
          })
        )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
