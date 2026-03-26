/** Normalized slug -> one-line category description for discovery prompts and UI hints */
export const KNOWN_LENS: Record<string, string> = {
  // Support / CX
  intercom: "Customer support and customer messaging software",
  zendesk: "Customer support and help desk software",
  freshdesk: "Customer support and help desk software",
  helpscout: "Customer support and shared inbox software",
  gorgias: "Ecommerce customer support and help desk software",
  front: "Shared inbox and customer communication software",
  kustomer: "Customer service CRM and support platform",
  gladly: "Customer service and support platform",
  livechat: "Live chat and customer messaging software",

  // Collaboration / productivity / docs
  slack: "Team communication and workplace collaboration",
  notion: "Productivity, docs, and workspace software",
  confluence: "Team knowledge base and documentation software",
  coda: "Collaborative docs and workspace software",
  airtable: "Collaborative databases and workflow software",
  miro: "Collaborative whiteboarding and visual planning software",
  mural: "Collaborative whiteboarding and workshop software",
  clickup: "Project management and team productivity software",
  asana: "Work management and project collaboration software",
  trello: "Task management and kanban collaboration software",
  monday: "Work management and team workflow software",
  mondaycom: "Work management and team workflow software",

  // Design / product building
  figma: "Design and collaborative interface software",
  canva: "Visual design and content creation software",
  invision: "Design collaboration and prototyping software",
  sketch: "Interface design and prototyping software",
  framer: "Website building and interactive design software",
  webflow: "Website design and no-code web publishing software",

  // Engineering / product / issue tracking
  linear: "Issue tracking and engineering planning tools",
  jira: "Issue tracking and engineering project management software",
  github: "Code hosting, collaboration, and developer platform software",
  gitlab: "Code hosting, DevOps, and developer platform software",
  bitbucket: "Code collaboration and repository hosting software",
  sentry: "Application monitoring and error tracking software",
  datadog: "Cloud monitoring and observability software",
  newrelic: "Application performance monitoring and observability software",
  postman: "API development and testing software",
  insomnia: "API development and testing software",
  vercel: "Frontend deployment and developer platform software",
  netlify: "Web deployment and frontend platform software",
  circleci: "Continuous integration and delivery software",
  launchdarkly: "Feature flagging and release management software",

  // CRM / sales / revenue
  salesforce: "CRM and enterprise sales software",
  hubspot: "CRM, marketing automation, and sales software",
  pipedrive: "Sales CRM and pipeline management software",
  copper: "CRM and relationship management software",
  close: "Sales CRM and outbound sales software",
  attio: "Modern CRM and relationship intelligence software",
  apollo: "Sales intelligence and outbound prospecting software",
  gong: "Revenue intelligence and conversation analytics software",
  outreach: "Sales engagement and outbound workflow software",
  salesloft: "Sales engagement and revenue workflow software",

  // Marketing / automation / communications
  mailchimp: "Email marketing and marketing automation software",
  klaviyo: "Email and SMS marketing automation software",
  braze: "Customer engagement and lifecycle messaging software",
  iterable: "Customer engagement and cross-channel messaging software",
  customerio: "Lifecycle messaging and marketing automation software",
  segment: "Customer data platform software",
  mixpanel: "Product analytics software",
  amplitude: "Product analytics and digital optimization software",
  heap: "Digital insights and product analytics software",

  // Commerce / payments
  shopify: "Ecommerce platform and online store software",
  bigcommerce: "Ecommerce platform software",
  commercetools: "Composable commerce platform software",
  stripe: "Payments infrastructure and financial software",
  adyen: "Payments infrastructure and commerce software",
  square: "Payments and commerce software",

  // Data / BI / warehouses
  snowflake: "Cloud data warehouse and analytics platform software",
  dbt: "Data transformation and analytics engineering software",
  looker: "Business intelligence and analytics software",
  tableau: "Business intelligence and data visualization software",
  powerbi: "Business intelligence and reporting software",
  supabase: "Backend platform and hosted database software",
  firebase: "Backend platform and app development software",

  // HR / recruiting / people ops
  workday: "HR, finance, and enterprise operations software",
  bamboohr: "HRIS and people operations software",
  greenhouse: "Recruiting and applicant tracking software",
  lever: "Recruiting CRM and applicant tracking software",
  rippling: "HR, IT, and payroll management software",
  gusto: "Payroll and HR software",

  // Security / identity / access
  okta: "Identity and access management software",
  auth0: "Authentication and identity platform software",
  onepassword: "Password management and access security software",
  crowdstrike: "Endpoint security and threat detection software",
  cloudflare: "Security, networking, and edge infrastructure software",

  // Finance / ops / procurement
  quickbooks: "Accounting and small business finance software",
  xero: "Accounting and small business finance software",
  ramp: "Corporate card and spend management software",
  brex: "Corporate card, expense, and finance operations software",
  navan: "Travel, expense, and corporate operations software",
  billcom: "Accounts payable and financial operations software",

  // AI / search / knowledge / meeting tools
  openai: "AI models, assistants, and developer platform software",
  perplexity: "AI search and answer engine software",
  glean: "Workplace search and enterprise knowledge software",
  algolia: "Search and discovery platform software",
  loom: "Async video messaging and screen recording software",
  otter: "Meeting transcription and conversation intelligence software",
  grain: "Meeting recording and conversation insights software",
};

/** Diversified giants — discovery should focus on segment, not random divisions */
export const MEGA_CORPS = new Set([
  // Big tech / cloud / enterprise
  "microsoft",
  "google",
  "alphabet",
  "amazon",
  "apple",
  "meta",
  "facebook",
  "oracle",
  "ibm",
  "salesforce",
  "adobe",
  "cisco",
  "intel",
  "nvidia",
  "hp",
  "hpe",
  "dell",
  "sap",
  "siemens",
  "vmware",
  "broadcom",

  // Consumer / device / platform giants
  "samsung",
  "sony",
  "xiaomi",
  "huawei",
  "tesla",
  "netflix",
  "uber",
  "airbnb",
  "spotify",
  "tiktok",
  "bytedance",

  // Telecom / networking
  "verizon",
  "att",
  "tmobile",
  "comcast",

  // Commerce / payments
  "walmart",
  "target",
  "costco",
  "shopify",
  "stripe",
  "paypal",
  "block",

  // Consulting / enterprise service giants
  "accenture",
  "deloitte",
  "pwc",
  "ey",
  "kpmg",

  // Semis / infra
  "amd",
  "qualcomm",
  "arm",

  // Search / media / internet conglomerates
  "yahoo",
  "baidu",
  "tencent",
  "alibaba",
  "jd",
]);

export function normalizeCompanyKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function lookupKnownLens(input: string): string | undefined {
  const norm = normalizeCompanyKey(input);
  if (KNOWN_LENS[norm]) return KNOWN_LENS[norm];
  for (const word of input.toLowerCase().split(/\s+/)) {
    const w = normalizeCompanyKey(word);
    if (KNOWN_LENS[w]) return KNOWN_LENS[w];
  }
  return undefined;
}

export function inputMatchesMegaCorp(input: string): boolean {
  const norm = normalizeCompanyKey(input);
  if (MEGA_CORPS.has(norm)) return true;
  for (const word of input.toLowerCase().split(/\s+/)) {
    if (MEGA_CORPS.has(normalizeCompanyKey(word))) return true;
  }
  return false;
}

export function getCompanyResearchContext(input: string): {
  lensDescription?: string;
  isMegaCorp: boolean;
} {
  return {
    lensDescription: lookupKnownLens(input),
    isMegaCorp: inputMatchesMegaCorp(input),
  };
}
