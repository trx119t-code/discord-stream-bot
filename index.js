require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
const axios = require('axios');
const cheerio = require('cheerio');
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

// محرك كاشط الفانسب العربي الأصلي
async function scrapeArabicAnimeServers(enTitle, arTitle, episodeNum) {
    const servers = [];
    const searchQueries = [enTitle, arTitle].filter(Boolean);

    for (const q of searchQueries) {
        try {
            const cleanQuery = q.toLowerCase().replace(/season\s*\d+/gi, '').trim();
            const searchUrl = `https://witanime.pics/?search_query=${encodeURIComponent(cleanQuery)}`;
            
            const searchRes = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'ar,en;q=0.9'
                },
                timeout: 5000
            });

            const $ = cheerio.load(searchRes.data);
            let animeLink = $('.anime-card-title a, .entry-title a, a[href*="/anime/"]').first().attr('href');

            if (animeLink) {
                const animePageRes = await axios.get(animeLink, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 5000
                });
                const $anime = cheerio.load(animePageRes.data);

                let epUrl = null;
                $anime('a[href*="-الحلقة-"], a[href*="/episode/"]').each((i, el) => {
                    const text = $anime(el).text().trim();
                    const href = $anime(el).attr('href');
                    if (text === `${episodeNum}` || text.includes(` ${episodeNum} `) || href.includes(`-${episodeNum}/`)) {
                        if (!epUrl) epUrl = href;
                    }
                });

                if (!epUrl) {
                    epUrl = $anime('a[href*="-الحلقة-"], a[href*="/episode/"]').first().attr('href');
                }

                if (epUrl) {
                    const epRes = await axios.get(epUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' },
                        timeout: 5000
                    });
                    const $ep = cheerio.load(epRes.data);

                    $ep('#episode-servers li, ul.servers-list li, .server-item').each((i, el) => {
                        let dataUrl = $ep(el).attr('data-url') || $ep(el).find('a').attr('data-url');
                        let srvName = $ep(el).text().trim() || `سيرفر عربي ${i + 1}`;

                        if (dataUrl) {
                            let decoded = dataUrl;
                            if (!dataUrl.startsWith('http')) {
                                try {
                                    decoded = Buffer.from(dataUrl, 'base64').toString('utf-8');
                                } catch (e) {}
                            }
                            if (decoded && decoded.startsWith('http')) {
                                servers.push({
                                    name: `🇸🇦 ${srvName} (ترجمة عربية أصلية)`,
                                    url: decoded
                                });
                            }
                        }
                    });

                    if (servers.length > 0) break;
                }
            }
        } catch (err) {
            // الاستمرار للبحث التالي في حال تعثر أحد المصادر
        }
    }

    return servers;
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

    // 6. تفاصيل العمل
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

    // 8. مسار كاشط الأنمي العربي لجلب سيرفرات الفانسب المباشرة
    if (req.url.startsWith('/api/anime/servers')) {
        const enTitle = urlParams.searchParams.get('en_title') || '';
        const arTitle = urlParams.searchParams.get('ar_title') || '';
        const ep = urlParams.searchParams.get('ep') || '1';

        try {
            const scrapedServers = await scrapeArabicAnimeServers(enTitle, arTitle, ep);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ servers: scrapedServers }));
        } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ servers: [] }));
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
