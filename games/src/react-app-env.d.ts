declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_LOCAL_BASE_URL: string;
    REACT_APP_WS_BASE_URL: string;
    // other environment variables...
  }
}