require('dotenv').config();

const path = require('path');
const express = require('express');
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
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

// إعداد خادم ويب Express لتقديم صفحة الـ Activity
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 خادم الويب للنشاط يعمل على المنفذ: ${PORT}`);
});

client.on('ready', () => {
    console.log(`✅ البوت متصل وجاهز: ${client.user.tag}`);
});

// استقبال أمر التشغيل dplay
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'dplay') {
        const voiceChannel = message.member?.voice?.channel;

        if (!voiceChannel) {
            return message.reply('⚠️ يرجى دخول أي روم صوتي أولاً لتشغيل سينما ديسكورد!');
        }

        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setTitle('🍿 سينما ديسكورد التفاعلية (Discord Activity)')
            .setDescription(`جاهز للعرض داخل: <#${voiceChannel.id}>\n\nاضغط على الزر بالأسفل لتشغيل السينما مباشرة في الروم الصوتي مع أصدقائك بدون فتح متصفح خارجي أو مشاركة شاشة!`)
            .setImage('https://image.tmdb.org/t/p/w1280/8Z8W5pE2u4bX9QG5N0oP7jH8XvW.jpg');

        // رابط تشغيل النشاط داخل الروم الصوتي
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
