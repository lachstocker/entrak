export const OBLIGATION_TYPES = [
  { value: 'payment', label: 'Payment' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'termination', label: 'Termination' },
  { value: 'other', label: 'Other' }
];

export const OBLIGATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' }
];

export const OBLIGATION_PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

export const RESPONSIBLE_PARTIES = [
  { value: 'Finance Manager', label: 'Finance Manager' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Legal Counsel', label: 'Legal Counsel' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'IT Security', label: 'IT Security' },
  { value: 'Compliance Officer', label: 'Compliance Officer' },
  { value: 'Sales Manager', label: 'Sales Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' }
];

export const NOTIFICATION_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'in-app', label: 'In-app notification' },
  { value: 'both', label: 'Both' }
];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const WEEKDAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
];

export const FILE_TYPES = [
  { value: 'pdf', label: 'PDF', mimeType: 'application/pdf' },
  { value: 'docx', label: 'DOCX', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { value: 'txt', label: 'TXT', mimeType: 'text/plain' }
];

export const STATS = {
  totalDocuments: 24,
  activeObligations: 87,
  upcomingDeadlines: 12,
  processingSuccess: 94
};

export const MOCK_OBLIGATIONS = [
  {
    id: 1,
    type: 'payment',
    text: 'Quarterly payment of $25,000 due to vendor',
    document: 'Service Agreement - Acme Corp',
    dueDate: new Date('2023-10-15'),
    responsible: {
      name: 'Finance Manager',
      initials: 'FM'
    },
    status: 'pending'
  },
  {
    id: 2,
    type: 'delivery',
    text: 'Deliver project milestone: Phase 1 documentation',
    document: 'Project Agreement - TechSolutions Inc',
    dueDate: new Date('2023-09-30'),
    responsible: {
      name: 'Project Manager',
      initials: 'PM'
    },
    status: 'overdue'
  },
  {
    id: 3,
    type: 'reporting',
    text: 'Submit quarterly compliance report to regulatory body',
    document: 'Regulatory Compliance Guidelines',
    dueDate: new Date('2023-10-31'),
    responsible: {
      name: 'Legal Counsel',
      initials: 'LC'
    },
    status: 'pending'
  },
  {
    id: 4,
    type: 'renewal',
    text: 'Contract renewal notification (60 days prior)',
    document: 'Supply Agreement - Global Suppliers Ltd',
    dueDate: new Date('2023-11-15'),
    responsible: {
      name: 'Procurement',
      initials: 'PR'
    },
    status: 'pending'
  },
  {
    id: 5,
    type: 'compliance',
    text: 'Complete annual security audit',
    document: 'Security Agreement - DataSecure Inc',
    dueDate: new Date('2023-12-15'),
    responsible: {
      name: 'IT Security',
      initials: 'IT'
    },
    status: 'pending'
  }
];
