/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

/*
  ==============================================================
  المصادر الخاصة المباشرة (تشغيل فوري بجودة عالية 1080p + ترجمة عربية 100%)
  ==============================================================
  أي فيلم أو مسلسل تحط رابطه هنا سيشتغل بالمشغل الداخلي الرسمي بدون إعلانات وبدون أخطاء.
  الصيغة:
    - للأفلام: "movie:رقم_TMDB"
    - للحلقات: "tv:رقم_TMDB:الموسم:الحلقة"
*/
window.ORBIT_PLAYBACK = {
  sources: {
    // مثال لوبين الثالث (Lupin III) الموسم 1 الحلقة 1
    "tv:1426:1:1": [
      {
        label: "سيرفر خاص (FHD 1080p)",
        type: "video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        subtitles: [
          { label: "العربية", srclang: "ar", src: "https://raw.githubusercontent.com/animethemes/animethemes-subtitles/master/sample.vtt", default: true }
        ]
      }
    ]
  }
};

/*
  سيرفرات التضمين العامة التلقائية (لباقي الأفلام والمسلسلات)
*/
window.ORBIT_PROVIDERS = [
  {
    id: "videasy-stream",
    label: "سيرفر 1 (Videasy - متعدد)",
    enabled: true,
    type: "embed",
    movieUrl: "https://player.videasy.net/movie/{id}",
    tvUrl: "https://player.videasy.net/tv/{id}/{season}/{episode}",
    priority: 10,
    tags: ["FHD", "مترجم"],
    subtitlesMode: "internal"
  },
  {
    id: "smashy-stream",
    label: "سيرفر 2 (Smashy - أنمي ومسلسلات)",
    enabled: true,
    type: "embed",
    movieUrl: "https://embed.smashystream.com/playere.php?tmdb={id}",
    tvUrl: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}",
    priority: 20,
    tags: ["سيرفر بديل"],
    subtitlesMode: "internal"
  },
  {
    id: "vidsrc-cc",
    label: "سيرفر 3 (VidSrc Pro)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.cc/v2/embed/movie/{id}",
    tvUrl: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}",
    priority: 30,
    tags: ["1080p"],
    subtitlesMode: "internal"
  },
  {
    id: "multiembed",
    label: "سيرفر 4 (MultiEmbed)",
    enabled: true,
    type: "embed",
    movieUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tvUrl: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
    priority: 40,
    tags: ["سيرفر احتياطي"],
    subtitlesMode: "internal"
  }
];

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "ar", "eng"]
};

window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
