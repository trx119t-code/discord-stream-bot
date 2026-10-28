/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

window.ORBIT_PLAYBACK = {
  sources: {}
};

/*
  سيرفرات البث الشاملة التلقائية
  تدعم جودة عالية (1080p FHD) مع ترجمة عربية لجميع الأفلام والمسلسلات والأنمي
*/
window.ORBIT_PROVIDERS = [
  {
    id: "vidsrc-stream",
    label: "سيرفر 1 (FHD - ترجمة عربية)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.to/embed/movie/{id}",
    tvUrl: "https://vidsrc.to/embed/tv/{id}/{season}/{episode}",
    priority: 10,
    tags: ["1080p", "مترجم عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "autoembed-multi",
    label: "سيرفر 2 (سريع ومتعدد الجودات)",
    enabled: true,
    type: "embed",
    movieUrl: "https://player.autoembed.cc/embed/movie/{id}",
    tvUrl: "https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}",
    priority: 20,
    tags: ["FHD", "عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "smashystream",
    label: "سيرفر 3 (احتياطي أنمي ومسلسلات)",
    enabled: true,
    type: "embed",
    movieUrl: "https://embed.smashystream.com/playere.php?tmdb={id}",
    tvUrl: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}",
    priority: 30,
    tags: ["سيرفر بديل"],
    subtitlesMode: "internal"
  }
];

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "ar", "eng"]
};

window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
