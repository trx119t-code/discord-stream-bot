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

// قراءة المفاتيح بأمان من ملف .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const player = createAudioPlayer();
let connection = null;

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
            .setDescription('**ماذا تريد أن تشاهد اليوم؟**\n\nCinema Bot • TV');

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

// معالجة التفاعلات
client.on('interactionCreate', async (interaction) => {
    // 1. زر فتح نافذة البحث
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_series') {
            const modal = new ModalBuilder()
                .setCustomId('modal_series_search')
                .setTitle('بحث عن مسلسل');

            const titleInput = new TextInputBuilder()
                .setCustomId('query_name')
                .setLabel('اسم المسلسل')
                .setPlaceholder('اكتب اسم المسلسل أو جزء منه (مثال: game)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(titleInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'btn_movie') {
            const modal = new ModalBuilder()
                .setCustomId('modal_movie_search')
                .setTitle('بحث عن فيلم');

            const movieInput = new TextInputBuilder()
                .setCustomId('query_name')
                .setLabel('اسم الفيلم')
                .setPlaceholder('اكتب اسم الفيلم أو جزء منه (مثال: inception)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(movieInput));
            await interaction.showModal(modal);
        }

        // أزرار التحكم
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
        }

        if (interaction.customId === 'btn_stop') {
            if (connection) {
                player.stop();
                connection.destroy();
                connection = null;
                await interaction.reply({ content: '🛑 تم إغلاق جلسة السينما ومغادرة الروم الصوتي.', ephemeral: true });
            } else {
                await interaction.reply({ content: '🛑 البوت ليس متصلاً بروم صوتي.', ephemeral: true });
            }
        }
    }

    // 2. إرسال الاسم والبحث في TMDB (عرض قائمة النتائج المطابقة)
    if (interaction.isModalSubmit()) {
        const isSeries = interaction.customId === 'modal_series_search';
        const type = isSeries ? 'tv' : 'movie';
        const query = interaction.fields.getTextInputValue('query_name');

        await interaction.deferReply();

        try {
            const response = await axios.get(`https://api.themoviedb.org/3/search/${type}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    query: query,
                    language: 'ar-SA'
                }
            });

            const results = response.data.results.slice(0, 10);

            if (!results.length) {
                return await interaction.editReply({ content: `❌ لم يتم العثور على أي نتائج لكلمة: **${query}**` });
            }

            const searchEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`🎬 :نتائج البحث عن ${query}`)
                .setDescription(`وجدت **${response.data.total_results}** ${isSeries ? 'مسلسل' : 'فيلم'}\n\nاختر من القائمة بالأسفل:`);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(isSeries ? 'menu_select_series' : 'menu_select_movie')
                .setPlaceholder('...اختر من القائمة');

            results.forEach((item, index) => {
                const title = item.name || item.title;
                const date = item.first_air_date || item.release_date || '';
                const year = date ? date.split('-')[0] : '----';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : '0';

                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${index + 1}. ${title}`.slice(0, 100))
                        .setDescription(`${isSeries ? 'مسلسل' : 'فيلم'} - 📅 ${year} - ⭐ ${rating}`)
                        .setValue(String(item.id))
                        .setEmoji('🎞️')
                );
            });

            const row = new ActionRowBuilder().addComponents(selectMenu);
            await interaction.editReply({ embeds: [searchEmbed], components: [row] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء جلب نتائج البحث من TMDB.' });
        }
    }

    // 3. التفاعل مع القوائم المنسدلة
    if (interaction.isStringSelectMenu()) {
        // (أ) اختيار مسلسل -> جلب وعرض قائمة المواسم
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
                    .setDescription(`**مواسم متاحة:** ${seasons.length}\n\n:اختر الموسم من القائمة`);

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
        }

        // (ب) اختيار موسم -> جلب وعرض قائمة الحلقات
        if (interaction.customId.startsWith('menu_season_')) {
            await interaction.deferUpdate();
            const seriesId = interaction.customId.replace('menu_season_', '');
            const seasonNumber = interaction.values[0];

            try {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}`, {
                    params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
                });

                const episodes = res.data.episodes;

                const episodeEmbed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle(`📼 الموسم ${seasonNumber}`)
                    .setDescription(`**عدد الحلقات:** ${episodes.length}\n\n:اختر الحلقة لبدء العرض`);

                const episodeMenu = new StringSelectMenuBuilder()
                    .setCustomId(`menu_episode_${seriesId}_${seasonNumber}`)
                    .setPlaceholder('اختر الحلقة');

                episodes.slice(0, 25).forEach((ep) => {
                    const epTitle = ep.name ? ` - ${ep.name}` : '';
                    episodeMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(`الحلقة ${ep.episode_number}`)
                            .setDescription(`${epTitle}`.slice(0, 95))
                            .setValue(String(ep.episode_number))
                    );
                });

                const row = new ActionRowBuilder().addComponents(episodeMenu);
                await interaction.editReply({ embeds: [episodeEmbed], components: [row] });

            } catch (error) {
                console.error(error);
                await interaction.followUp({ content: '❌ تعذر جلب حلقات هذا الموسم.', ephemeral: true });
            }
        }

        // (ج) اختيار حلقة أو فيلم -> تشغيل لوحة التحكم وعرض المشاهدة
        if (interaction.customId.startsWith('menu_episode_') || interaction.customId === 'menu_select_movie') {
            const memberVoice = interaction.member.voice.channel;

            if (!memberVoice) {
                return await interaction.followUp({ 
                    content: '⚠️ يرجى الانضمام إلى روم صوتي أولاً لمتابعة المشاهدة!', 
                    ephemeral: true 
                });
            }

            await interaction.deferUpdate();

            let title, posterUrl, year, rating, overview, streamUrl, details;

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
                year = series.first_air_date ? series.first_air_date.split('-')[0] : '2024';
                rating = series.vote_average ? series.vote_average.toFixed(1) : '8.0';
                overview = series.overview ? `\n\n> *${series.overview.slice(0, 160)}...*` : '';
                details = `🎞️ **الحلقة:** ${episodeNumber}  •  📼 **الموسم:** ${seasonNumber}`;
                streamUrl = `https://vidsrc.to/embed/tv/${seriesId}/${seasonNumber}/${episodeNumber}`;

            } else {
                // فيلم
                const movieId = interaction.values[0];
                const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    params: { api_key: TMDB_API_KEY, language: 'ar-SA' }
                });

                const movie = movieRes.data;
                title = movie.title;
                posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/500x750';
                year = movie.release_date ? movie.release_date.split('-')[0] : '2024';
                rating = movie.vote_average ? movie.vote_average.toFixed(1) : '8.0';
                overview = movie.overview ? `\n\n> *${movie.overview.slice(0, 160)}...*` : '';
                details = `🎞️ **فيلم كامل**`;
                streamUrl = `https://vidsrc.to/embed/movie/${movieId}`;
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
                .setDescription(`🟢 **جاهز للمشاهدة في:** <#${memberVoice.id}>\n\n${details}\n📅 **${year}** • ⭐ **${rating}**${overview}\n\n🍿 *اضغط على الزر بالأسفل لفتح شاشة العرض المباشرة.*`)
                .setThumbnail(posterUrl);

            const watchRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🍿 فتح شاشة العرض (Watch Now)')
                    .setStyle(ButtonStyle.Link)
                    .setURL(streamUrl)
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
                components: [watchRow, controlRow1, controlRow2]
            });
        }
    }
});

client.login(BOT_TOKEN);