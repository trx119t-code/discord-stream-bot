require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    REST,
    Routes
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const TMDB_API_KEY = '2da39b910e34eeb919f6f92b25637d43';
const TORBOX_API_KEY = 'fbb21907-7aef-4e48-b6e8-d87970df407f';

function getHtmlFile() {
    const paths = [
        path.join(__dirname, 'public', 'index.html'),
        path.join(__dirname, 'index.html')
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
    }
    return null;
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.removeHeader('X-Frame-Options');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const lang = urlParams.searchParams.get('lang') || 'ar-SA';
    const page = urlParams.searchParams.get('page') || '1';

    // 1. بروكسي الصور
    if (req.url.startsWith('/api/image')) {
        const imgPath = urlParams.searchParams.get('path');
        const size = urlParams.searchParams.get('size') || 'w500';
        if (!imgPath) {
            res.writeHead(400);
            return res.end();
        }
        try {
            const imgRes = await axios.get(`https://image.tmdb.org/t/p/${size}${imgPath}`, { responseType: 'arraybuffer' });
            res.writeHead(200, {
                'Content-Type': imgRes.headers['content-type'] || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400'
            });
            res.end(imgRes.data);
        } catch (err) {
            res.writeHead(404);
            res.end();
        }
        return;
    }

    // 2. البحث الشامل
    if (req.url.startsWith('/api/search')) {
        const q = urlParams.searchParams.get('q') || '';
        try {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=${lang}&page=${page}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 3. المحتوى الرائج
    if (req.url.startsWith('/api/trending')) {
        const type = urlParams.searchParams.get('type') || 'all';
        const time = urlParams.searchParams.get('time') || 'week';
        try {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/trending/${type}/${time}?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 4. سينما الآن
    if (req.url.startsWith('/api/now-playing')) {
        try {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 5. استكشاف الأقسام
    if (req.url.startsWith('/api/discover')) {
        const media = urlParams.searchParams.get('media') || 'tv';
        const genres = urlParams.searchParams.get('genres') || '';
        const origin = urlParams.searchParams.get('origin') || '';

        let apiUrl = `https://api.themoviedb.org/3/discover/${media}?api_key=${TMDB_API_KEY}&language=${lang}&sort_by=popularity.desc&page=${page}`;
        if (genres) apiUrl += `&with_genres=${genres}`;
        if (origin) apiUrl += `&with_origin_country=${origin}`;

        try {
            const tmdbRes = await axios.get(apiUrl);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 6. تفاصيل العمل ومعرف IMDb
    if (req.url.startsWith('/api/item/full-details')) {
        const id = urlParams.searchParams.get('id');
        const media = urlParams.searchParams.get('media') || 'tv';
        try {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/${media}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,external_ids,similar&language=${lang}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
        }
        return;
    }

    // 7. حلقات المسلسل
    if (req.url.startsWith('/api/tv/season')) {
        const id = urlParams.searchParams.get('id');
        const seasonNum = urlParams.searchParams.get('season') || '1';
        try {
            const tmdbRes = await axios.get(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=${lang}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(tmdbRes.data));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ episodes: [] }));
        }
        return;
    }

    // 8. محرك السحب السحابي الحقيقي (Torrentio + Torbox Direct Integration)
    if (req.url.startsWith('/api/debrid/stream')) {
        let imdbId = urlParams.searchParams.get('imdb') || '';
        const tmdbId = urlParams.searchParams.get('tmdb') || '';
        const isTv = urlParams.searchParams.get('is_tv') === 'true';
        const season = urlParams.searchParams.get('season') || '1';
        const episode = urlParams.searchParams.get('episode') || '1';

        // محاولة جلب معرف IMDb إذا لم يُرسل
        if (!imdbId && tmdbId) {
            try {
                const extRes = await axios.get(`https://api.themoviedb.org/3/${isTv ? 'tv' : 'movie'}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
                imdbId = extRes.data.imdb_id || '';
            } catch (e) {}
        }

        if (!imdbId) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, streamUrl: null }));
        }

        try {
            const mediaType = isTv ? 'series' : 'movie';
            const queryTarget = isTv ? `${imdbId}:${season}:${episode}` : `${imdbId}`;
            
            // استدعاء محرك التورنت السحابي المربوط بحساب Torbox الخاص بك
            const torrentioUrl = `https://torrentio.strem.fun/torbox=${TORBOX_API_KEY}/stream/${mediaType}/${queryTarget}.json`;

            const tbResponse = await axios.get(torrentioUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000
            });

            if (tbResponse.data && tbResponse.data.streams && tbResponse.data.streams.length > 0) {
                // العثور على أفضل رابط تدفق مباشر صافٍ
                const streamItem = tbResponse.data.streams.find(s => s.url) || tbResponse.data.streams[0];
                if (streamItem && streamItem.url) {
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    return res.end(JSON.stringify({ 
                        success: true, 
                        streamUrl: streamItem.url,
                        title: streamItem.title || 'بث مباشر 1080p'
                    }));
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: false, streamUrl: null }));
        } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, streamUrl: null }));
        }
        return;
    }

    // 9. محرك جلب الترجمة العربية المعتمدة من OpenSubtitles
    if (req.url.startsWith('/api/subtitles/find')) {
        const imdbId = urlParams.searchParams.get('imdb');
        const isTv = urlParams.searchParams.get('is_tv') === 'true';
        const season = urlParams.searchParams.get('season') || '1';
        const episode = urlParams.searchParams.get('episode') || '1';

        if (!imdbId) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ subtitles: [] }));
        }

        try {
            const queryPath = isTv ? `series/${imdbId}:${season}:${episode}.json` : `movie/${imdbId}.json`;
            const subRes = await axios.get(`https://opensubtitles-v3.strem.io/subtitles/${queryPath}`, { timeout: 6000 });
            
            const arabicSubs = (subRes.data.subtitles || [])
                .filter(s => s.lang === 'ara' || s.lang === 'ar' || (s.id && s.id.toLowerCase().includes('arabic')))
                .map((s, idx) => ({
                    id: s.id || `ar-${idx}`,
                    name: `ترجمة عربية معتمدة ${idx + 1}`,
                    url: `/api/subtitles/proxy?url=${encodeURIComponent(s.url)}`
                }));

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ subtitles: arabicSubs }));
        } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ subtitles: [] }));
        }
        return;
    }

    // 10. بروكسي وتنسيق ملفات الترجمة (.vtt)
    if (req.url.startsWith('/api/subtitles/proxy')) {
        const subUrl = urlParams.searchParams.get('url');
        if (!subUrl) {
            res.writeHead(400);
            return res.end();
        }
        try {
            const fetchRes = await axios.get(subUrl, { responseType: 'text', timeout: 6000 });
            let subText = fetchRes.data;

            if (!subText.trim().startsWith('WEBVTT')) {
                subText = 'WEBVTT\n\n' + subText.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
            }

            res.writeHead(200, {
                'Content-Type': 'text/vtt; charset=utf-8',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(subText);
        } catch (err) {
            res.writeHead(404);
            res.end();
        }
        return;
    }

    // تقديم الواجهة
    const htmlData = getHtmlFile();
    if (htmlData) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlData);
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<body style="background:#080608;color:#fff;text-align:center;padding-top:50px;"><h1>⚠️ ملف index.html غير موجود</h1></body>');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 خادم الويب يعمل على المنفذ: ${PORT}`);
});

async function registerActivityCommand() {
    if (!client.user) return;
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: [
                    {
                        name: 'cinema',
                        description: 'تشغيل سينما ديسكورد التفاعلية',
                        type: 4,
                        handler: 2,
                        integration_types: [0, 1],
                        contexts: [0, 1, 2]
                    }
                ]
            }
        );
        console.log('✅ تم تسجيل Entry Point Command بنجاح!');
    } catch (error) {
        console.error('ملاحظة:', error.message);
    }
}

client.on('ready', async () => {
    console.log(`✅ البوت متصل: ${client.user.tag}`);
    await registerActivityCommand();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'dplay') {
        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply('⚠️ يرجى دخول أي روم صوتي أولاً لتشغيل سينما ديسكورد!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF2A42')
            .setTitle('🍿 سينما ديسكورد التفاعلية (Orbit Royal)')
            .setDescription(`جاهز للعرض داخل: <#${voiceChannel.id}>\n\nاضغط على الزر بالأسفل لبدء المشاهدة مباشرة!`)
            .setImage('https://image.tmdb.org/t/p/w1280/8Z8W5pE2u4bX9QG5N0oP7jH8XvW.jpg');

        const activityUrl = `https://discord.com/activities/${client.user.id}/${voiceChannel.id}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🚀 فتح السينما')
                .setStyle(ButtonStyle.Link)
                .setURL(activityUrl)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.login(BOT_TOKEN);
