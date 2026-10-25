/* ORBIT CINEMA V4.4 — Unified playback configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

/*
  Licensed / owned playback sources only.

  Keys:
    movie:<TMDB_ID>
    tv:<TMDB_ID>:<SEASON>:<EPISODE>

  Recommended for premium quality: adaptive HLS (.m3u8).
  Copy the HLS playback URL from a video platform/CDN where YOU host or license the content.

  HLS example (adaptive 1080p/4K if your stream provides those renditions):
  "movie:123": [{
    label: "Premium HLS",
    type: "hls",
    url: "https://your-video-provider.example/master.m3u8",
    subtitles: [
      { label: "العربية", srclang: "ar", src: "https://cdn.example.com/ar.vtt", default: true },
      { label: "English", srclang: "en", src: "https://cdn.example.com/en.vtt" }
    ]
  }]

  Mux helper (for content you host/license on Mux):
  "tv:456:1:1": [{
    label: "Mux Premium",
    type: "mux",
    playbackId: "YOUR_MUX_PLAYBACK_ID",
    subtitles: [{ label: "العربية", srclang: "ar", src: "https://cdn.example.com/s01e01-ar.vtt", default: true }]
  }]

  Direct MP4/WebM still works:
  "movie:789": [{ label: "MP4", type: "video", url: "https://cdn.example.com/movie.mp4" }]

  NOTE: Netflix/Prime/Disney+ subscriptions cannot simply be embedded as raw video sources.
  Their official availability is shown from TMDB watch-provider data instead.
*/
window.ORBIT_PLAYBACK = {
  sources: {}
};


/* Optional source metadata for V4 player:
   intro: [startSeconds, endSeconds], recap: [startSeconds, endSeconds]
   These enable Skip Intro / Skip Recap only for sources you configure.
*/


/*
  Optional licensed/authorized provider registry.
  Keep this list empty unless a provider explicitly allows you to embed or use its playback API.

  Supported placeholders:
    {id}       TMDB id
    {season}   TV season number
    {episode}  TV episode number

  Example:
  window.ORBIT_PROVIDERS.push({
    id: "official-partner",
    label: "Official Partner",
    enabled: true,
    type: "embed", // embed | hls | video
    movieUrl: "https://partner.example/embed/movie/{id}",
    tvUrl: "https://partner.example/embed/tv/{id}/{season}/{episode}",
    priority: 20,
    tags: ["Official", "Arabic"],
    subtitlesMode: "internal"
  });
*/
window.ORBIT_PROVIDERS = window.ORBIT_PROVIDERS || [];


/* Automatic subtitle lookup for direct HLS / MP4 / Mux sources.
   ORBIT asks the backend for WebVTT-compatible tracks and prefers Arabic.
   Embed providers keep using their own internal subtitle systems. */
window.ORBIT_SUBTITLES = {
  enabled: true,
  languages: ["ara", "eng"]
};


/*
  ===========================================
  STREMIO-COMPATIBLE LEGAL ADD-ONS
  ===========================================

  ORBIT only consumes direct browser-playable HTTP(S) streams returned by
  configured add-ons. Torrent/infoHash streams are intentionally ignored.

  Direct mode works when the add-on allows browser CORS.
  Proxy mode uses the ORBIT backend and requires the add-on hostname to be
  added to Render environment variable STREMIO_ADDON_HOSTS.

  Example:
  {
    id: "my-legal-addon",
    label: "My Legal Add-on",
    enabled: true,
    manifestUrl: "https://addon.example/manifest.json",
    priority: 40,
    useProxy: false,
    tags: ["Stremio", "Legal"]
  }
*/
window.ORBIT_STREMIO_ADDONS = window.ORBIT_STREMIO_ADDONS || [];
