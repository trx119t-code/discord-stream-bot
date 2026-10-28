/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

window.ORBIT_PLAYBACK = {
  sources: {}
};

/*
  سيرفرات بث شاملة ومجرّبة (FHD 1080p + ترجمة عربية لجميع الأفلام والمسلسلات والأنمي)
*/
window.ORBIT_PROVIDERS = [
  {
    id: "vidlink-pro",
    label: "سيرفر 1 (VidLink Pro - ممتاز للأنمي ومترجم)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidlink.pro/movie/{id}",
    tvUrl: "https://vidlink.pro/tv/{id}/{season}/{episode}",
    priority: 10,
    tags: ["1080p", "عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "superembed",
    label: "سيرفر 2 (SuperEmbed - متعدد السيرفرات)",
    enabled: true,
    type: "embed",
    movieUrl: "https://multiembed.mov/?video_id={id}&tmdb=1",
    tvUrl: "https://multiembed.mov/?video_id={id}&tmdb=1&s={season}&e={episode}",
    priority: 20,
    tags: ["سيرفرات متعددة", "FHD"],
    subtitlesMode: "internal"
  },
  {
    id: "vidsrc-cc",
    label: "سيرفر 3 (VidSrc CC - سريع)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.cc/v2/embed/movie/{id}",
    tvUrl: "https://vidsrc.cc/v2/embed/tv/{id}/{season}/{episode}",
    priority: 30,
    tags: ["FHD", "ترجمة عربية"],
    subtitlesMode: "internal"
  },
  {
    id: "vidsrc-in",
    label: "سيرفر 4 (VidSrc In - احتياطي)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.in/embed/movie/{id}",
    tvUrl: "https://vidsrc.in/embed/tv/{id}/{season}/{episode}",
    priority: 40,
    tags: ["سيرفر بديل"],
    subtitlesMode: "internal"
  },
  {
    id: "autoembed",
    label: "سيرفر 5 (AutoEmbed)",
    enabled: true,
    type: "embed",
    movieUrl: "https://player.autoembed.cc/embed/movie/{id}",
    tvUrl: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}",
    priority: 50,
    tags: ["احتياطي"],
    subtitlesMode: "internal"
  }
];

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "ar", "eng"]
};

window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
