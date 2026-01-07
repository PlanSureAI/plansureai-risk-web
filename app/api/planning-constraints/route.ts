import { NextRequest, NextResponse } from 'next/server'

type CacheEntry = {
  expiresAt: number
  payload: Record<string, unknown>
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const FETCH_TIMEOUT_MS = 10_000
const UK_BOUNDS = {
  latMin: 49.9,
  latMax: 60.9,
  lngMin: -8.2,
  lngMax: 1.8
}
const DEFAULT_DATASETS = [
  'conservation-area',
  'listed-building',
  'article-4-direction-area',
  'tree-preservation-zone',
  'flood-risk-zone'
]
const cache = new Map<string, CacheEntry>()

function getCachedPayload(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.payload
}

function setCachedPayload(key: string, payload: Record<string, unknown>) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload })
}

function buildResponse(payload: Record<string, unknown>, cacheHit: boolean) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600',
      'X-Cache': cacheHit ? 'HIT' : 'MISS'
    }
  })
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')

  if (!latParam || !lngParam) {
    return NextResponse.json(
      { error: 'lat and lng parameters are required' },
      { status: 400 }
    )
  }

  const lat = Number(latParam)
  const lng = Number(lngParam)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: 'lat and lng must be valid numbers' },
      { status: 400 }
    )
  }

  if (
    lat < UK_BOUNDS.latMin ||
    lat > UK_BOUNDS.latMax ||
    lng < UK_BOUNDS.lngMin ||
    lng > UK_BOUNDS.lngMax
  ) {
    return NextResponse.json(
      {
        error: 'lat and lng must be within UK bounds',
        bounds: UK_BOUNDS
      },
      { status: 400 }
    )
  }

  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(limitParam ?? DEFAULT_LIMIT))
  )
  const offset = Math.max(0, Number(offsetParam ?? '0'))

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    return NextResponse.json(
      { error: 'limit and offset must be valid numbers' },
      { status: 400 }
    )
  }

  const defaultsParam = searchParams.get('defaults')
  const useDefaults =
    defaultsParam === null
      ? true
      : !['false', '0', 'no'].includes(defaultsParam.toLowerCase())
  const datasetsParam =
    searchParams.get('datasets') ?? searchParams.get('dataset')
  const datasets = datasetsParam
    ? datasetsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : useDefaults
      ? DEFAULT_DATASETS
      : []

  const geometryRelation = searchParams.get('geometry_relation')

  const cacheKey = request.url
  const cachedPayload = getCachedPayload(cacheKey)
  if (cachedPayload) {
    return buildResponse(cachedPayload, true)
  }

  const baseUrl =
    process.env.PLANNING_DATA_BASE_URL ??
    'https://www.planning.data.gov.uk/entity.json'

  const targets = datasets.length > 0 ? datasets : [null]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const responses = await Promise.all(
      targets.map(async (dataset) => {
        const url = new URL(baseUrl)
        url.searchParams.set('longitude', lng.toString())
        url.searchParams.set('latitude', lat.toString())
        url.searchParams.set('limit', limit.toString())
        if (offset > 0) {
          url.searchParams.set('offset', offset.toString())
        }
        if (dataset) {
          url.searchParams.set('dataset', dataset)
        }
        if (geometryRelation) {
          url.searchParams.set('geometry_relation', geometryRelation)
        }

        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(
            `Planning Data API error (${response.status}): ${errorText}`
          )
        }

        const json = (await response.json()) as {
          entities?: Record<string, unknown>[]
          count?: number
          links?: Record<string, string>
        }

        return {
          dataset,
          url: url.toString(),
          response: json
        }
      })
    )

    const constraints = responses.flatMap(({ response }) => {
      const entities = response.entities ?? []
      return entities.map((entity) => ({
        entity: entity.entity,
        dataset: entity.dataset,
        name: entity.name ?? null,
        reference: entity.reference ?? null,
        description: entity.description ?? null,
        geometry: entity.geometry ?? null,
        point: entity.point ?? null,
        organisation_entity: entity['organisation-entity'] ?? null,
        entry_date: entity['entry-date'] ?? null,
        start_date: entity['start-date'] ?? null,
        end_date: entity['end-date'] ?? null
      }))
    })

    const payload = {
      location: { lat, lng },
      datasets: datasets.length > 0 ? datasets : null,
      limit,
      offset,
      count: constraints.length,
      constraints,
      sources: responses.map(({ dataset, url, response }) => ({
        dataset,
        url,
        count: response.count ?? null,
        links: response.links ?? null
      })),
      metadata: {
        query_time_ms: Date.now() - startTime,
        ...(useDefaults
          ? {}
          : {
              warning:
                'Unfiltered query (defaults=false) may be slow. Consider specifying datasets for better performance.'
            })
      }
    }

    setCachedPayload(cacheKey, payload)
    return buildResponse(payload, false)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Planning Data API request timed out' },
        { status: 504 }
      )
    }
    return NextResponse.json({ error: message }, { status: 502 })
  } finally {
    clearTimeout(timeoutId)
  }
}
