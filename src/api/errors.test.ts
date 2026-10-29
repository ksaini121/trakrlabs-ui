import { describe, expect, it } from 'vitest'
import { errorFromResponse } from './errors'

describe('errorFromResponse', () => {
  it('reads FastAPI 422 field errors into fieldErrors', () => {
    const error = errorFromResponse(422, {
      detail: [
        { loc: ['body', 'github_repo_name'], msg: "String should match pattern '^[\\w.-]+/[\\w.-]+$'", type: 'string_pattern_mismatch' },
        { loc: ['body', 'title'], msg: 'Field required', type: 'missing' },
      ],
    })
    expect(error.code).toBe('validation')
    expect(error.fieldErrors).toEqual({
      github_repo_name: "String should match pattern '^[\\w.-]+/[\\w.-]+$'",
      title: 'Field required',
    })
    expect(error.message).toContain('String should match pattern')
  })

  it('strips pydantic\'s "Value error, " prefix', () => {
    const error = errorFromResponse(422, { detail: [{ loc: ['body', 'email'], msg: 'Value error, bad email', type: 'value_error' }] })
    expect(error.fieldErrors.email).toBe('bad email')
  })

  it('uses a plain detail string as the message', () => {
    const error = errorFromResponse(409, { detail: 'dan@northwind.io is already a member of this project.' })
    expect(error.code).toBe('validation')
    expect(error.message).toBe('dan@northwind.io is already a member of this project.')
    expect(error.fieldErrors).toEqual({})
  })

  it('maps statuses to codes', () => {
    expect(errorFromResponse(401, { detail: 'Not authenticated' }).code).toBe('unauthorized')
    expect(errorFromResponse(403, null).code).toBe('forbidden')
    expect(errorFromResponse(404, null).code).toBe('notFound')
    expect(errorFromResponse(429, null).code).toBe('rateLimited')
  })

  it('gives server errors a generic message', () => {
    const error = errorFromResponse(500, { detail: 'Internal Server Error' })
    expect(error.code).toBe('unknown')
    expect(errorFromResponse(502, null).message).toBe('Something went wrong. Try again.')
  })
})
