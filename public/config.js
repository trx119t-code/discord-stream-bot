/* ORBIT IMPERIAL V4 — Frontend configuration */

window.ORBIT_API_BASE_URL =
  "https://discord-stream-bot-9ibe.onrender.com";

/*
  Licensed / owned playback sources only.

  Keys:

    movie:<TMDB_ID>

    tv:<TMDB_ID>:<SEASON>:<EPISODE>


  Recommended for premium quality:
  adaptive HLS (.m3u8).

  مثال فيلم:

  "movie:123": [
    {
      label: "ORBIT Premium",
      type: "hls",
      url: "https://example.com/master.m3u8",

      subtitles: [
        {
          label: "العربية",
          srclang: "ar",
          src: "https://example.com/ar.vtt",
          default: true
        },

        {
          label: "English",
          srclang: "en",
          src: "https://example.com/en.vtt"
        }
      ]
    }
  ]


  مثال حلقة:

  "tv:456:1:1": [
    {
      label: "ORBIT Premium",
      type: "hls",
      url: "https://example.com/s01e01/master.m3u8",

      subtitles: [
        {
          label: "العربية",
          srclang: "ar",
          src: "https://example.com/s01e01-ar.vtt",
          default: true
        }
      ],

      intro: [0, 85],
      recap: [85, 160]
    }
  ]


  Mux example:

  "tv:456:1:2": [
    {
      label: "Mux Premium",
      type: "mux",
      playbackId: "YOUR_MUX_PLAYBACK_ID",

      subtitles: [
        {
          label: "العربية",
          srclang: "ar",
          src: "https://example.com/s01e02-ar.vtt",
          default: true
        }
      ]
    }
  ]


  Direct MP4/WebM example:

  "movie:789": [
    {
      label: "MP4",
      type: "video",
      url: "https://example.com/movie.mp4"
    }
  ]


  intro / recap:
  [startSeconds, endSeconds]

  مثال:

  intro: [0, 90]

  recap: [90, 180]
*/

window.ORBIT_PLAYBACK = {
  sources: {}
};
