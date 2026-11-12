export const businessConfig = {
  brandName: 'MockCall PH',
  tagline: 'Practice before the real interview.',
  sessionDurationMinutes: 30,
  categories: [
    { id: 'call-center-bpo', name: 'Call Center / BPO', basePrice: 100 },
    { id: 'admin-executive-assistant', name: 'Admin / Executive Assistant', basePrice: 125 },
    { id: 'hr-recruitment', name: 'HR / Recruitment', basePrice: 150 },
    { id: 'general-qa', name: 'General QA', basePrice: 150 },
    { id: 'finance-accounting', name: 'Finance / Accounting', basePrice: 175 },
    { id: 'workforce-management', name: 'Workforce Management', basePrice: 200 },
    { id: 'reporting-data-analyst', name: 'Reporting / Data Analyst', basePrice: 225 },
    { id: 'business-intelligence-power-bi', name: 'Business Intelligence / Power BI', basePrice: 250 },
    { id: 'team-lead-supervisor', name: 'Team Lead / Supervisor', basePrice: 250 },
    { id: 'software-qa-automation', name: 'Software QA / Automation', basePrice: 275 },
    { id: 'programming-development', name: 'Programming / Development', basePrice: 300 },
    { id: 'operations-manager', name: 'Operations Manager', basePrice: 300 },
    { id: 'senior-management', name: 'Senior Management', basePrice: 400 },
  ],
  stages: [
    { id: 'screening', name: 'Initial Screening', multiplier: 1, multiplierLabel: 'Fixed ₱100', priceNote: 'Same complete-package price for every category.' },
    { id: 'hiringManager', name: 'Hiring Manager', multiplier: 1.25, multiplierLabel: '×1.25', priceNote: 'Category base price × 1.25.' },
    { id: 'technical', name: 'Technical Interview', multiplier: 1.5, multiplierLabel: '×1.5', priceNote: 'Category base price × 1.5.' },
    { id: 'final', name: 'Final Interview', multiplier: 2, multiplierLabel: '×2', priceNote: 'Category base price × 2.' },
  ],
  privacyNotice: 'Your details are stored in the service operator’s private booking sheet and used to follow up on this request. The operator should set and disclose a deletion schedule before launch.',
  aiNotesDisclosure: 'We may use meeting notes or AI-assisted transcription to help prepare your feedback. We will explain the method and ask permission before the session. You can decline recording or transcription and still continue.',
} as const

export type InterviewStage = (typeof businessConfig.stages)[number]['id']

export interface Booking {
  fullName: string
  email: string
  contactValue: string
  targetRole: string
  companyOrIndustry: string
  experienceLevel: string
  jobCategory: string
  interviewStage: InterviewStage | ''
  durationMinutes: number
  preferredDate: string
  preferredTime: string
  timezone: 'Asia/Manila'
  notes: string
  privacyNoticeAccepted: boolean
  honeypot: string
}

export type BookingSubmission = Booking & {
  packagePrice: number
  packageName: string
}

export function getPackagePrice(categoryId: string, stageId: InterviewStage) {
  if (stageId === 'screening') return 100
  const category = businessConfig.categories.find((item) => item.id === categoryId)
  const stage = businessConfig.stages.find((item) => item.id === stageId)
  if (!category || !stage) return 0
  return Math.round(category.basePrice * stage.multiplier * 100) / 100
}

export function formatPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}
