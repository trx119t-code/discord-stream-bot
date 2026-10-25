/* ORBIT IMPERIAL V4.1 — Frontend configuration */

window.ORBIT_API_BASE_URL =
  "https://discord-stream-bot-9ibe.onrender.com";


/*
  ===========================================
  VIDEO SOURCES YOU OWN / ARE LICENSED TO USE
  ===========================================

  Movie:
  movie:<TMDB_ID>

  Episode:
  tv:<TMDB_ID>:<SEASON>:<EPISODE>
*/

window.ORBIT_PLAYBACK = {

  sources: {

    /*
    Example HLS:

    "movie:123": [
      {
        label: "ORBIT Premium",

        type: "hls",

        url:
          "https://example.com/master.m3u8",

        subtitles: [
          {
            label:
              "العربية",

            srclang:
              "ar",

            src:
              "https://example.com/ar.vtt",

            default:
              true
          },

          {
            label:
              "English",

            srclang:
              "en",

            src:
              "https://example.com/en.vtt"
          }
        ]
      }
    ]
    */


    /*
    Example TV episode:

    "tv:1396:1:1": [
      {
        label:
          "ORBIT Premium",

        type:
          "hls",

        url:
          "https://example.com/s01e01/master.m3u8",

        subtitles: [
          {
            label:
              "العربية",

            srclang:
              "ar",

            src:
              "https://example.com/s01e01-ar.vtt",

            default:
              true
          }
        ],

        intro:
          [0, 90],

        recap:
          [90, 150]
      }
    ]
    */


    /*
    Example Mux:

    "movie:789": [
      {
        label:
          "Mux Premium",

        type:
          "mux",

        playbackId:
          "YOUR_MUX_PLAYBACK_ID"
      }
    ]
    */


    /*
    Example MP4:

    "movie:456": [
      {
        label:
          "MP4",

        type:
          "video",

        url:
          "https://example.com/movie.mp4"
      }
    ]
    */

  }

};


/*
  ===========================================
  OPTIONAL AUTHORIZED EMBED / API PROVIDERS
  ===========================================

  أضف هنا فقط مزود يسمح لك رسميًا
  باستخدام الـ Embed أو Playback API.

  Supported placeholders:

  {id}
  {season}
  {episode}

  type:
  embed
  hls
  video
*/

window.ORBIT_PROVIDERS = [


  /*
  Example:

  {
    id:
      "official-partner",

    label:
      "Official Partner",

    enabled:
      true,

    type:
      "embed",

    movieUrl:
      "https://partner.example/movie/{id}",

    tvUrl:
      "https://partner.example/tv/{id}/{season}/{episode}",

    priority:
      20,

    tags: [
      "Official",
      "Arabic"
    ],

    subtitlesMode:
      "internal"
  }
  */


];


/*
  Provider priority:

  الرقم الأقل = أولوية أعلى.

  مثال:

  priority: 10
  priority: 20
  priority: 30
*/


/*
  ORBIT V4.1 يتذكر آخر Provider
  استخدمه كل Profile تلقائيًا.
*/


/*
  لا تكتب 4K في اسم المصدر
  إلا إذا المصدر فعلًا يوفر 4K.
*/
