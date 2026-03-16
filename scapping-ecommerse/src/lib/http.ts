import axios from 'axios';
import config from '../config.js';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createHttpClient({ timeoutMs = config.requestTimeoutMs, userAgent = config.userAgent } = {}) {
  return axios.create({
    timeout: timeoutMs,
    maxRedirects: 5,
    headers: {
      'user-agent': userAgent,
      accept:
        'text/html,application/json,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9,bn;q=0.8'
    },
    validateStatus: () => true
  });
}

export async function getJson(httpClient, url, extraConfig = {}) {
  const response = await httpClient.get(url, extraConfig);
  return response;
}

export async function getHtml(httpClient, url, extraConfig = {}) {
  const response = await httpClient.get(url, extraConfig);
  return response;
}
