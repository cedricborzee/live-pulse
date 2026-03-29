import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";

// ─── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCNkv3piAngMm5pbKBocP1cUc3ybONmO44",
  authDomain: "live-pulse-840db.firebaseapp.com",
  databaseURL: "https://live-pulse-840db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "live-pulse-840db",
  storageBucket: "live-pulse-840db.firebasestorage.app",
  messagingSenderId: "784038942714",
  appId: "1:784038942714:web:ead55b2a485d32a52a3643",
};
const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);
const SESSION_REF = "sessions/current";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  navy:"#0D1B2E", navyMid:"#162438", navyLight:"#1E3050",
  cyan:"#00C2E0", cyanDark:"#0099B4", cyanBg:"#E6F9FC",
  white:"#FFFFFF", offWhite:"#F4F8FB", border:"#D6E4ED",
  title:"#0D1B2E", body:"#3A5068", muted:"#7A96AE",
  amber:"#E8963A", amberBg:"#FEF3E6",
  blue:"#2E6DB4", blueBg:"#E5EDF8",
  red:"#C0392B", redBg:"#FDECEA",
  green:"#1A7A4A", teal:"#1A9E8F", tealBg:"#E5F5F3",
};

// ─── SVG backgrounds ──────────────────────────────────────────────────────────
const BGSV = {
  landing:   "https://res.cloudinary.com/dclnpmurv/image/upload/v1773425005/shutterstock_2623880637_iisw95.jpg",
  survey:    "https://res.cloudinary.com/dclnpmurv/image/upload/v1773425005/shutterstock_2673966919_uwjrrx.jpg",
  result:    "https://res.cloudinary.com/dclnpmurv/image/upload/v1773425004/shutterstock_2681509695_vds3yi.jpg",
  presenter: "https://res.cloudinary.com/dclnpmurv/image/upload/v1773425004/shutterstock_355870532_lemjca.jpg",
};


// ─── Questions ────────────────────────────────────────────────────────────────
const QS = [
  { id:"q1", q:"How clear are decision rights when your L&D function makes a significant investment?",             type:"scale", lo:"Ownership contested", hi:"Authority fully defined" },
  { id:"q2", q:"How well does your learning data connect to other talent and HR systems?",                         type:"scale", lo:"Completely siloed",    hi:"Fully integrated" },
  { id:"q3", q:"How embedded is AI-enabled learning in your organization's workflows right now?",                  type:"scale", lo:"On the roadmap",       hi:"Scaled and governed" },
  { id:"q4", q:"When you present learning impact data to senior leaders, how much does it shape decisions?",       type:"scale", lo:"Acknowledged, not acted on", hi:"Directly shapes decisions" },
  { id:"q7", q:"How systematically does your organisation diagnose performance gaps before designing learning?",    type:"scale", lo:"Reactively — we respond to requests", hi:"Structured analysis drives all work" },
  { id:"q8", q:"How ready is your organisation — in systems, data, and governance — to deliver on its top L&D priority?", type:"scale", lo:"Foundations not yet in place", hi:"Fully capable of executing at scale" },
  { id:"q5", q:"Your single highest L&D priority for the next 12–24 months?", type:"choice",
    options:["AI & learning in the flow of work","L&D as a strategic business partner","Skills-based talent strategy","Integrating learning & talent systems","Demonstrating business impact"] },
  { id:"q6", q:"Your current learning operating model?", type:"choice",
    options:["Centralized","Mostly centralized","Federated","Mostly decentralized","Fully distributed"] },
];

// ─── Archetypes ───────────────────────────────────────────────────────────────
const ARCHETYPES = [
  { name:"Deliberate System Architect",      color:"#1A9E8F", bg:"#E5F5F3", tagline:"Architecture before acceleration.",           icon:"⬡" },
  { name:"Fragmented Excellence",            color:"#E8963A", bg:"#FEF3E6", tagline:"Strong in pockets. Doesn't travel.",          icon:"◬" },
  { name:"Measured, Not Believed",           color:"#2E6DB4", bg:"#E5EDF8", tagline:"Data without decision influence.",            icon:"◈" },
  { name:"Ambition-Led, Architecture-Light", color:"#C0392B", bg:"#FDECEA", tagline:"Great at starting. Hard to finish at scale.", icon:"◇" },
];

// ─── Updated benchmark ratios ─────────────────────────────────────────────────
const BENCHMARK = {
  "Deliberate System Architect":      30,
  "Fragmented Excellence":            40,
  "Measured, Not Believed":           10,
  "Ambition-Led, Architecture-Light": 20,
};

function classify(r) {
  const gov=+r.q1||0,tech=+r.q2||0,ai=+r.q3||0,meas=+r.q4||0,needs=+r.q7||0,exec=+r.q8||0;
  const sys=(gov+tech+needs)/3;
  if(sys>=3.3&&meas>=3.0&&exec>=3.0) return "Deliberate System Architect";
  if(meas<=2.3&&sys>=2.5)            return "Measured, Not Believed";
  if(gov<=2.5&&(tech>=2.5||ai>=2.5)) return "Fragmented Excellence";
  return "Ambition-Led, Architecture-Light";
}

// ─── NIIT Logo ────────────────────────────────────────────────────────────────
const NIIT_LOGO = "https://www.niit.com/en/learning-outsourcing/wp-content/themes/niit/assets/images/niit-logo.svg";

function NIITLogo({ height=36 }) {
  const [err,setErr] = useState(false);
  if(err) return <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:28,color:C.cyan,letterSpacing:"0.06em"}}>NIIT</div>;
  return <img src={NIIT_LOGO} height={height} alt="NIIT" onError={()=>setErr(true)} style={{filter:"brightness(0) invert(1)",height,objectFit:"contain"}}/>;
}

// ─── Shared components ────────────────────────────────────────────────────────
function Page({ children, bgImg, maxW=480, overlay="rgba(13,27,46,0.72)" }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0D1B2E;}
        button{transition:all 0.18s;font-family:'Inter',sans-serif;}
        button:hover:not(:disabled){filter:brightness(1.1);}
        button:active:not(:disabled){transform:scale(0.98);}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:rgba(255,255,255,0.15);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:#00C2E0;cursor:pointer;box-shadow:0 2px 10px rgba(0,194,224,0.5);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.25}}
        .fadein{animation:fadeUp 0.38s ease both;}
      `}</style>
      <div style={{minHeight:"100vh",position:"relative",display:"flex",flexDirection:"column",
        alignItems:"center",padding:"0 16px 80px",fontFamily:"'Inter',sans-serif",overflow:"hidden"}}>
        {bgImg&&<>
          <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${bgImg})`,backgroundSize:"cover",backgroundPosition:"center"}}/>
          <div style={{position:"fixed",inset:0,zIndex:1,background:overlay}}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,height:200,zIndex:1,background:"linear-gradient(to top,rgba(0,194,224,0.08),transparent)"}}/>
        </>}
        <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:maxW,paddingTop:36}}>
          {children}
        </div>
      </div>
    </>
  );
}

function Card({children,style={},onClick}){
  return <div onClick={onClick} style={{background:"rgba(255,255,255,0.97)",borderRadius:14,padding:"22px",boxShadow:"0 8px 40px rgba(13,27,46,0.22)",...style}}>{children}</div>;
}

function Label({children,color=C.cyan}){
  return <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color,marginBottom:8}}>{children}</div>;
}

function PBtn({children,onClick,disabled=false,color=C.cyan,textColor=C.navy,style={}}){
  return(
    <button disabled={disabled} onClick={onClick} style={{
      width:"100%",padding:"15px 20px",background:disabled?"rgba(255,255,255,0.08)":color,
      color:disabled?"rgba(255,255,255,0.25)":textColor,border:"none",borderRadius:8,
      fontSize:13,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",
      cursor:disabled?"not-allowed":"pointer",...style}}>
      {children}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [mode,setMode]           = useState("landing");
  const [step,setStep]           = useState(0);
  const [ans,setAns]             = useState({});
  const [touched,setTouched]     = useState(new Set());
  const [myArc,setMyArc]         = useState(null);
  const [responses,setResponses] = useState([]);
  const [lastAt,setLastAt]       = useState(null);
  const [confirmReset,setConfirmReset] = useState(false);

  // ── Pre-touch scale questions at value 1 so "1" is a valid submittable answer
  useEffect(() => {
    const current = QS[step];
    if (current?.type === "scale") {
      setAns(p => ({ ...p, [current.id]: p[current.id] ?? 1 }));
      setTouched(p => new Set([...p, current.id]));
    }
  }, [step]);

  // ── Firebase real-time listener
  const load = useCallback(() => {
    const r = ref(db, SESSION_REF);
    const unsub = onValue(r, snap => {
      const data = snap.val();
      setResponses(data ? Object.values(data) : []);
      setLastAt(new Date());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (mode !== "presenter") return;
    const unsub = load();
    return () => unsub();
  }, [mode, load]);

  async function submit() {
    const arc = classify(ans);
    setMyArc(arc);
    try { await push(ref(db,SESSION_REF),{arc,ts:Date.now()}); } catch(e){console.error(e);}
  }

  async function reset() {
    try { await remove(ref(db,SESSION_REF)); } catch(e){console.error(e);}
    setResponses([]); setConfirmReset(false);
  }

  function dist() {
    const c={}; ARCHETYPES.forEach(a=>c[a.name]=0);
    responses.forEach(r=>{if(c[r.arc]!==undefined)c[r.arc]++;});
    return c;
  }

  // ── PDF download
  function downloadPDF() {
    const d   = dist();
    const dominant = ARCHETYPES.reduce((a,b)=>(d[a.name]||0)>=(d[b.name]||0)?a:b);
    const domPct   = Math.round((d[dominant.name]||0)/tot*100);
    const rows = ARCHETYPES.map(arc=>{
      const cnt=d[arc.name]||0;
      const room=tot>0?Math.round(cnt/tot*100):0;
      const bench=BENCHMARK[arc.name];
      const diff=room-bench;
      return `<tr>
        <td style="padding:10px 14px;font-weight:600;color:#0D1B2E">${arc.icon} ${arc.name}</td>
        <td style="padding:10px 14px;text-align:center;font-weight:800;font-size:18px;color:${arc.color}">${room}%</td>
        <td style="padding:10px 14px;text-align:center;color:#7A96AE">${bench}%</td>
        <td style="padding:10px 14px;text-align:center;font-weight:700;color:${diff>0?"#1A7A4A":diff<0?"#C0392B":"#7A96AE"}">${diff>0?"+":""}${diff}pp</td>
        <td style="padding:10px 14px;text-align:center;color:#3A5068">${cnt} / ${tot}</td>
      </tr>`;
    }).join("");
    const html=`<!DOCTYPE html><html><head><title>NIIT Live Pulse — Session Results</title>
    <style>
      body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:40px;color:#0D1B2E;}
      .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #00C2E0;padding-bottom:20px;margin-bottom:32px;}
      .logo{font-size:28px;font-weight:900;color:#00C2E0;letter-spacing:0.06em;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{background:#0D1B2E;color:#fff;padding:10px 14px;text-align:left;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;}
      tr:nth-child(even){background:#F4F8FB;}
      .signal{background:#E6F9FC;border-left:4px solid #00C2E0;padding:14px 18px;border-radius:4px;font-size:14px;margin-top:8px;}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #D6E4ED;font-size:11px;color:#7A96AE;text-align:center;}
    </style></head><body>
    <div class="header">
      <div><div class="logo">NIIT</div><div style="font-size:11px;color:#7A96AE;margin-top:2px">2026 Global Learning Transformation Benchmark</div></div>
      <div style="text-align:right;font-size:12px;color:#7A96AE"><strong>Live Pulse — Session Results</strong><br/>${new Date().toLocaleDateString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}<br/>${tot} respondents</div>
    </div>
    <h2 style="font-size:16px;font-weight:800;margin:0 0 16px">Archetype Distribution — This Room vs 2026 Global Benchmark</h2>
    <table>
      <thead><tr><th>Archetype</th><th style="text-align:center">This Room</th><th style="text-align:center">Benchmark</th><th style="text-align:center">Delta</th><th style="text-align:center">Count</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${tot>=5?`<div class="signal"><strong>Room signal:</strong> ${domPct}% of this audience identifies as <strong>${dominant.name}</strong> — ${domPct>BENCHMARK[dominant.name]?"above":"below"} the global benchmark of ${BENCHMARK[dominant.name]}%.</div>`:""}
    <div class="footer">NIIT · St. Charles Consulting Group · 2026 Learning Transformation Benchmark · Confidential</div>
    </body></html>`;
    const w=window.open("","_blank");
    w.document.write(html);
    w.document.close();
    w.print();
  }

  const q   = QS[step];
  const ok  = q?.type==="scale" ? touched.has(q?.id) : ans[q?.id]!==undefined;
  const tot = responses.length;

  // ── LANDING ───────────────────────────────────────────────────────────────
  if(mode==="landing") return(
    <Page bgImg={BGSV.landing} overlay="rgba(13,27,46,0.72)">
      <div className="fadein">
        <div style={{display:"flex",justifyContent:"center",marginBottom:36}}>
          <NIITLogo height={40}/>
        </div>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-block",background:"rgba(0,194,224,0.12)",border:"1px solid rgba(0,194,224,0.3)",borderRadius:20,padding:"5px 18px",marginBottom:18}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:C.cyan}}>2026 Global Learning Transformation Benchmark</span>
          </div>
          <h1 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:42,color:"#fff",lineHeight:1.08,marginBottom:12,letterSpacing:"-0.02em"}}>Live Pulse</h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Conference edition · real-time results</p>
        </div>
        {[
          {icon:"📱",label:"Take the survey",sub:"8 questions · 3 minutes · discover your archetype",dest:"participant"},
          {icon:"📊",label:"Presenter dashboard",sub:"Live results · archetype distribution · vs. global benchmark",dest:"presenter"},
        ].map(o=>(
          <div key={o.dest} onClick={()=>setMode(o.dest)} style={{
            display:"flex",alignItems:"center",gap:16,
            background:"rgba(255,255,255,0.07)",backdropFilter:"blur(12px)",
            border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,
            padding:"20px 22px",marginBottom:12,cursor:"pointer",transition:"background 0.2s",
          }}>
            <div style={{width:52,height:52,borderRadius:12,background:"rgba(0,194,224,0.15)",border:"1px solid rgba(0,194,224,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{o.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:4}}>{o.label}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{o.sub}</div>
            </div>
            <div style={{color:C.cyan,fontSize:22}}>→</div>
          </div>
        ))}
        <p style={{textAlign:"center",fontSize:11,color:"rgba(255,255,255,0.18)",marginTop:24,lineHeight:1.7}}>
          Share this link for participants to open on their phone<br/>and tap "Take the survey".
        </p>
      </div>
    </Page>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if(mode==="participant"&&myArc){
    const arc=ARCHETYPES.find(a=>a.name===myArc);
    return(
      <Page bgImg={BGSV.result} overlay="rgba(13,27,46,0.80)">
        <div className="fadein">
          <div style={{display:"flex",justifyContent:"center",marginBottom:24}}><NIITLogo height={32}/></div>
          <Card style={{borderTop:`4px solid ${arc.color}`,textAlign:"center",paddingTop:28}}>
            <div style={{width:68,height:68,borderRadius:"50%",background:arc.bg,border:`2px solid ${arc.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 18px"}}>{arc.icon}</div>
            <Label color={arc.color}>Your Archetype</Label>
            <h2 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:22,color:C.title,marginBottom:8,letterSpacing:"-0.01em",lineHeight:1.2}}>{arc.name}</h2>
            <p style={{fontSize:14,color:arc.color,fontWeight:600,fontStyle:"italic",marginBottom:20}}>{arc.tagline}</p>
            <div style={{background:arc.bg,borderRadius:8,padding:"14px 16px",marginBottom:24,border:`1px solid ${arc.color}22`}}>
              <p style={{fontSize:13,color:arc.color,lineHeight:1.65,fontWeight:500}}>Your result has been added to the live dashboard — watch the presenter screen to see where the room lands.</p>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:18}}>
              <p style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>Speak with the NIIT team after the session for your full diagnostic profile.</p>
              <PBtn onClick={()=>{setMode("landing");setStep(0);setAns({});setTouched(new Set());setMyArc(null);}} color={C.navy} textColor="#fff">Back to start</PBtn>
            </div>
          </Card>
        </div>
      </Page>
    );
  }

  // ── SURVEY ────────────────────────────────────────────────────────────────
  if(mode==="participant") return(
    <Page bgImg={BGSV.survey} overlay="rgba(13,27,46,0.82)">
      <div style={{display:"flex",justifyContent:"center",marginBottom:20}}><NIITLogo height={30}/></div>
      <div style={{display:"flex",gap:4,marginBottom:6}}>
        {QS.map((_,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,
            background:i<step?C.cyan:i===step?"rgba(0,194,224,0.4)":"rgba(255,255,255,0.1)",
            transition:"background 0.3s"}}/>
        ))}
      </div>
      <div style={{textAlign:"right",marginBottom:14}}>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.3)"}}>{step+1} / {QS.length}</span>
      </div>
      <Card key={step} className="fadein" style={{marginBottom:14}}>
        <p style={{fontSize:17,fontWeight:600,color:C.title,lineHeight:1.65,marginBottom:22}}>{q.q}</p>

        {q.type==="scale"&&(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,gap:8}}>
              <span style={{fontSize:13,fontWeight:600,color:C.muted,maxWidth:"44%",lineHeight:1.5}}>{q.lo}</span>
              <span style={{fontSize:13,fontWeight:600,color:C.muted,maxWidth:"44%",textAlign:"right",lineHeight:1.5}}>{q.hi}</span>
            </div>
            <div style={{padding:"0 4px",marginBottom:12}}>
              <input type="range" min={1} max={5} step={1}
                value={ans[q.id]||1}
                style={{width:"100%",accentColor:C.cyan}}
                onChange={e=>{
                  setAns(p=>({...p,[q.id]:+e.target.value}));
                  setTouched(p=>new Set([...p,q.id]));
                }}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                {[1,2,3,4,5].map(v=>(
                  <span key={v} style={{fontSize:13,fontWeight:700,color:ans[q.id]===v?C.cyanDark:C.border,width:24,textAlign:"center",transition:"color 0.2s"}}>{v}</span>
                ))}
              </div>
            </div>
            <div style={{textAlign:"center",padding:"8px",background:C.cyanBg,borderRadius:8,border:`1px solid rgba(0,194,224,0.33)`}}>
              <span style={{fontSize:16,fontWeight:800,color:C.cyanDark}}>{ans[q.id]||1}</span>
              <span style={{fontSize:13,color:C.muted,marginLeft:4}}>/ 5</span>
            </div>
          </>
        )}

        {q.type==="choice"&&q.options.map(o=>(
          <button key={o} onClick={()=>setAns(p=>({...p,[q.id]:o}))} style={{
            display:"block",width:"100%",padding:"13px 16px",marginBottom:8,borderRadius:10,
            border:`2px solid ${ans[q.id]===o?C.cyan:C.border}`,
            background:ans[q.id]===o?C.cyanBg:"#fff",
            color:ans[q.id]===o?C.cyanDark:C.body,
            fontSize:14,fontWeight:ans[q.id]===o?700:400,
            cursor:"pointer",textAlign:"left",lineHeight:1.5,
          }}>{o}</button>
        ))}
      </Card>

      <div style={{display:"flex",gap:10}}>
        {step>0&&(
          <button style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"14px 18px",cursor:"pointer",fontSize:14}}
            onClick={()=>setStep(s=>s-1)}>←</button>
        )}
        <PBtn disabled={!ok} onClick={()=>{if(step<QS.length-1)setStep(s=>s+1);else submit();}}>
          {step===QS.length-1?"Reveal my archetype →":"Next →"}
        </PBtn>
      </div>
      <button style={{display:"block",margin:"16px auto 0",background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:12,cursor:"pointer"}}
        onClick={()=>setMode("landing")}>← Back</button>
    </Page>
  );

  // ── PRESENTER ─────────────────────────────────────────────────────────────
  if(mode==="presenter"){
    const d=dist();
    return(
      <Page bgImg={BGSV.presenter} overlay="rgba(10,22,38,0.88)" maxW={840}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24}}>
          <NIITLogo height={34}/>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(0,194,224,0.1)",border:"1px solid rgba(0,194,224,0.25)",borderRadius:20,padding:"5px 14px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.cyan,animation:"pulse 1.8s ease-in-out infinite"}}/>
              <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.15em",color:C.cyan,textTransform:"uppercase"}}>Live</span>
            </div>
            {tot>0&&(
              <button onClick={downloadPDF} style={{background:"rgba(0,194,224,0.15)",border:"1px solid rgba(0,194,224,0.3)",color:C.cyan,borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                ↓ Download PDF
              </button>
            )}
            {confirmReset
              ?<div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Sure?</span>
                  <button onClick={reset} style={{background:C.red,border:"none",color:"#fff",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:11,fontWeight:700}}>Yes, reset</button>
                  <button onClick={()=>setConfirmReset(false)} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:11}}>Cancel</button>
                </div>
              :<button onClick={()=>setConfirmReset(true)} style={{background:"rgba(192,57,43,0.15)",border:"1px solid rgba(192,57,43,0.3)",color:"#E0796B",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:11,fontWeight:600}}>Reset session</button>
            }
          </div>
        </div>

        {/* Counter */}
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(16px)",border:"1px solid rgba(0,194,224,0.2)",borderRadius:14,padding:"24px 32px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.2em",textTransform:"uppercase",color:C.cyan,marginBottom:6}}>Responses in the room</div>
            <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:80,color:C.cyan,lineHeight:1,letterSpacing:"-0.03em",transition:"all 0.4s"}}>{tot}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:6}}>2026 Learning Transformation Benchmark</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.18)"}}>{lastAt?`Updated ${lastAt.toLocaleTimeString()}`:"Waiting…"}</div>
          </div>
        </div>

        {/* Distribution */}
        <Card style={{padding:"28px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}>
            <div>
              <Label>Archetype Distribution</Label>
              <h3 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:20,color:C.title,letterSpacing:"-0.01em"}}>This Room vs Global Benchmark</h3>
            </div>
            <div style={{display:"flex",gap:20,alignItems:"center"}}>
              {[{col:C.cyan,label:"This room"},{col:C.border,label:"2026 benchmark"}].map(l=>(
                <div key={l.label} style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:28,height:8,borderRadius:4,background:l.col,opacity:l.col===C.border?0.6:0.9}}/>
                  <span style={{fontSize:12,color:C.muted,fontWeight:600}}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {tot===0?(
            <div style={{textAlign:"center",padding:"56px 0"}}>
              <div style={{fontSize:36,marginBottom:14,opacity:0.2}}>◈</div>
              <p style={{fontSize:15,color:C.muted,fontWeight:500}}>Waiting for participants…</p>
              <p style={{fontSize:13,color:C.muted,marginTop:6,opacity:0.6}}>Share the link and ask participants to tap "Take the survey".</p>
            </div>
          ):(
            <>
              {ARCHETYPES.map(arc=>{
                const cnt=d[arc.name]||0;
                const room=tot>0?Math.round(cnt/tot*100):0;
                const bench=BENCHMARK[arc.name];
                const diff=room-bench;
                return(
                  <div key={arc.name} style={{marginBottom:14,padding:"18px 20px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.offWhite}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,borderRadius:8,background:arc.bg,border:`1.5px solid ${arc.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{arc.icon}</div>
                        <div>
                          <div style={{fontSize:15,fontWeight:700,color:C.title,lineHeight:1.2}}>{arc.name}</div>
                          <div style={{fontSize:11,color:C.muted,fontStyle:"italic"}}>{arc.tagline}</div>
                        </div>
                      </div>
                      {diff!==0&&(
                        <div style={{display:"flex",alignItems:"center",gap:6,background:diff>0?"rgba(26,122,74,0.08)":"rgba(192,57,43,0.08)",border:`1px solid ${diff>0?"rgba(26,122,74,0.25)":"rgba(192,57,43,0.25)"}`,borderRadius:20,padding:"4px 12px"}}>
                          <span style={{fontSize:15,color:diff>0?C.green:C.red}}>{diff>0?"▲":"▼"}</span>
                          <span style={{fontSize:13,fontWeight:800,color:diff>0?C.green:C.red}}>{Math.abs(diff)}pp</span>
                          <span style={{fontSize:11,color:C.muted,fontWeight:500}}>vs benchmark</span>
                        </div>
                      )}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                      {[
                        {lbl:"This room",    pct:room,  col:arc.color, sub:`${cnt} of ${tot}`},
                        {lbl:"2026 benchmark",pct:bench,col:C.muted,   sub:"Global sample"},
                      ].map(b=>(
                        <div key={b.lbl}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                            <span style={{fontSize:10,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:b.col}}>{b.lbl}</span>
                            <span style={{fontFamily:"'Montserrat',sans-serif",fontWeight:900,fontSize:28,color:b.col,lineHeight:1}}>{b.pct}%</span>
                          </div>
                          <div style={{height:10,background:C.border,borderRadius:5,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${b.pct}%`,background:b.col,borderRadius:5,opacity:b.col===C.muted?0.45:1,transition:"width 0.9s cubic-bezier(0.4,0,0.2,1)"}}/>
                          </div>
                          <div style={{fontSize:11,color:C.muted,marginTop:5}}>{b.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {tot>=5&&(()=>{
                const dominant=ARCHETYPES.reduce((a,b)=>(d[a.name]||0)>=(d[b.name]||0)?a:b);
                const pct=Math.round((d[dominant.name]||0)/tot*100);
                const bench=BENCHMARK[dominant.name];
                return(
                  <div style={{marginTop:8,background:dominant.bg,borderRadius:10,padding:"14px 20px",borderLeft:`4px solid ${dominant.color}`,display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:20}}>{dominant.icon}</span>
                    <div>
                      <span style={{fontSize:13,fontWeight:800,color:dominant.color}}>Room signal: </span>
                      <span style={{fontSize:13,color:C.body,lineHeight:1.6}}>
                        <strong>{pct}%</strong> of this audience identifies as <strong>{dominant.name}</strong> — {pct>bench?"above":"below"} the global benchmark of {bench}%.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </Card>

        <div style={{textAlign:"center",marginTop:16}}>
          <button style={{background:"none",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.25)",fontSize:12,padding:"8px 20px",borderRadius:8,cursor:"pointer"}}
            onClick={()=>setMode("landing")}>← Back to landing</button>
        </div>
      </Page>
    );
  }

  return null;
}
