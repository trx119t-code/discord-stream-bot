require('dotenv').config();

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const axios = require('axios');
const http = require('http');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    AudioPlayerStatus 
} = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// قراءة المفاتيح بأمان
const BOT_TOKEN = process.env.BOT_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const player = createAudioPlayer();
let connection = null;

// ذاكرة مؤقتة لصفحات البحث
const searchSessions = new Map();

client.on('ready', () => {
    console.log(`✅ البوت متصل وجاهز: ${client.user.tag}`);
});

// استقبال أمر التشغيل dplay
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === 'dplay') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🏠 اختر نوع المحتوى')
            .setDescription('**ماذا تريد أن تشاهد اليوم؟**\n\nCinema Bot • Multi-Servers & Multi-Pages');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_series')
                .setLabel('مسلسل')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId('btn_movie')
                .setLabel('فيلم')
                .setEmoji('🎥')
                .setStyle(ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
});

// دالة مساعدة لبناء واجهة نتائج البحث
async function buildSearchResults(type, query, page, userId) {
    const isSeries = type === 'tv';
    const response = await axios.get(`https://api.themoviedb.org/3/search/${type}`, {
        params: {
            api_key: TMDB_API_KEY,
            query: query,
            page: page,
            language: 'ar-SA'
        }
    });

    const results = response.data.results || [];
    const totalPages = Math.min(response.data.total_pages || 1, 10);
    const totalResults = response.data.total_results || 0;

    if (!results.length) return null;

    // حفظ الجلسة للتنقل بين الصفحات
    searchSessions.set(userId, { type, query, page, totalPages });

    const searchEmbed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`🎬 نتائج البحث عن: ${query}`)
        .setDescription(`وجدت **${totalResults}** نتيجة (صفحة **${page}** من **${totalPages}**)\n\nاختر من القائمة بالأسفل:`);

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(isSeries ? 'menu_select_series' : 'menu_select_movie')
        .setPlaceholder('...اختر من القائمة');

    const startIndex = (page - 1) * 20;
    results.forEach((item, index) => {
        const title = item.name || item.title || 'بدون عنوان';
        const date = item.first_air_date || item.release_date || '';
        const year = date ? date.split('-')[0] : '----';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '0';

        selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${startIndex + index + 1}. ${title}`.slice(0, 100))
                .setDescription(`${isSeries ? 'مسلسل' : 'فيلم'} - 📅 ${year} - ⭐ ${rating}`)
                .setValue(String(item.id))
                .setEmoji('🎞️')
        );
    });

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`btn_srpage_${page - 1}`)
            .setLabel('السابق ⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId('btn_srpage_info')
            .setLabel(`${page} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(`btn_srpage_${page + 1}`)
            .setLabel('التالي ➡️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages)
    );

    return { embeds: [searchEmbed], components: [menuRow, navRow] };
}

// دالة مساعدة لبناء واجهة قائمة الحلقات مع الصفحات
async function buildEpisodePage(seriesId, seasonNumber, page) {
    const res = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}`, {
        params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
    });

    const episodes = res.data.episodes || [];
    const pageSize = 25;
    const totalPages = Math.ceil(episodes.length / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const currentEpisodes = episodes.slice(startIndex, startIndex + pageSize);

    const episodeEmbed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`📼 الموسم ${seasonNumber}`)
        .setDescription(`**عدد الحلقات الإجمالي:** ${episodes.length} (صفحة **${page}** من **${totalPages}**)\n\nاختر الحلقة لبدء العرض:`);

    const episodeMenu = new StringSelectMenuBuilder()
        .setCustomId(`menu_episode_${seriesId}_${seasonNumber}`)
        .setPlaceholder(`اختر الحلقة (من ${startIndex + 1} إلى ${startIndex + currentEpisodes.length})`);

    currentEpisodes.forEach((ep) => {
        const epTitle = ep.name ? ` - ${ep.name}` : '';
        episodeMenu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`الحلقة ${ep.episode_number}`)
                .setDescription(`${epTitle}`.slice(0, 95))
                .setValue(String(ep.episode_number))
        );
    });

    const rows = [new ActionRowBuilder().addComponents(episodeMenu)];

    if (totalPages > 1) {
        const navRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`btn_eppage_${seriesId}_${seasonNumber}_${page - 1}`)
                .setLabel('السابق ⬅️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page <= 1),
            new ButtonBuilder()
                .setCustomId('btn_eppage_info')
                .setLabel(`حلقات ${page}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`btn_eppage_${seriesId}_${seasonNumber}_${page + 1}`)
                .setLabel('التالي ➡️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages)
        );
        rows.push(navRow);
    }

    return { embeds: [episodeEmbed], components: rows };
}

// معالجة التفاعلات
client.on('interactionCreate', async (interaction) => {
    // 1. فتح نافذة البحث وأزرار التحكم
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_series') {
            const modal = new ModalBuilder()
                .setCustomId('modal_series_search')
                .setTitle('بحث عن مسلسل');

            const titleInput = new TextInputBuilder()
                .setCustomId('query_name')
                .setLabel('اسم المسلسل')
                .setPlaceholder('اكتب اسم المسلسل (مثال: Breaking Bad)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(titleInput));
            await interaction.showModal(modal);
            return;
        }

        if (interaction.customId === 'btn_movie') {
            const modal = new ModalBuilder()
                .setCustomId('modal_movie_search')
                .setTitle('بحث عن فيلم');

            const movieInput = new TextInputBuilder()
                .setCustomId('query_name')
                .setLabel('اسم الفيلم')
                .setPlaceholder('اكتب اسم الفيلم (مثال: Inception)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(movieInput));
            await interaction.showModal(modal);
            return;
        }

        // أزرار التنقل بين صفحات البحث
        if (interaction.customId.startsWith('btn_srpage_') && interaction.customId !== 'btn_srpage_info') {
            const targetPage = parseInt(interaction.customId.replace('btn_srpage_', ''), 10);
            const session = searchSessions.get(interaction.user.id);
            if (!session) {
                return await interaction.reply({ content: '⚠️ انتهت صلاحية جلسة البحث، ابدأ بالبحث من جديد.', ephemeral: true });
            }

            await interaction.deferUpdate();
            const data = await buildSearchResults(session.type, session.query, targetPage, interaction.user.id);
            if (data) await interaction.editReply(data);
            return;
        }

        // أزرار التنقل بين صفحات الحلقات
        if (interaction.customId.startsWith('btn_eppage_') && interaction.customId !== 'btn_eppage_info') {
            const [, , seriesId, seasonNumber, pageStr] = interaction.customId.split('_');
            const targetPage = parseInt(pageStr, 10);

            await interaction.deferUpdate();
            const data = await buildEpisodePage(seriesId, seasonNumber, targetPage);
            await interaction.editReply(data);
            return;
        }

        // أزرار الصوت
        if (interaction.customId === 'btn_play_pause') {
            if (player.state.status === AudioPlayerStatus.Playing) {
                player.pause();
                await interaction.reply({ content: '⏸️ تم إيقاف التشغيل مؤقتاً.', ephemeral: true });
            } else if (player.state.status === AudioPlayerStatus.Paused) {
                player.unpause();
                await interaction.reply({ content: '▶️ تم استئناف التشغيل.', ephemeral: true });
            } else {
                await interaction.reply({ content: '⚠️ لا يوجد تشغيل صوتي حالياً.', ephemeral: true });
            }
            return;
        }

        if (interaction.customId === 'btn_stop') {
            if (connection) {
                player.stop();
                connection.destroy();
                connection = null;
                await interaction.reply({ content: '🛑 تم إغلاق جلسة السينما ومغادرة الروم.', ephemeral: true });
            } else {
                await interaction.reply({ content: '🛑 البوت ليس متصلاً بروم صوتي.', ephemeral: true });
            }
            return;
        }
    }

    // 2. معالجة إرسال نص البحث (Modal Submit)
    if (interaction.isModalSubmit()) {
        const isSeries = interaction.customId === 'modal_series_search';
        const type = isSeries ? 'tv' : 'movie';
        const query = interaction.fields.getTextInputValue('query_name');

        await interaction.deferReply();

        try {
            const data = await buildSearchResults(type, query, 1, interaction.user.id);
            if (!data) {
                return await interaction.editReply({ content: `❌ لم يتم العثور على أي نتائج لكلمة: **${query}**` });
            }
            await interaction.editReply(data);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء جلب نتائج البحث من TMDB.' });
        }
        return;
    }

    // 3. التفاعل مع القوائم المنسدلة
    if (interaction.isStringSelectMenu()) {
        // (أ) اختيار مسلسل -> قائمة المواسم
        if (interaction.customId === 'menu_select_series') {
            await interaction.deferUpdate();
            const seriesId = interaction.values[0];

            try {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}`, {
                    params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
                });

                const series = res.data;
                const seasons = series.seasons.filter(s => s.season_number > 0);

                const seasonEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle(`🔍 ${series.name}`)
                    .setDescription(`**مواسم متاحة:** ${seasons.length}\n\nاختر الموسم من القائمة:`);

                const seasonMenu = new StringSelectMenuBuilder()
                    .setCustomId(`menu_season_${seriesId}`)
                    .setPlaceholder('اختر الموسم');

                seasons.slice(0, 25).forEach((season) => {
                    seasonMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`الموسم ${season.season_number}`)
                            .setDescription(`حلقة ${season.episode_count}`)
                            .setValue(String(season.season_number))
                    );
                });

                const row = new ActionRowBuilder().addComponents(seasonMenu);
                await interaction.editReply({ embeds: [seasonEmbed], components: [row] });
            } catch (error) {
                console.error(error);
                await interaction.followUp({ content: '❌ تعذر جلب مواسم المسلسل.', ephemeral: true });
            }
            return;
        }

        // (ب) اختيار موسم -> قائمة الحلقات (مع نظام الصفحات)
        if (interaction.customId.startsWith('menu_season_')) {
            await interaction.deferUpdate();
            const seriesId = interaction.customId.replace('menu_season_', '');
            const seasonNumber = interaction.values[0];

            try {
                const data = await buildEpisodePage(seriesId, seasonNumber, 1);
                await interaction.editReply(data);
            } catch (error) {
                console.error(error);
                await interaction.followUp({ content: '❌ تعذر جلب حلقات هذا الموسم.', ephemeral: true });
            }
            return;
        }

        // (ج) اختيار حلقة أو فيلم -> تجهيز روابط البث
        if (interaction.customId.startsWith('menu_episode_') || interaction.customId === 'menu_select_movie') {
            const memberVoice = interaction.member.voice.channel;

            if (!memberVoice) {
                return await interaction.followUp({ 
                    content: '⚠️ يرجى الانضمام إلى روم صوتي أولاً لمتابعة المشاهدة!', 
                    ephemeral: true 
                });
            }

            await interaction.deferUpdate();

            let title, posterUrl, year, rating, overview, details;
            let server1Url, server2Url, server3Url;

            if (interaction.customId.startsWith('menu_episode_')) {
                // مسلسل
                const [, , seriesId, seasonNumber] = interaction.customId.split('_');
                const episodeNumber = interaction.values[0];

                const seriesRes = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}`, {
                    params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
                });

                const series = seriesRes.data;
                title = series.name;
                posterUrl = series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : 'https://via.placeholder.com/500x750';
                year = series.first_air_date ? series.first_air_date.split('-')[0] : '----';
                rating = series.vote_average ? series.vote_average.toFixed(1) : '8.0';
                overview = series.overview ? `\n\n> *${series.overview.slice(0, 160)}...*` : '';
                details = `🎞️ **الحلقة:** ${episodeNumber}  •  📼 **الموسم:** ${seasonNumber}`;

                server1Url = `https://vidsrc.to/embed/tv/${seriesId}/${seasonNumber}/${episodeNumber}`;
                server2Url = `https://vidlink.pro/tv/${seriesId}/${seasonNumber}/${episodeNumber}`;
                server3Url = `https://multiembed.mov/?video_id=${seriesId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`;
            } else {
                // فيلم
                const movieId = interaction.values[0];
                const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
                });

                const movie = movieRes.data;
                title = movie.title;
                posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750';
                year = movie.release_date ? movie.release_date.split('-')[0] : '----';
                rating = movie.vote_average ? movie.vote_average.toFixed(1) : '8.0';
                overview = movie.overview ? `\n\n> *${movie.overview.slice(0, 160)}...*` : '';
                details = `🎞️ **فيلم كامل**`;

                server1Url = `https://vidsrc.to/embed/movie/${movieId}`;
                server2Url = `https://vidlink.pro/movie/${movieId}`;
                server3Url = `https://multiembed.mov/?video_id=${movieId}&tmdb=1`;
            }

            // انضمام للروم الصوتي
            connection = joinVoiceChannel({
                channelId: memberVoice.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            connection.subscribe(player);

            const playerEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`🎬 ${title}`)
                .setDescription(`🟢 **جاهز للمشاهدة في:** <#${memberVoice.id}>\n\n${details}\n📅 **${year}** • ⭐ **${rating}**${overview}\n\n🍿 **اختر السيرفر المناسب للمشاهدة:**\n*(سيرفر 2 ممتاز بدقة 1080p وترجمة عربية)*`)
                .setThumbnail(posterUrl);

            const serversRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('⚡ سيرفر 1 (VidSrc)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(server1Url),
                new ButtonBuilder()
                    .setLabel('🌟 سيرفر 2 (1080p + ترجمة عربية)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(server2Url),
                new ButtonBuilder()
                    .setLabel('🛡️ سيرفر 3 (MultiEmbed)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(server3Url)
            );

            const controlRow1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_rewind').setEmoji('⏪').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_play_pause').setEmoji('⏸️').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('btn_forward').setEmoji('⏩').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_time').setEmoji('🕒').setStyle(ButtonStyle.Secondary)
            );

            const controlRow2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_voldown').setEmoji('🔉').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_vol100').setLabel('100%').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('btn_volup').setEmoji('🔊').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('btn_stop').setEmoji('❌').setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({
                embeds: [playerEmbed],
                components: [serversRow, controlRow1, controlRow2]
            });
        }
    }
});

// منفذ الاستماع لـ Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Cinema Bot is Running 24/7!');
});
server.listen(process.env.PORT || 3000);

client.login(BOT_TOKEN);
