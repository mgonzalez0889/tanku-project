import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './api.ts'

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('request', () => {
  it('returns the parsed JSON when the API answers well', async () => {
    stubFetch(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))

    expect(await request('GET', '/api/health')).toEqual({ status: 'ok' })
  })

  it('throws an ApiError carrying the code the API sent', async () => {
    stubFetch(new Response(JSON.stringify({ error: 'INVALID_GIFT' }), { status: 400 }))

    const failure = request('POST', '/api/gifts', {})

    await expect(failure).rejects.toBeInstanceOf(ApiError)
    await expect(failure).rejects.toMatchObject({ code: 'INVALID_GIFT' })
  })

  it('throws an UNKNOWN ApiError when the error body is not JSON', async () => {
    stubFetch(new Response('<html>bad gateway</html>', { status: 502 }))

    await expect(request('GET', '/api/users')).rejects.toMatchObject({ code: 'UNKNOWN' })
  })

  it('throws an UNKNOWN ApiError when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))

    await expect(request('GET', '/api/users')).rejects.toMatchObject({ code: 'UNKNOWN' })
  })

  it('sends a JSON body with its content-type', async () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    await request('PUT', '/api/users/user-1/taste-card', { likedTags: ['music'] })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/user-1/taste-card', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: '{"likedTags":["music"]}',
    })
  })

  it('sends no body and no content-type on a GET', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    await request('GET', '/api/users')

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'GET',
      headers: undefined,
      body: undefined,
    })
  })
})
