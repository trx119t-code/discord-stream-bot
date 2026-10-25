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

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },

  methods: ['GET', 'HEAD', 'OPTIONS'],
  maxAge: 86400
}));

app.use(express.json({ limit: '16kb' }));

app.use('/api', rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));

const TMDB_API = 'https://api.themoviedb.org/3';
const IMAGE_HOST = 'https://image.tmdb.org/t/p';

const validMedia = new Set(['movie', 'tv']);
const validTrendTypes = new Set([
  'all',
  'movie',
  'tv',
  'person'
]);

const validTime = new Set([
  'day',
  'week'
]);

const validImageSizes = new Set([
  'w342',
  'w500',
  'w780',
  'original'
]);

function parsePositiveInt(
  value,
  fallback,
  max = 10000000
) {
  const n = Number.parseInt(value, 10);

  return Number.isInteger(n) &&
    n > 0 &&
    n <= max
    ? n
    : fallback;
}

function language(value) {
  return [
    'ar-SA',
    'en-US',
    'ar',
    'en'
  ].includes(value)
    ? value
    : 'ar-SA';
}

function sendError(
  res,
  status,
  message
) {
  return res
    .status(status)
    .json({ error: message });
}

async function tmdb(
  path,
  params = {}
) {
  if (!TMDB_TOKEN) {
    const error = new Error(
      'TMDB_READ_ACCESS_TOKEN is not configured on the server.'
    );

    error.status = 503;
    throw error;
  }

  const url = new URL(
    `${TMDB_API}${path}`
  );

  for (
    const [key, value]
    of Object.entries(params)
  ) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      url.searchParams.set(
        key,
        String(value)
      );
    }
  }

  const response = await fetch(
    url,
    {
      headers: {
        Authorization:
          `Bearer ${TMDB_TOKEN}`,

        Accept:
          'application/json'
      },

      signal:
        AbortSignal.timeout(12_000)
    }
  );

  if (!response.ok) {
    const error = new Error(
      `Metadata provider returned ${response.status}`
    );

    error.status =
      response.status === 404
        ? 404
        : 502;

    throw error;
  }

  return response.json();
}

function asyncRoute(handler) {
  return (req, res, next) =>
    Promise
      .resolve(
        handler(req, res, next)
      )
      .catch(next);
}

/* =========================
   HEALTH
========================= */

app.get(
  '/health',
  (_req, res) => {
    res.json({
      ok: true,
      service: 'orbit-imperial-api'
    });
  }
);

/* =========================
   TRENDING
========================= */

app.get(
  '/api/trending',
  asyncRoute(async (req, res) => {
    const type =
      validTrendTypes.has(
        req.query.type
      )
        ? req.query.type
        : 'all';

    const time =
      validTime.has(
        req.query.time
      )
        ? req.query.time
        : 'week';

    const page =
      parsePositiveInt(
        req.query.page,
        1,
        500
      );

    res.json(
      await tmdb(
        `/trending/${type}/${time}`,
        {
          language:
            language(req.query.lang),

          page
        }
      )
    );
  })
);

/* =========================
   DISCOVER
========================= */

app.get(
  '/api/discover',
  asyncRoute(async (req, res) => {
    const media =
      validMedia.has(
        req.query.media
      )
        ? req.query.media
        : 'movie';

    const genres =
      typeof req.query.genres ===
        'string' &&
      /^[0-9,]{0,80}$/.test(
        req.query.genres
      )
        ? req.query.genres
        : '';

    const origin =
      typeof req.query.origin ===
        'string' &&
      /^[A-Z]{2}$/.test(
        req.query.origin
      )
        ? req.query.origin
        : '';

    const page =
      parsePositiveInt(
        req.query.page,
        1,
        500
      );

    const year =
      typeof req.query.year ===
        'string' &&
      /^(19|20)\d{2}$/.test(
        req.query.year
      )
        ? req.query.year
        : '';

    const rating =
      Number(req.query.rating);

    const originalLanguage =
      typeof req.query.language ===
        'string' &&
      /^[a-z]{2}$/.test(
        req.query.language
      )
        ? req.query.language
        : '';

    const runtimeMax =
      parsePositiveInt(
        req.query.runtime_max,
        0,
        1000
      );

    const runtimeMin =
      parsePositiveInt(
        req.query.runtime_min,
        0,
        1000
      );

    const region =
      typeof req.query.region ===
        'string' &&
      /^[A-Z]{2}$/.test(
        req.query.region
      )
        ? req.query.region
        : '';

    const status =
      typeof req.query.status ===
        'string' &&
      /^[0-5]$/.test(
        req.query.status
      )
        ? req.query.status
        : '';

    const allowedSort =
      new Set([
        'popularity.desc',
        'vote_average.desc',
        'primary_release_date.desc',
        'first_air_date.desc'
      ]);

    const sort =
      allowedSort.has(
        req.query.sort
      )
        ? req.query.sort
        : 'popularity.desc';

    const params = {
      language:
        language(req.query.lang),

      page,

      with_genres:
        genres,

      with_origin_country:
        origin,

      sort_by:
        sort,

      include_adult:
        'false',

      with_original_language:
        originalLanguage,

      region,

      with_status:
        status,

      'vote_average.gte':
        Number.isFinite(rating) &&
        rating >= 0 &&
        rating <= 10
          ? rating
          : '',

      'with_runtime.lte':
        runtimeMax || '',

      'with_runtime.gte':
        runtimeMin || ''
    };

    if (year) {
      if (media === 'movie') {
        params.primary_release_year =
          year;
      } else {
        params.first_air_date_year =
          year;
      }
    }

    res.json(
      await tmdb(
        `/discover/${media}`,
        params
      )
    );
  })
);

/* =========================
   NOW PLAYING
========================= */

app.get(
  '/api/now-playing',
  asyncRoute(async (req, res) => {
    res.json(
      await tmdb(
        '/movie/now_playing',
        {
          language:
            language(req.query.lang),

          page:
            parsePositiveInt(
              req.query.page,
              1,
              500
            )
        }
      )
    );
  })
);

/* =========================
   SEARCH
========================= */

app.get(
  '/api/search',
  asyncRoute(async (req, res) => {
    const q =
      typeof req.query.q ===
        'string'
        ? req.query.q
            .trim()
            .slice(0, 120)
        : '';

    if (!q) {
      return res.json({
        results: []
      });
    }

    res.json(
      await tmdb(
        '/search/multi',
        {
          query: q,

          language:
            language(req.query.lang),

          include_adult:
            'false',

          page:
            parsePositiveInt(
              req.query.page,
              1,
              500
            )
        }
      )
    );
  })
);

/* =========================
   FULL DETAILS
========================= */

app.get(
  '/api/item/full-details',
  asyncRoute(async (req, res) => {
    const id =
      parsePositiveInt(
        req.query.id,
        0
      );

    const media =
      validMedia.has(
        req.query.media
      )
        ? req.query.media
        : '';

    if (!id || !media) {
      return sendError(
        res,
        400,
        'A valid id and media=movie|tv are required.'
      );
    }

    const lang =
      language(req.query.lang);

    const needsEnglishFallback =
      !String(lang)
        .toLowerCase()
        .startsWith('en');

    const [
      details,
      providers,
      english
    ] = await Promise.all([
      tmdb(
        `/${media}/${id}`,
        {
          language: lang,

          append_to_response:
            'external_ids,similar,credits,videos,images'
        }
      ),

      tmdb(
        `/${media}/${id}/watch/providers`
      ),

      needsEnglishFallback
        ? tmdb(
            `/${media}/${id}`,
            {
              language:
                'en-US',

              append_to_response:
                'videos'
            }
          ).catch(
            () => null
          )
        : Promise.resolve(null)
    ]);

    const merged = {
      ...details
    };

    if (
      (
        !merged.overview ||
        !String(
          merged.overview
        ).trim()
      ) &&
      english?.overview
    ) {
      merged.overview =
        english.overview;
    }

    if (
      (
        !merged.tagline ||
        !String(
          merged.tagline
        ).trim()
      ) &&
      english?.tagline
    ) {
      merged.tagline =
        english.tagline;
    }

    if (
      (
        !merged.homepage ||
        !String(
          merged.homepage
        ).trim()
      ) &&
      english?.homepage
    ) {
      merged.homepage =
        english.homepage;
    }

    if (
      !merged
        .videos
        ?.results
        ?.length &&
      english
        ?.videos
        ?.results
        ?.length
    ) {
      merged.videos =
        english.videos;
    }

    res.set(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=1800'
    );

    res.json({
      ...merged,

      watch_providers:
        providers?.results || {}
    });
  })
);

/* =========================
   TV SEASON
========================= */

app.get(
  '/api/tv/season',
  asyncRoute(async (req, res) => {
    const id =
      parsePositiveInt(
        req.query.id,
        0
      );

    const season =
      Number.parseInt(
        req.query.season,
        10
      );

    if (
      !id ||
      !Number.isInteger(season) ||
      season < 0 ||
      season > 100
    ) {
      return sendError(
        res,
        400,
        'A valid TV id and season are required.'
      );
    }

    const lang =
      language(req.query.lang);

    const needsEnglishFallback =
      !String(lang)
        .toLowerCase()
        .startsWith('en');

    const [
      primary,
      english
    ] = await Promise.all([
      tmdb(
        `/tv/${id}/season/${season}`,
        {
          language: lang
        }
      ),

      needsEnglishFallback
        ? tmdb(
            `/tv/${id}/season/${season}`,
            {
              language:
                'en-US'
            }
          ).catch(
            () => null
          )
        : Promise.resolve(null)
    ]);

    if (
      english?.episodes?.length &&
      primary?.episodes?.length
    ) {
      const byNumber =
        new Map(
          english.episodes.map(
            ep => [
              Number(
                ep.episode_number
              ),
              ep
            ]
          )
        );

      primary.episodes =
        primary.episodes.map(
          ep => {
            const en =
              byNumber.get(
                Number(
                  ep.episode_number
                )
              );

            if (!en) {
              return ep;
            }

            return {
              ...ep,

              name:
                (
                  ep.name &&
                  String(
                    ep.name
                  ).trim()
                )
                  ? ep.name
                  : en.name,

              overview:
                (
                  ep.overview &&
                  String(
                    ep.overview
                  ).trim()
                )
                  ? ep.overview
                  : en.overview
            };
          }
        );
    }

    if (
      (
        !primary.overview ||
        !String(
          primary.overview
        ).trim()
      ) &&
      english?.overview
    ) {
      primary.overview =
        english.overview;
    }

    if (
      (
        !primary.name ||
        !String(
          primary.name
        ).trim()
      ) &&
      english?.name
    ) {
      primary.name =
        english.name;
    }

    res.set(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=1800'
    );

    res.json(primary);
  })
);

/* =========================
   UPCOMING
========================= */

app.get(
  '/api/upcoming',
  asyncRoute(async (req, res) => {
    res.json(
      await tmdb(
        '/movie/upcoming',
        {
          language:
            language(req.query.lang),

          region:
            typeof req.query.region ===
              'string'
              ? req.query.region
              : '',

          page:
            parsePositiveInt(
              req.query.page,
              1,
              500
            )
        }
      )
    );
  })
);

/* =========================
   AIRING TODAY
========================= */

app.get(
  '/api/airing-today',
  asyncRoute(async (req, res) => {
    res.json(
      await tmdb(
        '/tv/airing_today',
        {
          language:
            language(req.query.lang),

          page:
            parsePositiveInt(
              req.query.page,
              1,
              500
            )
        }
      )
    );
  })
);

/* =========================
   RECOMMENDATIONS
========================= */

app.get(
  '/api/recommendations',
  asyncRoute(async (req, res) => {
    const id =
      parsePositiveInt(
        req.query.id,
        0
      );

    const media =
      validMedia.has(
        req.query.media
      )
        ? req.query.media
        : '';

    if (!id || !media) {
      return sendError(
        res,
        400,
        'A valid id and media are required.'
      );
    }

    res.json(
      await tmdb(
        `/${media}/${id}/recommendations`,
        {
          language:
            language(req.query.lang),

          page:
            parsePositiveInt(
              req.query.page,
              1,
              100
            )
        }
      )
    );
  })
);

/* =========================
   PERSON
========================= */

app.get(
  '/api/person',
  asyncRoute(async (req, res) => {
    const id =
      parsePositiveInt(
        req.query.id,
        0
      );

    if (!id) {
      return sendError(
        res,
        400,
        'A valid person id is required.'
      );
    }

    const lang =
      language(req.query.lang);

    const primary =
      await tmdb(
        `/person/${id}`,
        {
          language: lang,

          append_to_response:
            'combined_credits,images,external_ids'
        }
      );

    if (
      (
        !primary.biography ||
        !String(
          primary.biography
        ).trim()
      ) &&
      !String(lang)
        .toLowerCase()
        .startsWith('en')
    ) {
      const en =
        await tmdb(
          `/person/${id}`,
          {
            language:
              'en-US'
          }
        ).catch(
          () => null
        );

      if (en?.biography) {
        primary.biography =
          en.biography;
      }
    }

    res.set(
      'Cache-Control',
      'public, max-age=600, stale-while-revalidate=3600'
    );

    res.json(primary);
  })
);

/* =========================
   IMAGE PROXY
========================= */

app.get(
  '/api/image',
  asyncRoute(async (req, res) => {
    const imagePath =
      typeof req.query.path ===
        'string'
        ? req.query.path
        : '';

    const size =
      validImageSizes.has(
        req.query.size
      )
        ? req.query.size
        : 'w500';

    if (
      !/^\/(?:[A-Za-z0-9_./-]+)$/.test(
        imagePath
      ) ||
      imagePath.includes('..')
    ) {
      return sendError(
        res,
        400,
        'Invalid image path.'
      );
    }

    const upstream =
      await fetch(
        `${IMAGE_HOST}/${size}${imagePath}`,
        {
          signal:
            AbortSignal.timeout(
              12_000
            )
        }
      );

    if (!upstream.ok) {
      return sendError(
        res,
        upstream.status === 404
          ? 404
          : 502,

        'Image is unavailable.'
      );
    }

    res.set(
      'Cache-Control',
      'public, max-age=86400, stale-while-revalidate=604800'
    );

    res.set(
      'Content-Type',
      upstream.headers.get(
        'content-type'
      ) ||
        'image/jpeg'
    );

    res.set(
      'X-Content-Type-Options',
      'nosniff'
    );

    const body =
      Buffer.from(
        await upstream.arrayBuffer()
      );

    res.end(body);
  })
);

/* =========================
   404
========================= */

app.use(
  (_req, res) => {
    sendError(
      res,
      404,
      'Route not found.'
    );
  }
);

/* =========================
   ERROR HANDLER
========================= */

app.use(
  (err, _req, res, _next) => {
    console.error(
      '[ORBIT API]',
      err.message
    );

    if (res.headersSent) {
      return res.end();
    }

    const status =
      Number.isInteger(
        err.status
      )
        ? err.status
        : err.name ===
            'TimeoutError'
          ? 504
          : 502;

    res
      .status(status)
      .json({
        error:
          status === 503
            ? err.message
            : 'The metadata service is temporarily unavailable.'
      });
  }
);

/* =========================
   START
========================= */

app.listen(
  PORT,
  () => {
    console.log(
      `ORBIT API listening on ${PORT}`
    );
  }
);
