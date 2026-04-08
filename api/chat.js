import OpenAI from "openai";

// ──────────────────────────────────────────────────
//  Knowledge base — all facts about William Valdez
//  Edit this to keep the chatbot up to date.
// ──────────────────────────────────────────────────
const KNOWLEDGE = `
# William Valdez — Professional Profile

## Identity
- Name: William Valdez
- Title: Platform Engineer, SRE, AI Systems & SaaS Founder
- Location: Available for roles (open to remote and on-site)
- LinkedIn: https://linkedin.com/in/william-valdez-2209142b
- Email: WilliamValdez22@gmail.com
- GitHub: https://github.com/everybitcounts

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
- Leads identity management (Entra ID), observability, and compliance automation
- Multi-cloud infrastructure (AWS, Azure, GCP)
- High availability platforms maintaining 99.9%+ SLA

## Previous Experience

### Platform Engineer — Enterprise
- Built and maintained critical infrastructure focused on automation, monitoring, and rapid recovery
- Terraform infrastructure as code
- CI/CD pipeline automation
- Monitoring and alerting systems
- Disaster recovery implementation

### IAM and GRC Engineer — Enterprise
- Managed identity governance, AWS account provisioning, compliance controls
- Active Directory and Azure AD administration with hybrid integration
- Varonis and Sailpoint administration
- Separation of Duties (SoD) policy enforcement
- User Access Reviews and access certifications
- Emergency Access Management (Firefighter access)
- Security Attack Surface Analyzer for vendor reviews

### Systems Engineer — Various
- Windows Server and Citrix administration
- Firewall implementation and patch coordination
- SiteLock website monitoring and malware protection
- Symantec Anti-Virus deployment
- DFS and network access coordination

## Technical Skills

**Cloud & Platform:** AWS (EC2, ECS, EKS, Lambda, RDS, S3, CloudFormation), Azure (Entra ID, VMs, AKS), GCP (Compute, GKE), Terraform IaC, Multi-Cloud Architecture, High Availability

**DevOps & CI/CD:** Azure DevOps, GitHub Actions, Jenkins, GitOps, Secrets Management, Infrastructure Automation

**Security & Identity:** IAM/RBAC, Active Directory, Azure AD, Security Hub, GuardDuty, Zero Trust, OAuth2, JWT, Cloudflare Workers, SHA-256 cryptography

**SRE & Observability:** Prometheus, Grafana, Loki, Tempo, Incident Response, PagerDuty, 99.9%+ SLA management

**Databases:** PostgreSQL, DynamoDB, Supabase, RLS, Database Replication, DR

**AI & Application Engineering:** OpenAI/Claude integrations, RAG chatbots, Agentic Workflows, LLM coaching engines, PWA development, iOS/Android/Web apps, MCP Server integration

**Networking & Systems:** TCP/IP, DNS, VPC Architecture, Route53, Transit Gateway, Citrix, DFS, Windows Server

**GRC & Compliance:** Varonis, Sailpoint, SoD policies, PCI-DSS, HIPAA, SOC 2, CISA BOD 18-01, FedRAMP, NIST 800-171

## Key Projects (Open Source)
- AI SDLC Transformation Toolkit: maturity assessment and roadmap generator for AI-assisted development
- Agentic Workflow Engine: multi-agent pipeline for automated code review, test generation, PR analysis
- Copilot Metrics Dashboard: executive dashboard for GitHub Copilot ROI measurement
- Prompt Engineering Framework: enterprise toolkit for LLM interactions with injection detection and PII filtering
- AWS DR Automation: cross-region disaster recovery under 15 minutes RTO
- AWS EKS Observability: full Prometheus/Grafana/Loki/Tempo stack on Kubernetes
- AWS Security Compliance: Security Hub + GuardDuty + auto-remediation
- AWS Landing Zone: multi-account Organizations + Control Tower setup
- Terraform Academy OSS: open-source quiz engine and lab simulator (MIT license, 3 stars, 2 forks)

## What Makes William Stand Out
- He has shipped two live, production SaaS products with real paying users (not just side projects)
- 10+ years of enterprise cloud and infrastructure experience
- Rare combination of deep SRE/platform engineering AND full product development from idea to launch
- Hands-on with AI integrations at the product level — built an AI coaching engine used by 10k+ engineers
- Deep security background: IAM, GRC, cryptographic integrity systems, compliance frameworks
- Founder experience: architecture, product, infrastructure, security, and go-to-market
`;

const SYSTEM_PROMPT = `You are an AI assistant on William Valdez's portfolio website. Recruiters, hiring managers, and engineers visit this page to learn about William's background.

Your job is to answer questions about William's experience, skills, projects, and career as helpfully and specifically as possible, using only the information in the knowledge base below. You represent William professionally.

Guidelines:
- Be concise but thorough. Bullet points are fine for lists.
- If asked about something not in the knowledge base, say you don't have that detail but invite them to reach out via email (WilliamValdez22@gmail.com) or LinkedIn.
- Do NOT make up information. Stick strictly to the knowledge base.
- Speak positively and professionally about William's work.
- If a recruiter asks "is he available?", confirm he is open to opportunities.
- Keep responses friendly and conversational.

KNOWLEDGE BASE:
${KNOWLEDGE}`;

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  // Sanitize: only allow role/content fields, cap conversation history
  const MAX_HISTORY = 20;
  const sanitized = messages
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({
      role: ["user", "assistant"].includes(role) ? role : "user",
      content: String(content).slice(0, 2000),
    }));

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...sanitized,
      ],
      max_tokens: 600,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (err) {
    // Don't leak internal OpenAI error details
    console.error("OpenAI error:", err?.message);
    return res.status(502).json({ error: "AI service unavailable. Please try again." });
  }
}
