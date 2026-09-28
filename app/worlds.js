// Reviewed public collection; newest publication first.
export const WORLD_ORDER = ["paper-wings","white-sands","glass-valley","quiet-ascent","stillwater","journey"];

export const WORLDS = Object.freeze({
  "paper-wings": {
    "id": "paper-wings",
    "thumbnail": "assets/previews/paper-wings.webp",
    "label": "Paper Wings",
    "adapter": "worlds/paper-wings/adapter.html",
    "fallbackImage": "assets/previews/paper-wings.webp",
    "interactive": true,
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
    }
  },
  "white-sands": {
    "id": "white-sands",
    "thumbnail": "assets/previews/white-sands.webp",
    "label": "White Sands",
    "adapter": "worlds/white-sands/adapter.html",
    "fallbackImage": "worlds/white-sands/art/pixel-master.png",
    "autoDurationMs": 0,
    "sceneDurationMs": 0,
    "defaultCapabilities": {
      "play": true,
      "sound": false,
      "scenes": true
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
