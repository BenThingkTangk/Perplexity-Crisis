/* =====================================================================
   ΔTOM // Crisis Intelligence — interactions
   - Theme toggle (dark / light), defaults dark
   - Scroll reveals
   - Count-up KPI animation (in-view trigger)
   - Architecture stage mode toggle (crisis / convergence)
   - Crisis stack expandable cards
   - Akamai value flywheel (interactive node selector)
   - Pilot model — live calculator + animated bars
   - Evidence list + drawer + sources
   - Mobile nav toggle
   - Honors prefers-reduced-motion
   ===================================================================== */

(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ΔTOM boot loader: dismiss once the page is ready (fast under reduced motion)
  const dtomBoot = document.getElementById('dtom-boot');
  if (dtomBoot) {
    const hideAfter = reduceMotion ? 250 : 900;
    const dismiss = () => dtomBoot.setAttribute('data-state', 'done');
    if (document.readyState === 'complete') {
      setTimeout(dismiss, hideAfter);
    } else {
      window.addEventListener('load', () => setTimeout(dismiss, hideAfter), { once: true });
    }
  }

  /* ------------ Sources data ------------ */
  const SOURCES = [
    {
      tag: 'Reuters',
      date: 'Jan 29, 2026',
      title: 'Perplexity signs $750M, three-year Microsoft deal',
      summary: 'Microsoft says Perplexity selected Microsoft Foundry as its main AI platform for acquiring models — providing access to OpenAI, Anthropic, and xAI models. Reuters notes AWS remains Perplexity\'s primary cloud provider.',
      url: 'https://www.reuters.com/business/perplexity-signs-750-million-ai-cloud-deal-with-microsoft-bloomberg-news-reports-2026-01-29/'
    },
    {
      tag: 'CoreWeave Investor Relations',
      date: 'Mar 4, 2026',
      title: 'CoreWeave to power Perplexity\'s AI inference workloads',
      summary: 'Multi-year strategic partnership using dedicated NVIDIA GB200 NVL72-powered clusters. CoreWeave: "Perplexity\'s AI products operate continuously in real-world environments where inference performance and reliability directly affect UX."',
      url: 'https://investors.coreweave.com/news/news-details/2026/CoreWeave-Announces-Agreement-to-Power-Perplexitys-AI-Inference-Workloads/default.aspx'
    },
    {
      tag: 'AWS — Customer case study',
      date: 'Primary',
      title: 'Perplexity on AWS — EC2, P4de, P5, SageMaker HyperPod',
      summary: 'EC2 for backend, frontend, and search. P4de for training, P5 for inference. HyperPod for large-scale training and fine-tuning — up to 40% reduction in training time and 2× training throughput. Supports 10,000 concurrent users and 100,000+ queries per hour.',
      url: 'https://aws.amazon.com/solutions/case-studies/perplexity-case-study/'
    },
    {
      tag: 'Akamai Newsroom',
      date: 'Press release',
      title: 'Akamai to deploy thousands of NVIDIA Blackwell GPUs',
      summary: 'A distributed AI platform across Akamai\'s global edge network of more than 4,400 locations — up to 2.5× latency reduction vs traditional hyperscaler infrastructure and as much as 86% AI inference cost savings.',
      url: 'https://www.akamai.com/newsroom/press-release/akamai-to-deploy-thousands-of-nvidia-blackwell-gpus-to-create-one-of-the-worlds-most-widely-distributed-ai-platforms'
    },
    {
      tag: 'Akamai Newsroom',
      date: 'Press release',
      title: 'Akamai launches AI Grid — intelligent orchestration',
      summary: 'Distributed inference across 4,400+ edge locations. AI Grid is described as a real-time broker for AI requests with semantic caching, intelligent routing, and a workload-aware control plane optimizing cost-per-token, time-to-first-token, and throughput — sub-50ms inference for select real-time workloads.',
      url: 'https://www.akamai.com/newsroom/press-release/akamai-launches-ai-grid-intelligent-orchestration-for-distributed-inference-across-4400-edge-locations'
    },
    {
      tag: 'CNBC',
      date: 'Mar 10, 2026',
      title: 'Amazon wins court order to block Perplexity\'s Comet shopping agent',
      summary: 'Amazon won a preliminary injunction blocking Perplexity\'s Comet AI shopping agent from using its platform. Dispute centers on Comet accessing Amazon at user direction without Amazon authorization. Perplexity says it will continue fighting for users\' ability to choose any AI.',
      url: 'https://www.cnbc.com/2026/03/10/amazon-wins-court-order-to-block-perplexitys-ai-shopping-agent.html'
    },
    {
      tag: 'Live evidence · Mailbox',
      date: 'May 18, 2026',
      title: 'Two consecutive $50 payment failures from the Perplexity failed-payments billing inbox',
      summary: 'At 20:22:47 and 20:23:12 UTC, two $50.00 charges failed against the Perplexity billing endpoint, breaking API access and cascading into downstream integration outages. Direct evidence for the Billing Cascade failure mode.',
      url: '#crisis-map'
    },
    {
      tag: 'Live evidence · Mailbox',
      date: 'May 25, 2026',
      title: 'Perplexity billing correction — credits refunded, bonus credits granted',
      summary: 'The Perplexity team billing email issued a billing correction reinstating credit usage, refunding purchases during the impacted period, and granting bonus credits — confirming the May 18 failure was a billing-system issue, not infrastructure scarcity.',
      url: '#crisis-map'
    },
    {
      tag: 'Live evidence · Mailbox',
      date: 'May 22, 2026',
      title: 'Perplexity Sub-processor Update — Polytomic Inc. added (effective June 8, 2026)',
      summary: 'Perplexity team notice announcing Polytomic Inc. as a new data sub-processor to move and update data between Perplexity\'s data warehouse and CRM systems. Direct signal of supply-chain expansion under the same orchestration regime.',
      url: '#crisis-map'
    },
    {
      tag: 'Live evidence · Akamai',
      date: 'May 20–27, 2026',
      title: 'Akamai ↔ Perplexity field engagement threads',
      summary: 'Sustained Akamai field-engagement correspondence with Perplexity through the May 18–25 incident window. Akamai field-team sync notes reference Perplexity\'s multi-cloud model and orchestration fragmentation as the primary opportunity vector.',
      url: '#crisis-map'
    },
    {
      tag: 'Intake channel · Discord',
      date: 'Live · pending connector auth',
      title: 'Discord → GitHub bot wired at /api/discord-webhook',
      summary: 'Discord intake path is deployed (api/discord-github-bot.js) and triggers on 🐛 🚨 ⚠️ 🔥 or !issue prefixes — auto-filing GitHub issues with author, channel, timestamp, and priority. Live Discord message extraction is gated on connector authentication; no Discord content is fabricated in this brief.',
      url: '/api/discord-webhook'
    }
  ];

  /* ------------ Helpers ------------ */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const hostname = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

  /* ------------ Theme toggle ------------ */
  const themeBtn = $('[data-theme-toggle]');
  const moonIcon = themeBtn?.querySelector('.icon-moon');
  const sunIcon  = themeBtn?.querySelector('.icon-sun');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    if (moonIcon && sunIcon) {
      moonIcon.style.display = t === 'dark' ? '' : 'none';
      sunIcon.style.display  = t === 'dark' ? 'none' : '';
    }
    themeBtn?.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} mode`);
  };
  setTheme('dark');
  themeBtn?.addEventListener('click', () => {
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ------------ Mobile nav ------------ */
  const navToggle = $('[data-nav-toggle]');
  const navLinks  = $('#primary-nav');
  navToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ------------ Header scroll state ------------ */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------ Reveal animations ------------ */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.16 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ------------ KPI count-up ------------ */
  const counters = $$('.counter[data-target]');
  const fmt = (val, prefix = '', suffix = '', target = 0) => {
    let body;
    // Decide format based on the *target* value, not the current eased value,
    // so animation looks consistent.
    const showDecimal = target % 1 !== 0;
    if (showDecimal) {
      body = val.toFixed(1);
    } else if (target >= 1000) {
      body = Math.round(val).toLocaleString();
    } else {
      body = Math.round(val).toString();
    }
    return `${prefix}${body}${suffix}`;
  };
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.target.dataset.done) return;
        entry.target.dataset.done = 'true';
        entry.target.closest('.metric')?.classList.add('in-view');
        const target = parseFloat(entry.target.dataset.target);
        const prefix = entry.target.dataset.prefix || '';
        const suffix = entry.target.dataset.suffix || '';
        if (reduceMotion) {
          entry.target.textContent = fmt(target, prefix, suffix, target);
          return;
        }
        const start = performance.now();
        const dur = 1700;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          entry.target.textContent = fmt(target * eased, prefix, suffix, target);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.45 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ------------ Stage mode toggle (crisis / convergence) ------------ */
  const stage = $('#hero-stage');
  const modeBtns = $$('.stage-modes button');
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      stage.setAttribute('data-mode', mode);
    });
  });

  // Auto-flip stage mode when "flywheel" section enters view
  const flySection = $('#flywheel');
  if (flySection && stage && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          stage.setAttribute('data-mode', 'solution');
          modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === 'solution')));
        }
      });
    }, { threshold: 0.35 });
    so.observe(flySection);
  }

  /* ------------ Crisis stack expandable cards ------------ */
  $$('.stack-card').forEach((card) => {
    const toggle = () => {
      const open = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!open));
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ------------ Akamai value flywheel ------------ */
  const FW = [
    {
      title: 'Distributed inference',
      body: 'AI Grid runs thousands of NVIDIA Blackwell GPUs across 4,400+ edge locations — one of the world\'s most widely distributed AI platforms. User requests land at a POP near the demand, not in a single hyperscaler region. Centralized clusters keep training and heavy fine-tuning; edge POPs serve user-facing inference at sub-50ms time-to-first-token for select workloads.',
      quants: [['4,400+', 'Edge POPs'], ['<50ms', 'TTFT (target)'], ['2.5×', 'Latency reduction'], ['86%', 'Inference cost savings']]
    },
    {
      title: 'Intelligent routing',
      body: 'AI Grid acts as a real-time broker for AI requests. A workload-aware control plane decides where each request is served — by latency target, by token cost, by region, by model availability, by current pressure. The same prompt may route to AWS, Foundry, CoreWeave, or an Akamai POP depending on which path is cheapest, fastest, or most compliant right now.',
      quants: [['Real-time', 'Broker'], ['Workload-aware', 'Control plane'], ['Cost / TTFT / TP', 'Optimization'], ['Multi-cloud', 'Targets']]
    },
    {
      title: 'Semantic caching',
      body: 'Repeat-token surface area in conversational AI is enormous. Akamai\'s semantic caching captures embeddings of incoming queries and returns previously-computed completions when the request surface is close enough — without re-running inference. The hit rate compounds at scale and trims cost, latency, and centralized load simultaneously.',
      quants: [['Compounding', 'Hit rate'], ['Embedding-aware', 'Match'], ['Cost & latency', 'Wins'], ['Centralized load', 'Reduced']]
    },
    {
      title: 'Edge security',
      body: 'Akamai\'s native edge — WAF, bot management, DDoS — wraps AI workloads with the same protective surface that already covers the web\'s largest properties. As Comet-style agentic UX expands the attack surface (and the legal surface, post-Amazon injunction), having a security layer co-located with inference matters more, not less.',
      quants: [['WAF', 'Edge-native'], ['Bot mgmt', 'Agentic safety'], ['DDoS', 'Always-on'], ['Per-token', 'Policy hooks']]
    },
    {
      title: 'Egress mitigation',
      body: 'Cross-cloud movement quietly compounds cost and latency. The more inference, retrieval, and model traffic crosses providers, the more the architecture punishes scale. Serving a higher share of user-facing inference from POPs near the user keeps traffic local — fewer dollars and milliseconds spent on inter-cloud transit.',
      quants: [['Cross-cloud', 'Reduced'], ['POP-local', 'Serving'], ['Egress $', 'Compressed'], ['Latency var', 'Lowered']]
    },
    {
      title: 'Token economics',
      body: 'AI Grid optimizes against the metrics that actually drive AI unit economics: cost-per-token, time-to-first-token, and throughput. The control plane treats compute, model choice, and edge placement as tunable variables — not a static deployment topology. Token economics become an operational layer, not a quarterly surprise.',
      quants: [['Cost / token', 'Optimized'], ['TTFT', 'Targeted'], ['Throughput', 'Tuned'], ['Operational', 'Not quarterly']]
    }
  ];
  const fwTitle = $('#fw-title');
  const fwBody  = $('#fw-body');
  const fwQuants = $('#flywheel-detail .quants');
  const fwNum    = $('#flywheel-detail .num');
  const fwBtns = $$('.flywheel-pill');
  const setFw = (i) => {
    fwBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.fw) === i)));
    const d = FW[i];
    fwTitle.textContent = d.title;
    fwBody.textContent = d.body;
    fwNum.textContent = `${String(i + 1).padStart(2, '0')} / 0${FW.length}`;
    fwQuants.innerHTML = d.quants.map(([b, l]) => `<div class="quant"><b>${b}</b><span>${l}</span></div>`).join('');
  };
  fwBtns.forEach((b) => b.addEventListener('click', () => setFw(Number(b.dataset.fw))));

  /* ------------ Pilot calculator ------------ */
  const qpm = $('#qpm');
  const offload = $('#offload');
  const peak = $('#peak');
  const cache = $('#cache');
  const qpmVal = $('#qpmVal');
  const offloadVal = $('#offloadVal');
  const peakVal = $('#peakVal');
  const cacheVal = $('#cacheVal');
  const latencyMetric = $('#latencyMetric');
  const costMetric = $('#costMetric');
  const supportMetric = $('#supportMetric');
  const edgeMetric = $('#edgeMetric');
  const cellLatency = $('#cell-latency');
  const cellCost = $('#cell-cost');
  const cellSupport = $('#cell-support');
  const cellEdge = $('#cell-edge');

  const setProgressBg = (input) => {
    const min = Number(input.min), max = Number(input.max), val = Number(input.value);
    const p = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--p', `${p}%`);
  };

  const updateModel = () => {
    const q = Number(qpm.value);
    const o = Number(offload.value);
    const p = Number(peak.value);
    const c = Number(cache.value);

    qpmVal.textContent = q.toLocaleString();
    offloadVal.textContent = o;
    peakVal.textContent = p;
    cacheVal.textContent = c;

    const edgeServed = Math.min(95, o + c * 0.85);
    const latencyGain = Math.max(8, Math.min(68, (o * 0.65) + (c * 0.45) - (p * 1.8)));
    const costRelief = Math.max(4, Math.min(58, (o * 0.42) + (c * 0.35) + (q / 80) - (p * 1.1)));
    const incidentCompression = Math.max(6, Math.min(72, (o * 0.5) + (c * 0.25) + (10 - p) * 2.2));

    latencyMetric.textContent = `${latencyGain.toFixed(0)}%`;
    costMetric.textContent    = `${costRelief.toFixed(0)}%`;
    supportMetric.textContent = `${incidentCompression.toFixed(0)}%`;
    edgeMetric.textContent    = `${edgeServed.toFixed(0)}%`;

    cellLatency.style.setProperty('--bar', `${latencyGain}%`);
    cellCost.style.setProperty('--bar', `${costRelief}%`);
    cellSupport.style.setProperty('--bar', `${incidentCompression}%`);
    cellEdge.style.setProperty('--bar', `${edgeServed}%`);

    [qpm, offload, peak, cache].forEach(setProgressBg);
  };
  [qpm, offload, peak, cache].forEach((i) => i.addEventListener('input', updateModel));
  updateModel();

  /* ------------ Evidence list (in-page) + drawer ------------ */
  const buildSourceCard = (s) => `
    <a class="source-card" href="${s.url}" target="_blank" rel="noopener noreferrer">
      <div class="src-meta">
        <b>${s.tag}</b>
        <span>${s.date}</span>
        <span style="color: var(--ink-faint);">${hostname(s.url)}</span>
      </div>
      <h4>${s.title}</h4>
      <p>${s.summary}</p>
      <span class="src-link">
        Open source
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </span>
    </a>`;

  const evidenceList = $('#evidence-list');
  if (evidenceList) evidenceList.innerHTML = SOURCES.map(buildSourceCard).join('');
  const drawerList = $('#drawer-list');
  if (drawerList) drawerList.innerHTML = SOURCES.map(buildSourceCard).join('');

  /* drawer */
  const drawer = $('#evidence-drawer');
  const backdrop = $('.drawer-backdrop');
  const openDrawer = () => {
    drawer.classList.add('open');
    backdrop.classList.add('open');
  };
  const closeDrawer = () => {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  };
  $$('[data-evidence-open]').forEach((b) => b.addEventListener('click', openDrawer));
  $$('[data-evidence-close]').forEach((b) => b.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

})();
