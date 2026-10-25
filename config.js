/* ORBIT IMPERIAL V3 — Frontend configuration */
window.ORBIT_API_BASE_URL = "https://discord-stream-bot-9ibe.onrender.com";

/*
  Optional playback sources that YOU own or are licensed to use.
  Keys:
    movie:<TMDB_ID>
    tv:<TMDB_ID>:<SEASON>:<EPISODE>

  Video example (WebVTT subtitles supported):
  "movie:123": [{
    label: "My CDN",
    type: "video",
    url: "https://cdn.example.com/movie.mp4",
    subtitles: [
      { label: "العربية", srclang: "ar", src: "https://cdn.example.com/ar.vtt", default: true }
    ]
  }]

  Embed example for a provider you are authorized to use:
  "tv:456:1:1": [{ label: "Provider", type: "embed", url: "https://player.example.com/embed/abc" }]
*/
window.ORBIT_PLAYBACK = {
  sources: {}
};
