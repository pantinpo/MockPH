import express from 'express'
import { Pool } from 'pg'
import { z } from 'zod'

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', aiMinutesAccounting: 'per_second' })
})

const sessionStartSchema = z.object({
  scenarioId: z.uuid(),
  targetJobTitle: z.string().trim().min(1).max(160),
  industry: z.string().trim().max(160).default(''),
  experienceLevel: z.enum(['entry', 'mid', 'experienced']),
  difficulty: z.enum(['standard', 'challenging']).default('standard'),
  interviewerPersonality: z.enum(['professional', 'warm', 'structured']).default('professional'),
  durationMinutes: z.number().int().min(1).max(60),
})

app.post('/interviews/sessions', async (request, response) => {
  const parsed = sessionStartSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'INVALID_REQUEST' })
    return
  }
  if (!pool) {
    response.status(503).json({ error: 'AI_DATABASE_NOT_CONFIGURED' })
    return
  }
  response.status(501).json({ error: 'AUTHENTICATION_AND_BILLING_REQUIRED' })
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  console.log(`MockCall AI API listening on port ${port}`)
})
