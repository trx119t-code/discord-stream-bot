require('dotenv').config();

const path = require('path');
const fs = require('fs');
const http = require('http');
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

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.removeHeader('X-Frame-Options');

    // 1. بروكسي الصور عالية الدقة والبوسترات
    if (req.url.startsWith('/api/image')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const imgPath = urlParams.searchParams.get('path');
        const size = urlParams.searchParams.get('size') || 'w500';
        if (!imgPath) {
            res.writeHead(400);
            return res.end();
        }
        try {
            const imgRes = await fetch(`https://image.tmdb.org/t/p/${size}${imgPath}`);
            const buffer = await imgRes.arrayBuffer();
            res.writeHead(200, {
                'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400'
            });
            res.end(Buffer.from(buffer));
        } catch (err) {
            res.writeHead(404);
            res.end();
        }
        return;
    }

    // 2. البحث
    if (req.url.startsWith('/api/search')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const q = urlParams.searchParams.get('q') || '';
        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=ar-SA`);
            const data = await tmdbRes.text();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 3. الرائج
    if (req.url.startsWith('/api/trending')) {
        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_API_KEY}&language=ar-SA`);
            const data = await tmdbRes.text();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ results: [] }));
        }
        return;
    }

    // 4. جلب تفاصيل المسلسل ومواسمه
    if (req.url.startsWith('/api/tv/details')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const id = urlParams.searchParams.get('id');
        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_API_KEY}&language=ar-SA`);
            const data = await tmdbRes.text();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({}));
        }
        return;
    }

    // 5. جلب حلقات موسم محدد بالصور والتفاصيل
    if (req.url.startsWith('/api/tv/season')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const id = urlParams.searchParams.get('id');
        const seasonNum = urlParams.searchParams.get('season') || '1';
        try {
            const tmdbRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNum}?api_key=${TMDB_API_KEY}&language=ar-SA`);
            const data = await tmdbRes.text();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ episodes: [] }));
        }
        return;
    }

    // تقديم صفحة HTML
    const htmlData = getHtmlFile();
    if (htmlData) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlData);
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<body style="background:#0f1015;color:#fff;text-align:center;padding-top:50px;"><h1>⚠️ ملف index.html غير موجود</h1></body>');
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
            .setColor('#FF2228')
            .setTitle('🍿 سينما ديسكورد التفاعلية (Orbit Cinema)')
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
