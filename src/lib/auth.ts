const ACCESS_TOKEN_KEY = "ec_access_token";
const REFRESH_TOKEN_KEY = "ec_refresh_token";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function getTokens(): TokenPair {
  if (typeof window === "undefined") {
    return { accessToken: "", refreshToken: "" };
  }
  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "",
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "",
  };
}

export function setTokens(tokens: TokenPair): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const tokens = getTokens();
  return tokens.accessToken !== "" && tokens.refreshToken !== "";
}