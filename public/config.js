/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

window.ORBIT_PLAYBACK = {
  sources: {}
};

window.ORBIT_PROVIDERS = [
  {
    id: "videasy-stream",
    label: "سيرفر 1 (Videasy - يدعم الأنمي والترجمة)",
    enabled: true,
    type: "embed",
    movieUrl: "https://player.videasy.net/movie/{id}",
    tvUrl: "https://player.videasy.net/tv/{id}/{season}/{episode}",
    priority: 10,
    tags: ["FHD", "عربي"],
    subtitlesMode: "internal"
  },
  {
    id: "smashy-stream",
    label: "سيرفر 2 (SmashyStream - مخصص للأنمي الكلاسيكي)",
    enabled: true,
    type: "embed",
    movieUrl: "https://embed.smashystream.com/playere.php?tmdb={id}",
    tvUrl: "https://embed.smashystream.com/playere.php?tmdb={id}&season={season}&episode={episode}",
    priority: 20,
    tags: ["سيرفر أنمي"],
    subtitlesMode: "internal"
  },
  {
    id: "2embed-stream",
    label: "سيرفر 3 (2Embed - مسلسلات وأنمي)",
    enabled: true,
    type: "embed",
    movieUrl: "https://www.2embed.cc/embed/{id}",
    tvUrl: "https://www.2embed.cc/embedtv/{id}&s={season}&e={episode}",
    priority: 30,
    tags: ["تغطية شاملة"],
    subtitlesMode: "internal"
  },
  {
    id: "vidsrc-net",
    label: "سيرفر 4 (VidSrc Net - بديل)",
    enabled: true,
    type: "embed",
    movieUrl: "https://vidsrc.net/embed/movie/{id}",
    tvUrl: "https://vidsrc.net/embed/tv/{id}/{season}/{episode}",
    priority: 40,
    tags: ["احتياطي"],
    subtitlesMode: "internal"
  }
];

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "ar", "eng"]
};

window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
