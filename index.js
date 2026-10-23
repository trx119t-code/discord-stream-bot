require('dotenv').config();

const path = require('path');
const express = require('express');
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

// إعداد خادم الويب
const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 خادم الويب للنشاط يعمل على المنفذ: ${PORT}`);
});

// تسجيل أمر تشغيل النشاط (Entry Point Command) لدى ديسكورد
async function registerActivityCommand() {
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
                        type: 4 // نوع Entry Point لتشغيل الـ Activity
                    }
                ]
            }
        );
        console.log('✅ تم تسجيل Entry Point Command بنجاح!');
    } catch (error) {
        console.error('خطأ أثناء تسجيل الأمر:', error);
    }
}

client.on('ready', async () => {
    console.log(`✅ البوت متصل وجاهز: ${client.user.tag}`);
    await registerActivityCommand();
});

// التفاعل عند الضغط على أيقونة النشاط أو أمره
client.on('interactionCreate', async (interaction) => {
    // تشغيل النشاط عند الضغط عليه
    if (interaction.isCommand() && interaction.commandName === 'cinema') {
        // ديسكورد سيتولى فتح الـ Activity تلقائياً
    }
});

// استقبال أمر التشغيل dplay بالشات
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
            .setDescription(`جاهز للعرض داخل: <#${voiceChannel.id}>\n\nاضغط على الزر بالأسفل لتشغيل النشاط مباشرة داخل الروم الصوتي!`)
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
