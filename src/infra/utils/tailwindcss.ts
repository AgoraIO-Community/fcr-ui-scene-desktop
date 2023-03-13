import resolveConfig from 'tailwindcss/resolveConfig';
import { TailwindConfig } from 'tailwindcss/tailwind-config';
import get from 'lodash/get';
import tailwindConfig from /* preval */ '../../../tailwind.config';


const fullConfig = resolveConfig(tailwindConfig as unknown as TailwindConfig);

export const themeVal = (key: string) => {
  get(fullConfig, key);
};
