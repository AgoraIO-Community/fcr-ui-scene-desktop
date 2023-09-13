import { createContext, Context } from 'react';
import { SceneUIStore } from '.';

export class FcrUISceneContext {
  private static _context: Context<SceneUIStore> | null;
  static get shared() {
    if (!FcrUISceneContext._context) {
      FcrUISceneContext._context = createContext(new SceneUIStore());
    }
    return FcrUISceneContext._context;
  }
  static reset() {
    FcrUISceneContext._context = null;
  }
}
