export const businessConfig = {
  brandName: 'MockCall PH',
  tagline: 'Practice before the real interview.',
  categories: [
    { id: 'call-center-bpo', name: 'Call Center / BPO' },
    { id: 'admin-executive-assistant', name: 'Admin / Executive Assistant' },
    { id: 'hr-recruitment', name: 'HR / Recruitment' },
    { id: 'general-qa', name: 'General QA' },
    { id: 'finance-accounting', name: 'Finance / Accounting' },
    { id: 'workforce-management', name: 'Workforce Management' },
    { id: 'reporting-data-analyst', name: 'Reporting / Data Analyst' },
    { id: 'business-intelligence-power-bi', name: 'Business Intelligence / Power BI' },
    { id: 'team-lead-supervisor', name: 'Team Lead / Supervisor' },
    { id: 'software-qa-automation', name: 'Software QA / Automation' },
    { id: 'programming-development', name: 'Programming / Development' },
    { id: 'operations-manager', name: 'Operations Manager' },
    { id: 'senior-management', name: 'Senior Management' },
  ],
  stages: [
    {
      id: 'screening',
      name: 'Initial Screening',
      durations: [15, 30],
      defaultDuration: 30,
      price: 100,
      description: 'Elevator pitch, resume walkthrough, and core culture-fit questions.',
    },
    {
      id: 'hiringManager',
      name: 'Hiring Manager Interview',
      durations: [30],
      defaultDuration: 30,
      price: 100,
      description: 'Project deep dives, behavioral competencies, and STAR-method practice.',
    },
    {
      id: 'technical',
      name: 'Technical Interview',
      durations: [45],
      defaultDuration: 45,
      price: 200,
      description: 'Role-specific problem-solving, scenarios, and structured critique.',
    },
    {
      id: 'final',
      name: 'Final Interview',
      durations: [45],
      defaultDuration: 45,
      price: 250,
      description: 'Leadership philosophy, culture alignment, and executive-level questions.',
    },
  ],
  bundles: [
    {
      id: 'corporate',
      name: 'Corporate Track',
      stages: ['screening', 'hiringManager'],
      price: 200,
      description: 'Initial Screening + Hiring Manager Interview',
    },
    {
      id: 'executive',
      name: 'Executive Track',
      stages: ['screening', 'hiringManager', 'technical', 'final'],
      price: 500,
      description: 'All four interview stages',
    },
  ],
  privacyNotice: 'Your details are stored in the service operator’s private booking sheet and used to follow up on this request. The operator should set and disclose a deletion schedule before launch.',
  aiNotesDisclosure: 'We may use meeting notes or AI-assisted transcription to help prepare your feedback. We will explain the method and ask permission before the session. You can decline recording or transcription and still continue.',
} as const

export type InterviewStage = (typeof businessConfig.stages)[number]['id']
export type InterviewBundle = (typeof businessConfig.bundles)[number]['id']
export type PackageType = 'single' | 'bundle'

export interface Booking {
  fullName: string
  email: string
  contactValue: string
  targetRole: string
  companyOrIndustry: string
  experienceLevel: string
  jobCategory: string
  packageType: PackageType | ''
  interviewStage: InterviewStage | ''
  bundleId: InterviewBundle | ''
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
  packageDurationMinutes: number
  interviewStages: string[]
}

export function getStagePrice(stageId: InterviewStage, durationMinutes: number) {
  const stage = businessConfig.stages.find((item) => item.id === stageId)
  if (!stage || !stage.durations.some((duration) => duration === durationMinutes)) return null
  return stage.price
}

export function getPackagePrice(booking: Pick<Booking, 'packageType' | 'interviewStage' | 'bundleId' | 'durationMinutes'>) {
  if (booking.packageType === 'single' && booking.interviewStage) {
    return getStagePrice(booking.interviewStage, booking.durationMinutes)
  }
  if (booking.packageType === 'bundle' && booking.bundleId) {
    return businessConfig.bundles.find((bundle) => bundle.id === booking.bundleId)?.price ?? null
  }
  return null
}

export function getPackageDurationMinutes(booking: Pick<Booking, 'packageType' | 'interviewStage' | 'bundleId' | 'durationMinutes'>) {
  if (booking.packageType === 'single') return booking.durationMinutes
  if (booking.packageType !== 'bundle' || !booking.bundleId) return 0
  const bundle = businessConfig.bundles.find((item) => item.id === booking.bundleId)
  if (!bundle) return 0
  return bundle.stages.reduce((total, stageId) => {
    return total + (businessConfig.stages.find((stage) => stage.id === stageId)?.defaultDuration ?? 0)
  }, 0)
}

export function getPackageName(booking: Pick<Booking, 'packageType' | 'interviewStage' | 'bundleId'>) {
  if (booking.packageType === 'single' && booking.interviewStage) {
    return businessConfig.stages.find((stage) => stage.id === booking.interviewStage)?.name ?? ''
  }
  if (booking.packageType === 'bundle' && booking.bundleId) {
    return businessConfig.bundles.find((bundle) => bundle.id === booking.bundleId)?.name ?? ''
  }
  return ''
}

export function getBundleSavings(bundleId: InterviewBundle) {
  const bundle = businessConfig.bundles.find((item) => item.id === bundleId)
  if (!bundle) return 0
  const individualPrice = bundle.stages.reduce((total, stageId) => {
    const stage = businessConfig.stages.find((item) => item.id === stageId)
    if (!stage) return total
    return total + (getStagePrice(stageId, stage.defaultDuration) ?? 0)
  }, 0)
  return individualPrice - bundle.price
}

export function getPackageStageNames(booking: Pick<Booking, 'packageType' | 'interviewStage' | 'bundleId'>) {
  if (booking.packageType === 'single' && booking.interviewStage) {
    return businessConfig.stages
      .filter((stage) => stage.id === booking.interviewStage)
      .map((stage) => stage.name)
  }
  if (booking.packageType === 'bundle' && booking.bundleId) {
    const bundle = businessConfig.bundles.find((item) => item.id === booking.bundleId)
    return bundle?.stages.map((stageId) =>
      businessConfig.stages.find((stage) => stage.id === stageId)?.name ?? '',
    ) ?? []
  }
  return []
}

export function formatPrice(amount: number) {
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}
