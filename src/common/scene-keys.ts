export const SCENE_KEYS = {
  PRELOAD_SCENE: 'PRELOAD_SCENE',
  GAME_SCENE: 'GAME_SCENE',
  TITLE_SCENE: 'TITLE_SCENE',
  GAME_OVER_SCENE: 'GAME_OVER_SCENE',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
