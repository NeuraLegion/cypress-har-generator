export const FAILED_ATTEMPT_TO_CONNECT = `Failed to connect to Chrome Debugging Protocol`;
export const ATTEMPT_TO_CONNECT = `Attempting to connect to Chrome Debugging Protocol`;
export const CONNECTED = `Connected to Chrome Debugging Protocol`;
export const DISCONNECTED = `Chrome Debugging Protocol disconnected`;
export const FAILED_TO_CONNECT = `${FAILED_ATTEMPT_TO_CONNECT}

Common situations why this would fail:
  - you forgot to run Chrome in headless mode
  - you use Chrome version 58 or earlier
  - you have weird RDP configuration settings
  
The stack trace for this error is:`;
