export type AiRating =
  | 'needs_improvement'
  | 'meeting_expectations'
  | 'exceeding_expectations'

export type InterviewStatus =
  | 'created'
  | 'active'
  | 'completed'
  | 'incomplete'
  | 'technical_failure'
  | 'cancelled'

export interface MinuteLedgerEntry {
  id: string
  transactionType:
    | 'trial_allocation'
    | 'purchase'
    | 'reservation'
    | 'consumption'
    | 'release'
    | 'refund'
    | 'adjustment'
  amountSeconds: number
  balanceAfterSeconds: number
  sessionId?: string
  paymentId?: string
  idempotencyKey: string
  createdAt: string
}

export interface AiInterviewSession {
  id: string
  status: InterviewStatus
  targetJobTitle: string
  industry: string
  experienceLevel: 'entry' | 'mid' | 'experienced'
  difficulty: 'standard' | 'challenging'
  durationSeconds: number
  billableSeconds: number
}
