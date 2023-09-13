import { FcrUISceneContext } from '@ui-scene/uistores/context';
import { useContext } from 'react';

export const useStore = () => useContext(FcrUISceneContext.shared);
