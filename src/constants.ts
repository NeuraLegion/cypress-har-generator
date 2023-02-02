const MB_UNIT = 1024 ** 2;

export const PORT_OPTION_NAME = '--remote-debugging-port';
export const ADDRESS_OPTION_NAME = '--remote-debugging-address';
export const SUPPORTED_BROWSERS: readonly string[] = ['chromium'];
export const MAX_RESOURCE_BUFFER_SIZE = 256 * MB_UNIT;
export const MAX_TOTAL_BUFFER_SIZE = 512 * MB_UNIT;
export const MAX_POST_DATA_SIZE = 100 * MB_UNIT;
export const MAX_NETWORK_IDLE_THRESHOLD = 100;
export const MAX_NETWORK_IDLE_DURATION = 5000;
