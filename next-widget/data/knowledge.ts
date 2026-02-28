// data/knowledge.(ts|js)

export const knowledge = [
  {
    id: "finops-lite",
    title: "FinOps Lite (CLI) — AWS cost analysis",
    url: "https://github.com/dianuhs/finops-lite",
    content:
      "FinOps Lite is a CLI that parses AWS Cost Explorer CSV exports to surface spend by service, last-30-day totals, and CSV summaries. It emphasizes tagging hygiene and quick savings insights like idle EC2, unattached EBS, and unused Elastic IPs. It is designed for finance-minded engineers who want a fast, lightweight workflow.",
  },
  {
    id: "cloud-cost-guard",
    title: "Cloud Cost Guard — dashboard prototype",
    url: "https://guard.cloudandcapital.com/",
    content:
      "Cloud Cost Guard is a React dashboard prototype that visualizes AWS cost data for a 30-day window: overview, top products by cost, and cost optimization findings. It talks to a FastAPI backend and is deployed with a front-end on Vercel and an API on Render. It showcases Diana's approach to turning raw AWS bills into decision-ready insights.",
  },
  {
    id: "watchdog",
    title: "FinOps Watchdog — cost anomaly helper",
    url: "https://guard.cloudandcapital.com/watchdog",
    content:
      "FinOps Watchdog is a cost anomaly helper for AWS. It ingests daily Cost Explorer exports, detects spend spikes by service or account using baselines and thresholds, and emits structured anomaly findings in machine-readable JSON. It is intentionally simple so it can be wired into dashboards, alerting systems, or review workflows.",
  },
  {
    id: "recovery-economics",
    title: "Recovery Economics — resilience cost modeling",
    url: "https://github.com/dianuhs/recovery-economics",
    content:
      "Recovery Economics is a small CLI that models backup and restore economics for a set of workloads. Given inputs like data size, backup frequency, retention, and per-GB storage and restore rates, it calculates monthly storage cost, restore cost, and total monthly resilience cost per workload and overall. The output is structured JSON suitable for spreadsheets or further analysis.",
  },
  {
    id: "signal-audit",
    title: "5-Minute Signal Audit — cost signal timing",
    url: "https://cloudandcapital.com/audit",
    content:
      "The 5-Minute Signal Audit is a short questionnaire that helps teams understand how early cloud cost signals enter their decision process. It focuses on when finance sees new spend, how quickly anomalies are surfaced, and whether engineering and finance share a common view of unit economics. The goal is to diagnose whether a team is in a late-signal or earlier-signal environment.",
  },
  {
    id: "brand",
    title: "Cloud & Capital — focus and lens",
    url: "https://cloudandcapital.com",
    content:
      "Cloud & Capital is Diana's independent cloud economics initiative. The focus is on how infrastructure decisions translate into financial outcomes: cloud cost visibility, signal timing, AI and GPU economics, and decision systems for finance and engineering leaders. Writing, tools, and frameworks live here as an ongoing lab rather than a traditional agency site.",
  },
  {
    id: "stack",
    title: "Preferred stack & skills",
    content:
      "Core skills: AWS cost analysis, Cost Explorer and CUR exports, tagging strategy, showback/chargeback concepts, and cost optimization reviews. Tooling: Python and pandas for data work, React/TypeScript for dashboards, FastAPI for APIs, and Vercel/Render for deployment. Comfortable using OpenAI APIs to build small, focused assistants around cloud economics questions.",
  },
  {
    id: "services",
    title: "What Diana can help with",
    content:
      "Diana focuses on cloud cost visibility, cost signal timing, and decision support for finance and engineering teams. She can help with AWS spend reviews, tagging plans, basic forecasting and unit economics design, and lightweight dashboards that make cost trends explainable to non-technical stakeholders.",
  },
  {
    id: "contact",
    title: "Contact & availability",
    content:
      "For roles, collaborations, or questions about the projects, email diana@cloudandcapital.com. She prioritizes remote-friendly work with a focus on cloud finance, FinOps, and AI infrastructure economics.",
  },
];
