/* ΔTOM // CRISIS MAP — interactive donut, micro-store, auto-cycle */
(() => {
  'use strict';
  const CRISES = [
    { id:0, color:'#ef4444', eyebrow:'01 / BILLING CASCADE', title:'Payment failure breaks the API access chain', weight:'28% of failure surface', body:'Two consecutive $50 payment failures (May 18) triggered Perplexity API access loss, cascading into ATOM and AntimatterAI outages. Six days of degraded service from a payment routing issue, not infrastructure.', evidence:['📧 May 18 — "$50 payment to Perplexity AI unsuccessful" ×2','📧 May 24 — "Billing correction to your organization\'s account"','⚡ Downstream: ATOM sales automation flows interrupted'], fixes:['Akamai Edge Auth + API Gateway with fallback credential routing','Circuit-breaker: reroute to backup API key on payment failure','Webhook failover: Stripe failure → Akamai policy swap <500ms'], metrics:[{val:'<500ms',label:'Failover time'},{val:'99.99%',label:'Uptime target'},{val:'0',label:'Manual steps'}] },
    { id:1, color:'#f5b942', eyebrow:'02 / ORCHESTRATION CHAOS', title:'Multi-cloud without a convergence control plane', weight:'24% of failure surface', body:'AWS, Microsoft Foundry, and CoreWeave each operate as rational independent systems. Without a shared abstraction layer, incidents become multi-vendor blame spirals. Jouni Welander\'s Akamai sync (May 21) directly references this as the primary opportunity vector.', evidence:['📧 May 21 — Akamai sync: "Perplexity multi-cloud model (AWS..." [Welander]','📧 May 20 — "Re: Perplexity - Akamai" threads: Pare, McKay, Holcombe','🏗️ Stack: AWS + $750M Foundry deal + CoreWeave GB200 NVL72'], fixes:['Akamai AI Grid as single convergence fabric above AWS/Foundry/CoreWeave','Workload-aware routing: cost-per-token, TTFT, and provider health','One operational owner for user-facing distribution — one SLA'], metrics:[{val:'3→1',label:'Control planes'},{val:'4,400+',label:'Edge POPs'},{val:'2.5×',label:'Latency reduction'}] },
    { id:2, color:'#00e6d3', eyebrow:'03 / LATENCY & TTFT SPIKES', title:'Peak-hour TTFT degrades from centralized origin topology', weight:'22% of failure surface', body:'Every query routes from centralized AWS/CoreWeave origins. Under peak load, TTFT spikes as requests queue at datacenter boundaries. Structural — not a capacity issue, a topology issue that compounds with scale.', evidence:['📧 May 14 — "Re: Perplexity DR with Akamai" — Pare: "Perplexity — love it"','📧 May 13 — "Re: New Reg-Perplexity-Akamai" — DR implies SLA gaps','🏗️ CoreWeave NVL72: high-density inference still suffers centralized first-mile'], fixes:['Distribute inference to nearest of 4,400+ Akamai edge POPs','Sub-50ms TTFT target for real-time search via AI Grid','Semantic caching: eliminate repeat-token compute at the edge'], metrics:[{val:'<50ms',label:'TTFT target'},{val:'86%',label:'Cost savings'},{val:'18%+',label:'Cache hit rate'}] },
    { id:3, color:'#5aa4f7', eyebrow:'04 / SUPPORT FRAGMENTATION', title:'Incidents straddle three vendor SLA boundaries', weight:'15% of failure surface', body:'When an incident touches AWS, Foundry, and CoreWeave, tickets open with three vendors — each pointing at the others. No single throat to choke. Active Akamai thread (Pare, McKay, Holcombe, Welander) signals Akamai is positioning to own this accountability gap.', evidence:['📧 May 21 — "Canceled: Perplexity - Akamai" then rescheduled same day','📧 May 21 — 3 Akamai reps active: Welander, Holcombe, McKay','📧 May 20 — Matt Pare + Neil McKay coordination threads'], fixes:['Akamai becomes single point of accountability for user-facing distribution','Unified observability: one dashboard for routing, latency, incidents','Region-aware routing keeps compliance traffic geographically contained'], metrics:[{val:'1',label:'SLA owner'},{val:'3→1',label:'Vendor tickets'},{val:'24/7',label:'NOC coverage'}] },
    { id:4, color:'#a855f7', eyebrow:'05 / EGRESS COST DRAG', title:'Cross-cloud traffic quietly compounds at scale', weight:'11% of failure surface', body:'Every query crossing AWS → Foundry → CoreWeave boundaries carries egress costs that compound as volume scales. At Perplexity traffic levels, fractional per-GB cross-cloud costs accumulate into material spend drag — invisible short-term, catastrophic at scale.', evidence:['📊 86% AI inference cost savings cited by Akamai AI Grid','📊 Multi-cloud egress: industry standard $0.08–$0.12/GB cross-region','📧 May 22 — Perplexity Enterprise "Sub-processor Update" supply chain expansion'], fixes:['Semantic caching at the edge eliminates repeat cross-cloud token fetches','Intelligent routing minimizes cross-provider traffic from nearest POP','Token economics control plane: workload-aware cost-per-token optimization'], metrics:[{val:'86%',label:'Inference savings'},{val:'↓60%',label:'Egress estimate'},{val:'18%+',label:'Cache offload'}] },
  ];
  let _i=0; const _s=new Set();
  const store={get:()=>_i,set:(i)=>{if(i===_i)return;_i=i;_s.forEach(f=>f(i));},subscribe:(f)=>{_s.add(f);return()=>_s.delete(f);}};
  function render(idx){
    const d=CRISES[idx],el=document.getElementById('crisis-detail-inner');
    if(!el)return;
    el.innerHTML=`<div class="cd-eyebrow" style="color:${d.color}"><span class="cd-pip" style="background:${d.color}"></span>${d.eyebrow}</div><div class="cd-title">${d.title}</div><div class="cd-weight">${d.weight}</div><p class="cd-body">${d.body}</p><div class="cd-evidence"><strong>// Live evidence</strong>${d.evidence.map(e=>`<div>${e}</div>`).join('')}</div><div class="cd-fix-label">// Akamai convergence fix</div><ul class="cd-fix-list">${d.fixes.map(f=>`<li style="color:${d.color}">${f}</li>`).join('')}</ul><div class="cd-metrics">${d.metrics.map(m=>`<div class="cd-metric" style="border-color:color-mix(in srgb,${d.color} 30%,transparent)"><b style="color:${d.color}">${m.val}</b><span>${m.label}</span></div>`).join('')}</div>`;
    el.style.animation='none';void el.offsetHeight;el.style.animation='';
    const p=document.getElementById('crisis-detail');if(p)p.style.borderColor=`color-mix(in srgb,${d.color} 35%,transparent)`;
  }
  function sync(i){
    document.querySelectorAll('.crisis-seg').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.seg,10)===i));
    document.querySelectorAll('.crisis-pill').forEach(p=>p.classList.toggle('active',parseInt(p.dataset.seg,10)===i));
    render(i);
  }
  let _t=null;
  const go=()=>{_t=setInterval(()=>store.set((store.get()+1)%CRISES.length),5200);};
  const stop=()=>{clearInterval(_t);_t=null;};
  function init(){
    document.querySelectorAll('.crisis-seg').forEach(s=>s.addEventListener('click',()=>{stop();store.set(parseInt(s.dataset.seg,10));}));
    document.querySelectorAll('.crisis-pill').forEach(p=>p.addEventListener('click',()=>{stop();store.set(parseInt(p.dataset.seg,10));}));
    const stage=document.getElementById('crisis-donut-stage');
    if(stage){
      stage.setAttribute('tabindex','0');
      stage.addEventListener('keydown',(e)=>{
        const c=store.get();
        if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();store.set((c+1)%CRISES.length);}
        else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();store.set((c-1+CRISES.length)%CRISES.length);}
        else if(e.key>='1'&&e.key<='5')store.set(Number(e.key)-1);
      });
      stage.addEventListener('mouseenter',stop);stage.addEventListener('mouseleave',go);
    }
    store.subscribe(sync);sync(0);go();
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
  window.CrisisMapStore=store;window.CRISIS_DATA=CRISES;
})();
