export const ENV = {
  API_URL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081',
  AGENT_API_URL:
    (import.meta.env.VITE_AGENT_API_URL as string | undefined) ??
    'https://t-meta-agent-api.vsaidt.com',
  GEMINI_API_KEY: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '',
  GEMINI_MODEL:
    (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ?? 'gemini-2.5-flash',
  SP_AUTH_URL:
    (import.meta.env.VITE_SP_AUTH_URL as string | undefined) ?? 'http://localhost:8080',
  SP_CLIENT_ID: (import.meta.env.VITE_SP_CLIENT_ID as string | undefined) ?? 'test-service',
  IS_DEV: import.meta.env.DEV as boolean,
} as const;
