import OpenAI from "openai";

// ──────────────────────────────────────────────────
//  Rate limiting — in-memory, per serverless instance.
//  Sufficient for a portfolio site (no external DB needed).
//  Cold starts reset the store; warm instances enforce limits.
// ──────────────────────────────────────────────────
const WINDOW_HOUR_MS  = 60 * 60 * 1000; //  1 hour window
const WINDOW_MIN_MS   = 60 * 1000;       //  1 minute window
const MAX_PER_HOUR    = 15;              //  requests / IP / hour
const MAX_PER_MINUTE  = 3;              //  requests / IP / minute (burst guard)

// Map<ip, { hourCount, hourStart, minCount, minStart }>
const store = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { hourCount: 0, hourStart: now, minCount: 0, minStart: now };
    store.set(ip, entry);
  }

  // Reset hour window if expired
  if (now - entry.hourStart > WINDOW_HOUR_MS) {
    entry.hourCount = 0;
    entry.hourStart = now;
  }
  // Reset minute window if expired
  if (now - entry.minStart > WINDOW_MIN_MS) {
    entry.minCount = 0;
    entry.minStart = now;
  }

  if (entry.hourCount >= MAX_PER_HOUR)   return "hour";
  if (entry.minCount  >= MAX_PER_MINUTE) return "minute";

  entry.hourCount++;
  entry.minCount++;
  return null; // allowed
}

// Prune stale entries so the Map doesn't grow unbounded
function pruneStore() {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now - entry.hourStart > WINDOW_HOUR_MS) store.delete(ip);
  }
}

// ──────────────────────────────────────────────────
//  Cost controls
// ──────────────────────────────────────────────────
const MAX_HISTORY_MSGS   = 8;    // only last 8 turns sent to OpenAI
const MAX_MSG_CHARS      = 500;  // truncate each message to 500 chars
const MAX_TOKENS_REPLY   = 350;  // cap output tokens (~260 words max)
const MODEL              = "gpt-4o-mini"; // cheapest OpenAI chat model

// ──────────────────────────────────────────────────
//  Knowledge base — all facts about William Valdez
//  Edit this to keep the chatbot up to date.
// ──────────────────────────────────────────────────
const KNOWLEDGE = `
# William Valdez — Professional Profile

## Identity
- Name: William Valdez
- Title: Platform Engineer, SRE, AI Systems & SaaS Founder
- Location: Florida, USA
- LinkedIn: https://linkedin.com/in/william-valdez-2209142b
- Email: WilliamValdez22@gmail.com
- GitHub: https://github.com/everybitcounts

## Work Preferences (IMPORTANT — always state these clearly)
- **Remote only** — William does NOT consider on-site or hybrid roles under any circumstances
- **United States only** — not open to international or offshore positions
- **Open to:** Full-time (W2) and contract (1099/C2C) opportunities
- **NOT open to:** Part-time, freelance one-offs, on-site roles, or positions outside the US
- **Status:** Actively available and open to the right opportunity right now

## Current Roles

### Lead Developer & Founder — CoGen, LLC (Current)
William founded CoGen, LLC and leads all product development. He built and ships two live SaaS platforms:

**DLX7 ShieldNet** (shieldnet.app)
- Autonomous production integrity platform for web and agent-driven systems
- Cryptographic SHA-256 DNA snapshots capture verified DOM state
- Real-time drift detection fires within seconds of unauthorized change
- Auto-heal engine restores from verified snapshots without manual intervention
- AI Shield: ML threat detection, guardrail scanning, CVE search
- Edge security via Cloudflare Workers (rate limiting, bot filtering, geo-fencing)
- DLX7 Uptime: drift-correlated healing with auto VCS pull requests
- Free tools: Website Scanner (9-category scoring, PCI-DSS/HIPAA mapping), Secrets Scanner, Red Team Arena
- Tech stack: JavaScript, Cloudflare Workers, Supabase, SHA-256, DOM Mutation API, TLS 1.3, AES-256

**Terraform Academy** (terraformacademy.app / terraformacademy.com)
- IaC and cloud certification learning platform
- Serves 10,000+ engineers
- 250+ interactive hands-on labs
- AI coaching engine that diagnoses skill gaps and guides certification paths
- 12+ competitive training modes: PvP IaC Arena, Drift Detective, Tournament Mode, VS Challenge, TF Builder, Module Master
- Certification tracks: HashiCorp Terraform Associate, AWS (SAA-C03, SysOps, CCP), Azure (AZ-104, AZ-204, AZ-500), GCP (ACE, PCA), Docker DCA
- Full gamification: XP system, streak tracking, skill-tiered leaderboards, achievements
- Works as a Progressive Web App (PWA) — no install, works offline
- Open-source engine: terraform-academy-oss (MIT) on GitHub
- Tech stack: JavaScript, Supabase, Cloudflare, PWA, Monaco Editor, AI Coach, WebSockets

### Site Reliability & Platform Engineer — Enterprise (Current)
- Designs and operates cloud infrastructure across AWS, Azure, and hybrid environments
- Leads identity management with Entra ID across multiple domains
- Observability stack ownership: Prometheus, Grafana, Loki, Tempo
- Compliance automation and security posture management
- Multi-cloud infrastructure: AWS, Azure, GCP
- High availability platforms maintaining 99.9%+ SLA

## Previous Experience

### Platform Engineer — Enterprise
- Built and maintained critical infrastructure focused on automation, monitoring, and rapid recovery
- Terraform IaC for all cloud provisioning
- CI/CD pipeline automation with Azure DevOps and GitHub Actions
- Monitoring and alerting systems
- Disaster recovery implementation and testing

### IAM and GRC Engineer — Enterprise
- Managed identity governance, AWS account provisioning, and compliance controls
- Active Directory and Azure AD / Entra ID administration with hybrid integration
- Varonis and Sailpoint administration
- Separation of Duties (SoD) policy enforcement and risk analysis
- User Access Reviews and access certifications
- Emergency Access Management (Firefighter access)
- Security Attack Surface Analyzer for vendor reviews
- AD Security Groups auditing for compliance standards (SOC 2, PCI-DSS)

### Systems Engineer — Various
- Windows Server administration (2012, 2016, 2019)
- Citrix Access Management and VDI
- Distributed File System (DFS) administration
- Firewall implementation and patch coordination
- SiteLock website monitoring and malware protection
- Symantec Anti-Virus deployment
- Network access coordination and TCP/IP troubleshooting

## Technical Skills

### Cloud & Platform Engineering
- AWS: EC2, ECS, EKS, Lambda, RDS, S3, CloudFormation, CodePipeline, CodeBuild, CodeDeploy, Route53, Global Accelerator, EventBridge, Step Functions, Security Hub, GuardDuty, AWS Config, Organizations, Control Tower, Cost Explorer, Trusted Advisor
- Azure: Entra ID (Azure AD), VMs, AKS, Azure DevOps, AZ-104 certified path
- GCP: Compute Engine, GKE, Cloud Functions
- Terraform for Infrastructure as Code (IaC) — expert level
- Multi-cloud architecture and governance
- High availability and fault tolerance design

### DevOps & CI/CD
- Azure DevOps, GitHub Actions, Jenkins
- GitOps workflows and environment promotion (Dev → Staging → Prod)
- Docker, Kubernetes, Helm
- Secrets management (Vault, AWS Secrets Manager)
- Infrastructure automation and self-healing pipelines
- Automated testing and compliance gates

### Security, Identity & Zero Trust
- IAM, RBAC, and entitlement management
- Active Directory and Entra ID administration (hybrid, multi-domain)
- Zero Trust architecture principles
- OAuth2, JWT, SAML, SSO
- SHA-256 cryptographic integrity systems (DLX7 ShieldNet)
- Cloudflare Workers edge security
- Security Hub, GuardDuty, AWS Config, SCPs
- DLP, TLS 1.3, AES-256 at rest
- CIS, PCI-DSS 4.0, HIPAA, SOC 2, NIST 800-171, FedRAMP, CISA BOD 18-01 compliance

### SRE & Observability
- Prometheus, Grafana, Loki, Tempo (full PLG/PLT stack)
- Alertmanager and PagerDuty integration
- Incident response, root cause analysis, post-mortems
- SLA/SLO/SLI management (99.9%+ uptime targets)
- Patch and fleet management (Automox)
- Chaos engineering and disaster recovery drills
- Cross-region DR with RTO < 15 min, RPO < 5 min

### GRC & Compliance
- Varonis and Sailpoint administration
- SoD policy enforcement and risk analysis
- User Access Reviews and access certifications
- PCI-DSS, HIPAA, SOC 2, CISA BOD 18-01, FedRAMP, NIST 800-171
- Security Attack Surface Analyzer
- Compliance-as-code with AWS Config rules and auto-remediation

### Databases & Persistence
- PostgreSQL and SQL schema design
- DynamoDB and NoSQL patterns
- Supabase (Postgres + Auth + Storage)
- Row-Level Security (RLS), multi-tenant data isolation
- Database replication and cross-region DR
- RDS Multi-AZ, S3 CRR

### AI & Application Engineering
- OpenAI and Anthropic (Claude) API integrations
- RAG chatbot development (retrieval-augmented generation)
- Agentic workflows and multi-agent orchestration
- LLM coaching engines (built and deployed at scale — Terraform Academy)
- Prompt engineering, injection detection, PII filtering
- MCP Server integration
- PWA development (iOS, Android, Web — offline-capable)
- Subscription and entitlement systems (Stripe)
- Monaco Editor integrations, real-time collaborative UIs

### APIs & Integrations
- REST APIs and API Gateway design
- Webhooks and event-driven architecture
- OAuth2, JWT, SSO integrations
- Third-party API integrations: Stripe, Supabase, GitHub, Cloudflare, Slack, PagerDuty

### Networking & Systems
- TCP/IP, DNS, BGP fundamentals
- VPC architecture, subnetting, peering, Transit Gateway
- Route53 routing policies, Global Accelerator
- Citrix and VDI administration
- Distributed File System (DFS)
- Windows Server (2012–2019)

## Key Open Source Projects
- **AI SDLC Transformation Toolkit:** Maturity assessment and roadmap generator for enterprises adopting AI-assisted dev. 8-dimension scoring, ROI calculator, 4-phase rollout plan.
- **Agentic Workflow Engine:** Multi-agent pipeline for automated code review, test generation, PR analysis. Supports OpenAI, Anthropic, and AWS Bedrock.
- **Copilot Metrics Dashboard:** Executive dashboard measuring GitHub Copilot ROI, adoption KPIs, and productivity trends.
- **Prompt Engineering Framework:** Enterprise toolkit for LLM interactions — parameterized templates, injection detection, PII filtering, quality scoring.
- **AWS DR Automation:** Cross-region failover under 15 min RTO / 5 min RPO using Route53, RDS replication, Step Functions.
- **AWS EKS Observability:** Full PLG stack (Prometheus, Grafana, Loki, Tempo) on EKS with IRSA and S3 long-term storage.
- **AWS Security Compliance:** Security Hub + GuardDuty + Config + auto-remediation Lambda functions.
- **AWS Landing Zone:** Multi-account Organizations + Control Tower with account factory, SCPs, centralized logging.
- **Terraform Academy OSS:** MIT-licensed open-source quiz engine and lab simulator powering Terraform Academy.

## What Makes William Stand Out
- Shipped two live, production SaaS platforms with real paying users — not just side projects
- 10+ years of enterprise cloud and infrastructure experience across Fortune-level organizations
- Rare combination: deep SRE/platform engineering expertise AND full product ownership (idea to launch)
- Hands-on AI integrations at production scale — built an AI coaching engine used by 10,000+ engineers
- Deep security background: IAM, GRC, cryptographic integrity systems, multiple compliance frameworks
- Founder experience: architecture, product, infrastructure, security, go-to-market
- Based in Florida — available for fully remote US opportunities immediately
`;

const SYSTEM_PROMPT = `You are an AI assistant on William Valdez's portfolio website. Recruiters, hiring managers, and engineers visit this page to learn about William's background.

Your job is to answer questions about William's experience, skills, projects, and career as helpfully and specifically as possible, using only the information in the knowledge base below. You represent William professionally.

Guidelines:
- Be concise but thorough. Bullet points are fine for lists.
- If asked about something not in the knowledge base, say you don't have that detail but invite them to reach out via email (WilliamValdez22@gmail.com) or LinkedIn.
- Do NOT make up information. Stick strictly to the knowledge base.
- Speak positively and professionally about William's work.
- WORK PREFERENCES — always be explicit and accurate:
  * William is REMOTE ONLY. He does not consider on-site or hybrid roles.
  * US positions only. He is not open to international roles.
  * Open to full-time (W2) and contract (1099/C2C) roles.
  * Based in Florida.
  * Currently available for the right opportunity.
- Keep responses friendly and conversational.

KNOWLEDGE BASE:
${KNOWLEDGE}`;

export default async function handler(req, res) {
  // Prune stale rate-limit entries on each request (cheap, no timer needed)
  pruneStore();

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Per-IP rate limiting — extract real IP from Vercel headers
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    "unknown";

  const limited = checkRateLimit(ip);
  if (limited === "minute") {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  if (limited === "hour") {
    return res.status(429).json({ error: "Hourly limit reached. Please email WilliamValdez22@gmail.com directly." });
  }

  // Validate API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  // Sanitize: only role/content, hard-cap history and per-message length
  const sanitized = messages
    .slice(-MAX_HISTORY_MSGS)
    .map(({ role, content }) => ({
      role: ["user", "assistant"].includes(role) ? role : "user",
      content: String(content).slice(0, MAX_MSG_CHARS),
    }));

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...sanitized,
      ],
      max_tokens: MAX_TOKENS_REPLY,
      temperature: 0.3,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("OpenAI error:", err?.message);
    return res.status(502).json({ error: "AI service unavailable. Please try again." });
  }
}
