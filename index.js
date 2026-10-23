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

// خادم ويب مدمج لعرض صفحة النشاط
const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Orbit Cinema is Running 24/7!');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 خادم الويب للنشاط يعمل على المنفذ: ${PORT}`);
});

// تسجيل Entry Point Command المطلوب رسميًا من ديسكورد
async function registerActivityCommand() {
    if (!client.user) return;
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    try {
        console.log('⏳ جاري تسجيل أمر تشغيل النشاط لدى ديسكورد...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: [
                    {
                        name: 'cinema',
                        description: 'تشغيل سينما ديسكورد التفاعلية',
                        type: 4, // Primary Entry Point
                        handler: 2, // DISCORD_LAUNCH_ACTIVITY (إجباري لتشغيل النشاط تلقائياً)
                        integration_types: [0, 1],
                        contexts: [0, 1, 2]
                    }
                ]
            }
        );
        console.log('✅ تم تسجيل Entry Point Command بنجاح لدى ديسكورد!');
    } catch (error) {
        console.error('خطأ في تسجيل الأمر:', error);
    }
}

client.on('ready', async () => {
    console.log(`✅ البوت متصل وجاهز: ${client.user.tag}`);
    await registerActivityCommand();
});

// أمر dplay لإرسال بطاقة الدعوة
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'dplay') {
        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply('⚠️ يرجى دخول أي روم صوتي أولاً لتشغيل سينما ديسكورد!');
        }

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('🍿 سينما ديسكورد التفاعلية (Orbit Cinema)')
            .setDescription(`جاهز للعرض داخل: <#${voiceChannel.id}>\n\nاضغط على الزر بالأسفل لبدء المشاهدة مباشرة داخل الديسكورد!`)
            .setImage('https://image.tmdb.org/t/p/w1280/8Z8W5pE2u4bX9QG5N0oP7jH8XvW.jpg');

        const activityUrl = `https://discord.com/activities/${client.user.id}/${voiceChannel.id}`;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('🚀 بدء المشاهدة في الديسكورد')
                .setStyle(ButtonStyle.Link)
                .setURL(activityUrl)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.login(BOT_TOKEN);
