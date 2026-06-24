export type PortalDashboard = {
  key: string;
  title: string;
  path: string;
  role: string;
  department: string;
  group: 'Executive' | 'Internal' | 'Pilot' | 'Customer';
  description: string;
  status: string;
  metrics: { label: string; value: string }[];
  workflow: string[];
  aiScope: string;
};

export const portalDashboards: PortalDashboard[] = [
  {
    key: 'owner',
    title: 'Owner Command Center',
    path: '/portal/owner',
    role: 'Owner',
    department: 'Executive',
    group: 'Executive',
    description: 'Company-wide command center for revenue, jobs, pilots, safety, AI controls, and human review queues.',
    status: 'Executive access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/owner' },
      { label: 'Database role key', value: 'owner' },
      { label: 'Access level', value: 'Full control' },
    ],
    workflow: ['Company health overview', 'AI system controls', 'Dispatch and safety exceptions', 'Revenue and growth signals'],
    aiScope: 'Owner AI can summarize all departments, flag risks, recommend approvals, and route work to the right human dashboard.',
  },
  {
    key: 'admin',
    title: 'Admin Operations',
    path: '/portal/admin',
    role: 'Admin',
    department: 'Administration',
    group: 'Internal',
    description: 'Operations control for users, jobs, schedules, records, permissions, and human review tasks.',
    status: 'Operations access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/admin' },
      { label: 'Database role key', value: 'admin' },
      { label: 'Focus', value: 'Users + jobs' },
    ],
    workflow: ['User management', 'Job and schedule review', 'Department handoff queue', 'Records and internal notes'],
    aiScope: 'Admin AI can organize operational tasks, explain job status, and prepare records without exposing owner-only controls.',
  },
  {
    key: 'finance_payroll',
    title: 'Finance / Payroll',
    path: '/portal/finance',
    role: 'Finance / Payroll',
    department: 'Finance / Payroll',
    group: 'Internal',
    description: 'Finance dashboard for quotes, invoices, payments, W2 payroll, 1099 payouts, and financial approvals.',
    status: 'Finance access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/finance' },
      { label: 'Database role key', value: 'finance_payroll' },
      { label: 'Focus', value: 'Money flow' },
    ],
    workflow: ['Invoices and quotes', 'Payroll and time cards', 'Pilot payout review', 'Revenue and expense snapshots'],
    aiScope: 'Finance AI can draft invoices, review payout queues, and summarize payroll status, but cannot approve unsafe flight operations.',
  },
  {
    key: 'maintenance',
    title: 'Maintenance',
    path: '/portal/maintenance',
    role: 'Maintenance',
    department: 'Maintenance',
    group: 'Internal',
    description: 'Fleet readiness dashboard for drones, batteries, sensors, repairs, parts, and grounded equipment.',
    status: 'Fleet access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/maintenance' },
      { label: 'Database role key', value: 'maintenance' },
      { label: 'Focus', value: 'Readiness' },
    ],
    workflow: ['Drone fleet status', 'Battery cycles', 'Repair tickets', 'Grounding and readiness flags'],
    aiScope: 'Maintenance AI can flag readiness issues and block equipment from dispatch when maintenance status requires review.',
  },
  {
    key: 'safety',
    title: 'Safety / Compliance',
    path: '/portal/safety',
    role: 'Safety',
    department: 'Safety / Compliance',
    group: 'Internal',
    description: 'Safety control room for weather holds, no-fly mode, incident review, compliance checks, and mission risk.',
    status: 'Safety access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/safety' },
      { label: 'Database role key', value: 'safety' },
      { label: 'Focus', value: 'Risk control' },
    ],
    workflow: ['Weather and airspace holds', 'Compliance review', 'Incident reports', 'Manual approval queue'],
    aiScope: 'Safety AI can flag risk, require human review, and recommend no-fly decisions without issuing unauthorized clearances.',
  },
  {
    key: 'sales_marketing',
    title: 'Sales / Marketing',
    path: '/portal/sales',
    role: 'Sales / Marketing',
    department: 'Sales / Marketing',
    group: 'Internal',
    description: 'Growth dashboard for leads, quote requests, customer follow-up, campaigns, and competitor/pricing intelligence.',
    status: 'Growth access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/sales' },
      { label: 'Database role key', value: 'sales_marketing' },
      { label: 'Focus', value: 'Growth' },
    ],
    workflow: ['Lead pipeline', 'Quote follow-ups', 'Campaign planning', 'Service and competitor intelligence'],
    aiScope: 'Sales AI can organize leads, draft follow-ups, and surface opportunities while routing active jobs to operations.',
  },
  {
    key: 'pilot_w2',
    title: 'W2 Pilot Dashboard',
    path: '/portal/pilot-w2',
    role: 'W2 Pilot',
    department: 'Flight Operations',
    group: 'Pilot',
    description: 'Employee pilot dashboard for assigned jobs, company equipment, schedule, time cards, safety notes, uploads, and logs.',
    status: 'Employee pilot access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/pilot-w2' },
      { label: 'Database role key', value: 'pilot_w2' },
      { label: 'Work model', value: 'Assigned' },
    ],
    workflow: ['Assigned missions', 'Clock in / clock out', 'Equipment checklist', 'Flight uploads and logs'],
    aiScope: 'Pilot AI can explain assigned missions and checklist requirements without exposing company-wide financial or admin data.',
  },
  {
    key: 'pilot_1099',
    title: '1099 Pilot Dashboard',
    path: '/portal/pilot-network',
    role: '1099 Pilot',
    department: 'Pilot Network',
    group: 'Pilot',
    description: 'Network pilot dashboard for job offers, verification, mission details, upload requirements, performance, and payouts.',
    status: 'Contract pilot access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/pilot-network' },
      { label: 'Database role key', value: 'pilot_1099' },
      { label: 'Work model', value: 'Offered' },
    ],
    workflow: ['Available job offers', 'Accept / decline flow', 'Certification status', 'Payout tracking'],
    aiScope: 'Network Pilot AI can support offer review and mission readiness while limiting access to that pilot’s own work and records.',
  },
  {
    key: 'pilot_observer',
    title: 'Pilot Observer Dashboard',
    path: '/portal/observer',
    role: 'Pilot Observer',
    department: 'Flight Operations',
    group: 'Pilot',
    description: 'Beginner field-support dashboard for observer duties, support assignments, training, safety checklists, and notes.',
    status: 'Observer access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/observer' },
      { label: 'Database role key', value: 'pilot_observer' },
      { label: 'Work model', value: 'Support' },
    ],
    workflow: ['Support job assignment', 'Visual observer checklist', 'Training progress', 'Lead pilot instructions'],
    aiScope: 'Observer AI can explain job-site support duties and training steps without exposing pilot marketplace or finance data.',
  },
  {
    key: 'customer',
    title: 'Customer Portal',
    path: '/portal/customer',
    role: 'Customer',
    department: 'Customer Portal',
    group: 'Customer',
    description: 'Customer-facing dashboard for project status, quotes, deliverables, reports, messages, invoices, and job history.',
    status: 'Customer access',
    metrics: [
      { label: 'Dashboard route', value: '/portal/customer' },
      { label: 'Database role key', value: 'customer' },
      { label: 'Focus', value: 'Projects' },
    ],
    workflow: ['Project status', 'Quotes and invoices', 'Deliverables and reports', 'Messages and job history'],
    aiScope: 'Customer AI can answer project and service questions while hiding internal dispatch, pilot scores, and company operations.',
  },
];

export function getPortalDashboard(key: string) {
  return portalDashboards.find((dashboard) => dashboard.key === key);
}
