import { Platform } from 'react-native';
import plugin from './plugin';
import rawCreate from './create';
// Apply default config and inject RN Platform
const create = (twConfig = {}) => rawCreate(twConfig, Platform.OS);
export { useDeviceContext, useAppColorScheme } from './hooks';
const tailwind = create();
const style = tailwind.style;
export default tailwind;
export { create, plugin, style };
