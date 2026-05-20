const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

async function handleAPI(request, env) {
  const url = new URL(request.url)
  const path = url.pathname

  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    // ── Candidates ──────────────────────────────────────────────

    if (path === '/api/candidates' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT data FROM candidates ORDER BY created_at DESC'
      ).all()
      return json(results.map(r => JSON.parse(r.data)))
    }

    if (path === '/api/candidates' && request.method === 'POST') {
      const c = await request.json()
      await env.DB.prepare(
        'INSERT OR REPLACE INTO candidates (id, data, created_at) VALUES (?, ?, ?)'
      ).bind(c.id, JSON.stringify(c), c.createdAt || new Date().toISOString()).run()
      return json({ ok: true })
    }

    // Bulk insert — used for historical import and localStorage migration
    if (path === '/api/candidates/bulk' && request.method === 'POST') {
      const records = await request.json()
      if (!records.length) return json({ ok: true, count: 0 })
      const stmt = env.DB.prepare(
        'INSERT OR REPLACE INTO candidates (id, data, created_at) VALUES (?, ?, ?)'
      )
      // D1 batch in chunks of 100 to stay within limits
      for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100)
        await env.DB.batch(
          chunk.map(r => stmt.bind(r.id, JSON.stringify(r), r.createdAt || new Date().toISOString()))
        )
      }
      return json({ ok: true, count: records.length })
    }

    const cMatch = path.match(/^\/api\/candidates\/(.+)$/)

    if (cMatch && request.method === 'PUT') {
      const id = cMatch[1]
      const candidate = await request.json()
      await env.DB.prepare(
        'INSERT OR REPLACE INTO candidates (id, data, created_at) VALUES (?, ?, ?)'
      ).bind(id, JSON.stringify(candidate), candidate.createdAt || new Date().toISOString()).run()
      return json({ ok: true })
    }

    if (cMatch && request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM candidates WHERE id = ?').bind(cMatch[1]).run()
      return json({ ok: true })
    }

    // ── Do Not Hire ──────────────────────────────────────────────

    if (path === '/api/dnh' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT data FROM dnh_list ORDER BY created_at DESC'
      ).all()
      return json(results.map(r => JSON.parse(r.data)))
    }

    if (path === '/api/dnh' && request.method === 'POST') {
      const entry = await request.json()
      await env.DB.prepare(
        'INSERT OR REPLACE INTO dnh_list (id, data, created_at) VALUES (?, ?, ?)'
      ).bind(entry.id, JSON.stringify(entry), entry.dateAdded || new Date().toISOString()).run()
      return json({ ok: true })
    }

    if (path === '/api/dnh/bulk' && request.method === 'POST') {
      const records = await request.json()
      if (!records.length) return json({ ok: true, count: 0 })
      const stmt = env.DB.prepare(
        'INSERT OR REPLACE INTO dnh_list (id, data, created_at) VALUES (?, ?, ?)'
      )
      for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100)
        await env.DB.batch(
          chunk.map(r => stmt.bind(r.id, JSON.stringify(r), r.dateAdded || new Date().toISOString()))
        )
      }
      return json({ ok: true, count: records.length })
    }

    const dnhMatch = path.match(/^\/api\/dnh\/(.+)$/)
    if (dnhMatch && request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM dnh_list WHERE id = ?').bind(dnhMatch[1]).run()
      return json({ ok: true })
    }

    return json({ error: 'Not found' }, 404)
  } catch (err) {
    console.error(err)
    return json({ error: String(err) }, 500)
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname.startsWith('/api/')) return handleAPI(request, env)
    return env.ASSETS.fetch(request)
  },
}
