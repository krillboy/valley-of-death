const {useMemo,useRef,useState} = React;
import { generateCompanyName } from './companyNameGenerator.js';

// ---------- UI primitives (self-contained; shadcn-like API) ----------
const cx=(...p)=>p.filter(Boolean).join(" ");
const Card=({className,style,children,...rest})=>(
  <div className={cx("rounded-2xl bg-white shadow-sm tia-card",className)} style={style} {...rest}>{children}</div>
);
const CardHeader=({className,children,...rest})=>(
  <div className={cx("p-4",className)} {...rest}>{children}</div>
);
const CardTitle=({className,children,...rest})=>(
  <div className={cx("text-sm font-semibold tracking-tight",className)} {...rest}>{children}</div>
);
const CardContent=({className,children,...rest})=>(
  <div className={cx("p-4 pt-0",className)} {...rest}>{children}</div>
);
const Button=({variant="default",size="md",className,children,...rest})=>{
  const base="inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes=size==="sm"?"h-8 px-3 text-xs":"h-10 px-4 text-sm";
  const styles=variant==="outline"?"tia-btn-outline":"tia-btn-pri";
  return <button className={cx(base,sizes,styles,className)} {...rest}>{children}</button>;
};
const Badge=({className,children,...rest})=>(
  <span className={cx("inline-flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs font-medium",className)} {...rest}>{children}</span>
);
const Progress=({value=0,className,...rest})=>{
  const v=Math.max(0,Math.min(100,value));
  return (
    <div className={cx("h-2 w-full rounded-full bg-gray-200",className)} {...rest}>
      <div className="h-2 rounded-full bg-slate-900" style={{width:`${v}%`}}/>
    </div>
  );
};

// ---------- Brand ----------
const BRAND={
  primary:getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim()||"#0b2e6b",
  primaryDark:getComputedStyle(document.documentElement).getPropertyValue("--brand-primary-dark").trim()||"#082356",
  primarySoft:getComputedStyle(document.documentElement).getPropertyValue("--brand-primary-soft").trim()||"#e8f0fb",
  accent:getComputedStyle(document.documentElement).getPropertyValue("--brand-accent").trim()||"#f39200",
  accentSoft:getComputedStyle(document.documentElement).getPropertyValue("--brand-accent-soft").trim()||"#fff4e5",
  text:getComputedStyle(document.documentElement).getPropertyValue("--brand-text").trim()||"#0b1220",
  border:getComputedStyle(document.documentElement).getPropertyValue("--brand-border").trim()||"#d9e2f2",
};
const LOGO_URL="https://therapeuticinnovation.com.au/wp-content/uploads/2022/07/Image-1.png";

// ---------- Gameplay ---------- including starting cash
const STARTING_CASH=Math.floor(Math.random() * 200000) + 400000;
const STAGES=[
  {key:"target_id",name:"TRL1 - Basic Science",baseP:0.45,costToTry:15000,color:"bg-blue-200"},
  {key:"target_val",name:"TRL2 - Target ID/Validation",baseP:0.50,costToTry:20000,color:"bg-blue-200"},
  {key:"hit_to_lead",name:"TRL3 - Hit-to-Lead",baseP:0.40,costToTry:50000,color:"bg-blue-300"},
  {key:"lead_opt",name:"TRL4 - Lead Optimisation",baseP:0.45,costToTry:200000,color:"bg-blue-300"},
  {key:"preclinical",name:"TRL5 - Preclinical (PD/PK & Tox)",baseP:0.35,costToTry:300000,color:"bg-yellow-300"},
  {key:"ph1",name:"TRL6 - Phase I (Safety)",baseP:0.75,costToTry:500000,color:"bg-orange-300"},
  {key:"ph2",name:"TRL7 - Phase II (Proof of Concept)",baseP:0.40,costToTry:2000000,color:"bg-orange-400"},
  {key:"ph3",name:"TRL8 - Phase III (Pivotal)",baseP:0.60,costToTry:5000000,color:"bg-red-300"},
  {key:"approval",name:"TRL9 - Regulatory Approval",baseP:0.92,costToTry:250000,color:"bg-green-300"},
];

// ----------- STARTING conditions ----------- random

const INIT={
  cash:STARTING_CASH,quarter:1,year:1,stageIdx:0,
  dataQuality:Math.floor(Math.random() * 5) / 10,toxRisk:Math.floor(Math.random() * 5) / 10,ipStrength:Math.floor(Math.random() * 5) / 10,reputation:Math.floor(Math.random() * 5) / 10,
  dilution:0.0,rounds:[]
};

const clamp01=(x)=>Math.max(0,Math.min(1,x));
const rand=()=>Math.random();
const rollChance=(p)=>rand()<p;
const rint=(a,b)=>a+Math.floor(rand()*(b-a+1));
const computeQuartersElapsed=(s)=> (s.year-1)*4 + (s.quarter-1);

const ACTIONS=[
  {key:"invest_science",name:"Invest in Science",desc:"Fund SAR/assays to raise data quality and reduce unknowns.",cost:25000,
   apply:(s)=>({dataQuality:clamp01(s.dataQuality+0.1+rand()*0.05),reputation:clamp01(s.reputation+0.01)})},
  {key:"partnership",name:"Partner / Grant / Fundraise",desc:"Pursue TIA vouchers, grants or VC rounds.",cost:5000,
    apply:()=>({})},
  {key:"de_risk_tox",name:"Run Tox De-Risking",desc:"In-depth tox/translational work.",cost:350000,
   apply:(s)=>({toxRisk:clamp01(s.toxRisk-(0.1+rand()*0.06)),dataQuality:clamp01(s.dataQuality+0.02)})},
  {key:"strengthen_ip",name:"Strengthen IP",desc:"File patents or in-license chemistry.",cost:200000,
   apply:(s)=>({ipStrength:clamp01(s.ipStrength+0.1+rand()*0.05),reputation:clamp01(s.reputation+0.02)})},
  ];

const StageBadge=({idx,cur})=>{
  const st=STAGES[idx],isDone=idx<cur,isActive=idx===cur;
  return (
    <Badge className={cx(isActive?"":isDone?"bg-[rgba(11,46,107,0.06)]":"bg-white","px-3 py-2 rounded-2xl")}
           style={{borderColor:BRAND.border,color:BRAND.text}}
           title={`Gate cost $${formatGameMoney(st.costToTry)}`}>
      <span className={cx("w-2.5 h-2.5 rounded-full",isDone?"bg-green-500":isActive?"bg-black":"bg-gray-400")}/>
      <span className="text-xs sm:text-sm font-medium">{st.name}</span>
    </Badge>
  );
};

const Stat=({label,value,tooltip})=>{
  const pct=Math.round(value*100);
  return (
    <Card className="bg-white" style={{borderColor:BRAND.border}}>
      <CardHeader className="py-3"><CardTitle className="text-xs" title={tooltip}>{label}</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between text-xs mb-1"><span>{pct}%</span></div>
        <Progress value={pct}/>
      </CardContent>
    </Card>
  );
};
// ---------- Currency formatting helper code

function formatGameMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const oneDec = (x) => x.toFixed(1);

  // Rollover thresholds so you don't get "$1000.0k", it becomes "$1.0M" instead
  const K_TO_M = 999_950;       // ~999.95k -> $1.0M
  const M_TO_B = 999_950_000;   // ~999.95M -> $1.0B

  if (abs >= 1_000_000_000 || abs >= M_TO_B) {
    return `${sign}$${oneDec(abs / 1_000_000_000)}B`;
  }

  if (abs >= 1_000_000 || abs >= K_TO_M) {
    return `${sign}$${oneDec(abs / 1_000_000)}M`;
  }

  if (abs >= 1_000) {
    return `${sign}$${oneDec(abs / 1_000)}k`;
  }

  // Under 1000 → keep as whole dollars, no decimal
  return `${sign}$${Math.round(abs)}`;
}

// ---------- Main game component ----------


function ValleyOfDeathGame({ companyName }){
  const [state,setState]=useState(INIT);
  const [log,setLog]=useState([`Welcome to your new role as CEO of a small Australian Biotech company ${companyName}! Navigate ${companyName} through the drug discovery journey. Earlier stages are mor[...]
  const [selectedAction,setSelectedAction]=useState(null);
  const [lastRoll,setLastRoll]=useState(null);
  const [fundingType,setFundingType]=useState(null);
  const [justApproved,setJustApproved]=useState(false);
  const [cssFullscreen,setCssFullscreen]=useState(false);
  const rootRef=useRef(null);

  const canUseNativeFS=(el)=>{
    if(typeof document==="undefined") return false;
    const d=document;
    return !!(d.fullscreenEnabled && el && (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen));
  };
  const enterNativeFS=async(el)=>{ if(el.requestFullscreen) return el.requestFullscreen(); if(el.webkitRequestFullscreen) return el.webkitRequestFullscreen(); if(el.msRequestFullscreen) return el.msRe[...]
  const exitNativeFS=async()=>{ const d=document; if(d.exitFullscreen) return d.exitFullscreen(); if(d.webkitExitFullscreen) return d.webkitExitFullscreen(); if(d.msExitFullscreen) return d.msExitFull[...]

  const addLog=(entry)=> setLog((l)=>[entry,...l].slice(0,200));
  const toggleFullscreen=async()=>{
    const el=rootRef.current;
    try{
      if(typeof document==="undefined"){ setCssFullscreen(v=>!v); return; }
      const d=document;
      if(!d.fullscreenElement){
        if(canUseNativeFS(el)){ await enterNativeFS(el); }
        else { setCssFullscreen(true); addLog("Fullscreen API unavailable; using CSS fullscreen."); }
      } else { await exitNativeFS().catch(()=>{}); setCssFullscreen(false); }
    } catch { setCssFullscreen(v=>!v); addLog("Fullscreen not permitted; toggled CSS fullscreen instead."); }
  };

  const curStage=STAGES[state.stageIdx];
  const advanceChance=useMemo(()=> clamp01(curStage.baseP + 0.35*state.dataQuality - 0.4*state.toxRisk + 0.12*state.ipStrength + 0.1*state.reputation),
    [state.dataQuality,state.toxRisk,state.ipStrength,state.reputation,curStage]
  );

  const quartersElapsed=computeQuartersElapsed(state);
  const currentBurn=50000 + state.stageIdx*5000;

  const minActionCost=Math.min(...ACTIONS.map(a=>a.cost));
  const anyAffordableAction=state.cash>=minActionCost;
  const canAttemptGate=state.cash>=curStage.costToTry;
  const canPayBurn=state.cash>=currentBurn;
  const approved=state.stageIdx>=STAGES.length-1;
  const bankrupt=((!anyAffordableAction && !canAttemptGate) || !canPayBurn) && !approved;

  const spend=(cost)=>{
    if(state.cash<cost){ addLog("Not enough cash."); return false; }
    setState((s)=>({...s,cash:s.cash-cost}));
    return true;
  };

  const doFundraise=()=>{
    if(!fundingType || fundingType==="voucher"){
      const success=rand()<0.5;
      if(success){
        const amt=rint(10000,50000);
        setState((s)=>({...s,cash:s.cash+amt,reputation:clamp01(s.reputation+0.03)}));
        addLog(`Voucher success: +$${amt}`);
      } else addLog("Grant unsuccessful.");
      return;
    }
    const cfg={ seed:{base:0.6,min:200000,max:350000,dil:0.06,prereq:0}, seriesA:{base:0.5,min:500000,max:900000,dil:0.13,prereq:4}, seriesB:{base:0.4,min:800000,max:1600000,dil:0.15,prereq:5} };
    const r=cfg[fundingType];
    if(!r) return;
    if(state.stageIdx<r.prereq){ addLog(`Too early for ${fundingType}`); return; }
    const p=clamp01(r.base + 0.3*(state.reputation-0.5) - 0.1*(state.toxRisk-0.2));
    if(rollChance(p)){
      const amt=rint(r.min,r.max);
      setState((s)=>({...s,cash:s.cash+amt,dilution:clamp01(s.dilution+r.dil),rounds:[...s.rounds,{type:fundingType,amount:amt,year:s.year,quarter:s.quarter}]}));
      addLog(`${String(fundingType).toUpperCase()} success +$${amt}`);
    } else addLog(`${fundingType} failed`);
  };

  const applyAction=(a)=>{
    if(!a) return;
    if(approved){ addLog("Game complete - actions are disabled after approval."); return; }
    if(!spend(a.cost)) return;
    if(a.key==="partnership"){ addLog(`Action: ${a.name}`); doFundraise(); return; }
    setState((s)=>({...s,...a.apply(s)}));
    addLog(`Action: ${a.name}`);
  };

  const randomEvent=()=>{
    const EVENTS=[
      {name:"Toxicology Signal",weight:0.12,effect:(s)=>({toxRisk:clamp01(s.toxRisk+0.05+rand()*0.05),reputation:clamp01(s.reputation-0.03)}),text:"Unexpected tox finding."},
      {name:"Assay Breakthrough",weight:0.15,effect:(s)=>({dataQuality:clamp01(s.dataQuality+0.12+rand()*0.05)}),text:"Assay boost raises confidence."},
      {name:"Grant Awarded",weight:0.12,effect:(s)=>({cash:s.cash+15+Math.floor(rand()*6),reputation:clamp01(s.reputation+0.04)}),text:"Non-dilutive grant funding."},
    ];
    const sum=EVENTS.reduce((acc,e)=>acc+e.weight,0);
    if(rand()<0.35){
      const r=rand()*sum; let acc=0;
      for(const e of EVENTS){ acc+=e.weight; if(r<=acc){ setState((s)=>({...s,...e.effect(s)})); addLog(`Event: ${e.name} - ${e.text}`); break; } }
    }
  };

  const nextQuarter=()=>{
    if(approved){ addLog("Game complete - time no longer advances after approval."); return; }
    if(selectedAction) applyAction(selectedAction);
    if(!canPayBurn){ addLog(`Cannot end quarter: need $${currentBurn.toFixed(1)} to cover burn.`); return; }
    const burn=currentBurn;
    setState((s)=>({...s,cash:s.cash-burn,quarter:(s.quarter===4?1:(s.quarter+1)),year:(s.quarter===4?s.year+1:s.year)}));
    addLog(`Burn -$${burn.toFixed(1)}`);
    randomEvent();
    setSelectedAction(null);
    setFundingType(null);
  };

  const attemptAdvance=()=>{
    if(approved){ addLog("Game complete - no further gates to attempt."); return; }
    if(!spend(curStage.costToTry)) return;
    const p=advanceChance,success=rollChance(p);
    setLastRoll({p,success});
    if(success){
      addLog(`Advanced past ${curStage.name}`);
      setState((s)=>{
        const nextIdx=Math.min(s.stageIdx+1,STAGES.length-1);
        const reachApproval=nextIdx>=STAGES.length-1;
        if(reachApproval) setJustApproved(true);
        return {...s,stageIdx:nextIdx,reputation:clamp01(s.reputation+0.04)};
      });
    } else addLog(`Failed gate: ${curStage.name}`);
  };

  const restart=()=>{
    setState(INIT); setLog(["New run started."]); setSelectedAction(null); setLastRoll(null); setFundingType(null); setJustApproved(false); setCssFullscreen(false);
  };

  return (
    <div ref={rootRef} className={`${cssFullscreen?"fixed inset-0 z-50":""} min-h-dvh overflow-hidden px-4 py-6 sm:p-8`}
         style={{background:`linear-gradient(180deg, ${BRAND.primarySoft}, #ffffff)`,color:BRAND.text}}>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {LOGO_URL ? <img src={LOGO_URL} alt="Therapeutic Innovation Australia" className="h-10 w-auto"/> :
              <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold" style={{backgroundColor:BRAND.accent,color:BRAND.text}}>TIA</div>}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{companyName} Crosses the Valley of Death!</h1>
              <p className="text-sm" style={{color:BRAND.primaryDark}}>Take a small molecule drug from discovery to the market</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleFullscreen}>{cssFullscreen?"Exit Fullscreen":"Fullscreen"}</Button>
            <Button title="Click to restart - refresh page for new starting values" onClick={restart}>Restart</Button>
            {typeof window.handleBackToLanding === "function" && (
              <Button variant="outline" onClick={window.handleBackToLanding} title="Go back to the main menu">Main menu</Button>
            )}
          </div>
        </header>

        <div className="grid sm:grid-cols-5 gap-3 mb-6">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Cash available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatGameMoney(state.cash)}</div><[...]
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Time</CardTitle></CardHeader><CardContent><div className="font-semibold">Year {state.year} • Q{state.quarter}</div><div cl[...]
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Development stage</CardTitle></CardHeader><CardContent><div className="font-semibold">{curStage.name}</div><div className="t[...]
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Chance of successfully advancing</CardTitle></CardHeader><CardContent><div className="text-2xl font-extrabold">{Math.round(a[...]
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Dilution</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.round(state.dilution*100)}%</di[...]
        </div>

        <div className="flex flex-wrap gap-2 mb-6">{STAGES.map((st,i)=>(<StageBadge key={st.key} idx={i} cur={state.stageIdx}/>))}</div>

        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <Stat label="Data Quality" value={state.dataQuality} tooltip="Strength of evidence supporting mechanism of action and translatability."/>
          <Stat label="Toxicological Safety" value={1-state.toxRisk} tooltip="Higher toxicology safety is better."/>
          <Stat label="IP Strength" value={state.ipStrength} tooltip="Patent position & freedom-to-operate."/>
          <Stat label={`Reputation of ${companyName}`} value={state.reputation} tooltip="Investor/partner confidence and general good vibes."/>
        </div>

        {(!approved && bankrupt) && (
          <Card className="mb-6" style={{borderColor:"#f2b8b8",backgroundColor:"#fff5f5"}}>
            <CardHeader><CardTitle>GAME OVER: Insufficient funds. Time to dust off the CV.</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm" style={{color:"#7f1d1d"}}>
                You cannot afford any action (min action cost {formatGameMoney(minActionCost)}) nor the next gate (cost {formatGameMoney(curStage.costToTry)}), or you cannot cover the quarterly b[...]
              </p>
              <div className="text-xs mt-1" style={{color:"#7f1d1d"}}>
                Minimum action cost: {formatGameMoney(minActionCost)} • Gate cost: {formatGameMoney(curStage.costToTry)} • Burn this quarter: {formatGameMoney(currentBurn.toFixed(1))}
              </div>
              <div className="mt-3"><Button onClick={restart}>Start New Game</Button></div>
            </CardContent>
          </Card>
        )}

        {approved && (
          <Card className="mb-6" style={{borderColor:"#b7e4c7",backgroundColor:"#ecfdf5"}}>
            <CardHeader><CardTitle>GAME OVER: Regulatory Approval Achieved 🎉</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm" style={{color:"#065f46"}}>Congratulations, you crossed the Valley of Death!</p>
              <div className="text-xs mt-1" style={{color:"#065f46"}}>
                Time: Year {state.year} • Q{state.quarter} • Elapsed {quartersElapsed} quarters • Remaining cash: {formatGameMoney(state.cash)} • Dilution: {Math.round(state.dilution*100)[...]
              </div>
              {justApproved && (<div className="text-xs mt-1" style={{color:"#065f46"}}>This is the end of the game. Well done!</div>)}
              <div className="mt-3"><Button onClick={restart}>Play Again</Button></div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg">Choose your business or research strategy for this Quarter</CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ACTIONS.map((a)=>(
                    <Button key={a.key}
                            variant={selectedAction?.key===a.key?"default":"outline"}
                            className={cx("h-auto py-3 flex flex-col items-start",selectedAction?.key===a.key?"":"border")}
                            style={{backgroundColor:selectedAction?.key===a.key?BRAND.accent:undefined,color:selectedAction?.key===a.key?BRAND.text:undefined}}
                            onClick={()=>setSelectedAction(a)}
                            disabled={approved||bankrupt||state.cash<a.cost}
                            title={state.cash<a.cost?`Need ${formatGameMoney(a.cost)}`:undefined}>
                      <span className="text-sm font-semibold">{a.name}</span>
                      <span className="text-xs">{a.desc}</span>
                      <span className="text-xs font-mono">{`Cost: ${formatGameMoney(a.cost)}`}</span>
                    </Button>
                  ))}
                </div>

                {selectedAction?.key==="partnership" && (
                  <div className="mt-4 p-3 rounded-xl border" style={{borderColor:BRAND.border,backgroundColor:BRAND.accentSoft}}>
                    <div className="text-sm font-semibold mb-2">Choose source of funding</div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={fundingType==="voucher"?"default":"outline"} style={{backgroundColor:fundingType==="voucher"?BRAND.accent:undefined}} onClick={()=>setFundingType("vouc[...]
                      <Button size="sm" variant={fundingType==="seed"?"default":"outline"} style={{backgroundColor:fundingType==="seed"?BRAND.accent:undefined}} onClick={()=>setFundingType("seed")} di[...]
                      <Button size="sm" variant={fundingType==="seriesA"?"default":"outline"} style={{backgroundColor:fundingType==="seriesA"?BRAND.accent:undefined}} onClick={()=>setFundingType("seri[...]
                      <Button size="sm" variant={fundingType==="seriesB"?"default":"outline"} style={{backgroundColor:fundingType==="seriesB"?BRAND.accent:undefined}} onClick={()=>setFundingType("seri[...]
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={nextQuarter}
                          disabled={approved||bankrupt||!canPayBurn}
                          title={!canPayBurn?`Need $${formatGameMoney(currentBurn.toFixed(1))} to cover burn`:undefined}>
                    End Quarter
                  </Button>
                  <Button onClick={attemptAdvance}
                          disabled={approved||bankrupt||!canAttemptGate}
                          title={!canAttemptGate?`Need $${formatGameMoney(curStage.costToTry)}`:undefined}>
                    Attempt to move to the next TRL stage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Timeline{companyName ? ` for ${companyName}` : ''}</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm max-h-[560px] overflow-auto">
                  {log.map((l,i)=>(<li key={i}>• {l}</li>))}
                </ul>
                {state.rounds.length>0 && (
                  <div className="mt-4 p-3 rounded-xl border" style={{borderColor:BRAND.border,backgroundColor:BRAND.accentSoft}}>
                    <div className="text-sm font-semibold mb-2">Fundraising History</div>
                    <ul className="text-xs space-y-1">
                      {state.rounds.map((r,i)=>(<li key={i}>Y{r.year}Q{r.quarter}: {r.type}+${r.amount}</li>))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- LandingPage component inline ---
function LandingPage({ setCompanyName }) {
  const [localName, setLocalCompanyName] = React.useState("");
  const handleGenerate = () => {
    const name = generateCompanyName();
    setLocalCompanyName(name);
  };
  return (
    <div style={{ textAlign: "center", marginTop: "10vh" }}>
      <h1>TIA Presents: Cross the Valley of Death!</h1>
      <p>Landing page loaded successfully.</p>
      <p>Generate your fictitious biotech company name to start:</p>
      {!localName ? (
        <button onClick={handleGenerate} style={{ fontSize: "1.2em", padding: "10px 20px" }}>Generate Company Name</button>
      ) : (
        <div style={{ marginTop: "2em" }}>
          <h2>Your Company:</h2>
          <div style={{ fontSize: "2em", fontWeight: "bold" }}>{localName}</div>
          <div style={{ marginTop: "1em" }}>
            <button onClick={handleGenerate} style={{ fontSize: "1em", marginRight: "10px", padding: "8px 16px" }}>Regenerate Name</button>
            <button onClick={() => setCompanyName(localName)} style={{ fontSize: "1em", padding: "8px 16px" }}>Start Game</button>
          </div>
        </div>
      )}
      <div style={{ marginTop: "3em", color: "#888", fontSize: "0.9em" }}>
        <span>LandingPage component rendered FUNCTION CHECK.</span>
      </div>
    </div>
  );
}

// --- App wrapper ---
function App() {
  const [companyName, setCompanyName] = React.useState("");
  const [showLanding, setShowLanding] = React.useState(true);
  const handleStartGame = (name) => {
    setCompanyName(name);
    setShowLanding(false);
  };
  window.handleBackToLanding = () => {
    setShowLanding(true);
    setCompanyName("");
  };
  return (
    showLanding ? (
      <LandingPage setCompanyName={handleStartGame} />
    ) : (
      <ValleyOfDeathGame companyName={companyName} />
    )
  );
}

// Patch ValleyOfDeathGame to accept companyName and onBack
// ...existing ValleyOfDeathGame definition above...

ReactDOM.createRoot(document.getElementById("tia-game-root")).render(<App/>);
