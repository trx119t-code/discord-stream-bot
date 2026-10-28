/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

window.ORBIT_PLAYBACK = {
  sources: {}
};

/*
  سيرفرات بث محدّثة ومتعددة المصادر (FHD 1080p + ترجمة عربية لجميع الأفلام والمسلسلات والأنمي)
*/
window.ORBIT_PROVIDERS = [
  {
    id: "vidsrc-xyz",
    label: "سيرفر 1 (VidSrc Pro - مترجم)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.xyz/embed/movie/{id}",
    tvUrl: "https://vidsrc.xyz/embed/tv/{id}/{season}-{episode}",
    priority: 10,
    tags: ["FHD", "مترجم عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "vidsrc-cc",
    label: "سيرفر 2 (بديل سريع - مسلسلات وأنمي)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.cc/v2/embed/movie/{id}",
    tvUrl: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}",
    priority: 20,
    tags: ["1080p", "عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "superembed",
    label: "سيرفر 3 (SuperEmbed - تغطية شاملة)",
    enabled: true,
    type: "embed",
    movieUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tvUrl: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
    priority: 30,
    tags: ["متعدد السيرفرات", "FHD"],
    subtitlesMode: "internal"
  },
  {
    id: "autoembed-multi",
    label: "سيرفر 4 (AutoEmbed)",
    enabled: true,
    type: "embed",
    movieUrl: "https://player.autoembed.cc/embed/movie/{id}",
    tvUrl: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}",
    priority: 40,
    tags: ["سيرفر إضافي"],
    subtitlesMode: "internal"
  }
];

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "ar", "eng"]
};

window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
