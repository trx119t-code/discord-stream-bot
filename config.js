/* ORBIT IMPERIAL V4.3 — Unified playback configuration */

window.ORBIT_API_BASE_URL =
  "https://discord-stream-bot-9ibe.onrender.com";

window.ORBIT_PLAYBACK = {
  sources: {}
};

/*
  مثال مصدر تملكه أو مرخص لك:

  "movie:123": [{
    label: "Premium HLS",
    type: "hls",
    url: "https://your-provider.example/master.m3u8",
    subtitles: [
      {
        label: "العربية",
        srclang: "ar",
        src: "https://cdn.example.com/ar.vtt",
        default: true
      }
    ]
  }]

  حلقة:
  "tv:456:1:1": [{
    label: "Premium HLS",
    type: "hls",
    url: "https://your-provider.example/s01e01/master.m3u8",
    intro: [0, 90],
    recap: [90, 160]
  }]
*/

window.ORBIT_PROVIDERS =
  window.ORBIT_PROVIDERS || [];

/*
  Provider مصرح:

  window.ORBIT_PROVIDERS.push({
    id: "official-partner",
    label: "Official Partner",
    enabled: true,
    type: "embed",
    movieUrl: "https://partner.example/movie/{id}",
    tvUrl: "https://partner.example/tv/{id}/{season}/{episode}",
    priority: 20,
    tags: ["Official", "Arabic"],
    subtitlesMode: "internal"
  });
*/

window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "eng"]
};

/*
  Stremio-compatible legal add-on:

  {
    id: "my-legal-addon",
    label: "My Legal Add-on",
    enabled: true,
    manifestUrl: "https://addon.example/manifest.json",
    priority: 40,
    useProxy: false,
    tags: ["Stremio", "Legal"]
  }

  لو useProxy:true:
  أضف دومين الـaddon في Render:
  STREMIO_ADDON_HOSTS=addon.example
*/

window.ORBIT_STREMIO_ADDONS =
  window.ORBIT_STREMIO_ADDONS || [];
