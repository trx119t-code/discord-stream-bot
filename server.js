import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',').map(x => x.trim()).filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin include local health checks; browser origins must be explicitly allowed.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'OPTIONS'],
  maxAge: 86400
}));
app.use(express.json({ limit: '16kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }));

const TMDB_API = 'https://api.themoviedb.org/3';
const IMAGE_HOST = 'https://image.tmdb.org/t/p';
const validMedia = new Set(['movie', 'tv']);
const validTrendTypes = new Set(['all', 'movie', 'tv', 'person']);
const validTime = new Set(['day', 'week']);
const validImageSizes = new Set(['w342', 'w500', 'w780', 'original']);

function parsePositiveInt(value, fallback, max = 50000) {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
}
function language(value) {
  return ['ar-SA', 'en-US', 'ar', 'en'].includes(value) ? value : 'ar-SA';
}
function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
async function tmdb(path, params = {}) {
  if (!TMDB_TOKEN) {
    const error = new Error('TMDB_READ_ACCESS_TOKEN is not configured on the server.');
    error.status = 503;
    throw error;
  }
  const url = new URL(`${TMDB_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000)
  });
  if (!response.ok) {
    const error = new Error(`Metadata provider returned ${response.status}`);
    error.status = response.status === 404 ? 404 : 502;
    throw error;
  }
  return response.json();
}
function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'orbit-imperial-api' }));

app.get('/api/trending', asyncRoute(async (req, res) => {
  const type = validTrendTypes.has(req.query.type) ? req.query.type : 'all';
  const time = validTime.has(req.query.time) ? req.query.time : 'week';
  const page = parsePositiveInt(req.query.page, 1, 500);
  res.json(await tmdb(`/trending/${type}/${time}`, { language: language(req.query.lang), page }));
}));

app.get('/api/discover', asyncRoute(async (req, res) => {
  const media = validMedia.has(req.query.media) ? req.query.media : 'movie';
  const genres = typeof req.query.genres === 'string' && /^[0-9,]{0,80}$/.test(req.query.genres) ? req.query.genres : '';
  const origin = typeof req.query.origin === 'string' && /^[A-Z]{2}$/.test(req.query.origin) ? req.query.origin : '';
  const page = parsePositiveInt(req.query.page, 1, 500);
  res.json(await tmdb(`/discover/${media}`, {
    language: language(req.query.lang), page, with_genres: genres,
    with_origin_country: origin, sort_by: 'popularity.desc', include_adult: 'false'
  }));
}));

app.get('/api/now-playing', asyncRoute(async (req, res) => {
  res.json(await tmdb('/movie/now_playing', { language: language(req.query.lang), page: parsePositiveInt(req.query.page, 1, 500) }));
}));

app.get('/api/search', asyncRoute(async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
  if (!q) return res.json({ results: [] });
  res.json(await tmdb('/search/multi', { query: q, language: language(req.query.lang), include_adult: 'false', page: parsePositiveInt(req.query.page, 1, 500) }));
}));

app.get('/api/item/full-details', asyncRoute(async (req, res) => {
  const id = parsePositiveInt(req.query.id, 0);
  const media = validMedia.has(req.query.media) ? req.query.media : '';
  if (!id || !media) return sendError(res, 400, 'A valid id and media=movie|tv are required.');
  const lang = language(req.query.lang);
  const [details, providers] = await Promise.all([
    tmdb(`/${media}/${id}`, { language: lang, append_to_response: 'external_ids,similar,credits,videos' }),
    tmdb(`/${media}/${id}/watch/providers`)
  ]);
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=1800');
  res.json({ ...details, watch_providers: providers?.results || {} });
}));

app.get('/api/tv/season', asyncRoute(async (req, res) => {
  const id = parsePositiveInt(req.query.id, 0);
  const season = Number.parseInt(req.query.season, 10);
  if (!id || !Number.isInteger(season) || season < 0 || season > 100) return sendError(res, 400, 'A valid TV id and season are required.');
  res.json(await tmdb(`/tv/${id}/season/${season}`, { language: language(req.query.lang) }));
}));

// Image proxy: only TMDB image paths and a fixed set of sizes are accepted.
app.get('/api/image', asyncRoute(async (req, res) => {
  const imagePath = typeof req.query.path === 'string' ? req.query.path : '';
  const size = validImageSizes.has(req.query.size) ? req.query.size : 'w500';
  if (!/^\/(?:[A-Za-z0-9_./-]+)$/.test(imagePath) || imagePath.includes('..')) {
    return sendError(res, 400, 'Invalid image path.');
  }
  const upstream = await fetch(`${IMAGE_HOST}/${size}${imagePath}`, { signal: AbortSignal.timeout(12_000) });
  if (!upstream.ok) return sendError(res, upstream.status === 404 ? 404 : 502, 'Image is unavailable.');
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  res.set('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
  res.set('X-Content-Type-Options', 'nosniff');
  const body = Buffer.from(await upstream.arrayBuffer());
  res.end(body);
}));

app.use((_req, res) => sendError(res, 404, 'Route not found.'));
app.use((err, _req, res, _next) => {
  console.error('[ORBIT API]', err.message);
  if (res.headersSent) return res.end();
  const status = Number.isInteger(err.status) ? err.status : (err.name === 'TimeoutError' ? 504 : 502);
  res.status(status).json({ error: status === 503 ? err.message : 'The metadata service is temporarily unavailable.' });
});

app.listen(PORT, () => console.log(`ORBIT API listening on ${PORT}`));
