// Reviewed public collection; development-only scenes stay private.
export const WORLD_ORDER = ["white-sands","peonies","glass-valley","quiet-ascent","stillwater","journey"];

export const WORLDS = Object.freeze({
  "white-sands": {
    "id": "white-sands",
    "thumbnail": "assets/previews/white-sands.webp",
    "label": "White Sands",
    "adapter": "worlds/white-sands/adapter.html",
    "fallbackImage": "worlds/white-sands/art/pixel-master.png",
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "music": false,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
    }
  },
  "peonies": {
    "id": "peonies",
    "thumbnail": "assets/previews/peonies.webp",
    "label": "Peony Pattern",
    "adapter": "worlds/peonies/adapter.html",
    "fallbackImage": "worlds/peonies/art/master.png",
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "music": false,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
    },
    "artwork": {
      "title": "Peony Pattern · 모란 무늬",
      "institution": "Inspired by Peonies and Rocks · CMA 2022.60",
      "preview": "worlds/peonies/art/master.png",
      "url": "https://www.clevelandart.org/art/2022.60"
    }
  },
  "glass-valley": {
    "id": "glass-valley",
    "thumbnail": "assets/previews/glass-valley.webp",
    "label": "Glass Valley",
    "adapter": "worlds/glass-valley/adapter.html",
    "interactive": true,
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "music": false,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
    }
  },
  "quiet-ascent": {
    "id": "quiet-ascent",
    "thumbnail": "assets/previews/quiet-ascent.webp",
    "label": "Quiet Ascent",
    "adapter": "worlds/quiet-ascent/adapter.html",
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "music": false,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
    }
  },
  "stillwater": {
    "id": "stillwater",
    "thumbnail": "assets/previews/stillwater.webp",
    "label": "Stillwater",
    "adapter": "worlds/stillwater/adapter.html",
    "autoDurationMs": 180000,
    "sceneDurationMs": 0,
    "defaultCapabilities": {
      "play": true,
      "sound": true,
      "scenes": true
    }
  },
  "journey": {
    "id": "journey",
    "thumbnail": "assets/previews/journey.webp",
    "label": "Journey",
    "adapter": "worlds/journey/adapter.html",
    "autoDurationMs": 210000,
    "defaultCapabilities": {
      "play": true,
      "sound": true,
      "scenes": true
    }
  }
});
