import { IncomingMessage } from 'http';
import { Agent, request, RequestOptions } from 'https';

type Headers = { [key: string]: string; };

type ReqeustParams = {
  headers?: Headers;
  agent?: Agent;
  body?: object;
  timeout?: number;
};

export type HttpResponse = {
  url: string;
  statusCode: number;
  body: string;
  toJSON: () => object;
}

function createResponse(url: string, res: IncomingMessage, data: any): HttpResponse {
  return {
    url: url,
    statusCode: res.statusCode!,
    body: Buffer.concat(data).toString(),
    toJSON: () => JSON.parse(Buffer.concat(data).toString()),
  }
}

async function makeRequest(url: string, method: 'GET' | 'POST', rq: ReqeustParams): Promise<HttpResponse> {
  const parsedUrl = new URL(url);
  const sendData = rq.body ? JSON.stringify(rq.body) : undefined;

  const options: RequestOptions = {
    method,
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname,
    headers: rq.headers || {},
    agent: rq.agent,
    timeout: rq.timeout
  };

  if (method === 'POST' && rq.body && typeof rq.body === 'object') {
    options.headers = {
      ...options.headers,
      'content-length': Buffer.byteLength(JSON.stringify(rq.body))
    }
  }

  return new Promise((resolve, reject) => {
    const req = request(options, res => {
      if (!res.statusCode) {
        return reject(new Error(`HTTP error: ${res.url}`));
      }

      const data: any = [];

      res.on('data', chunk => {
        data.push(chunk);
      });

      res.on('end', () => {
        const response = createResponse(url, res, data);
        resolve(response)
      });
    });

    if (sendData) {
      req.write(sendData);
    }

    req.on('error', reject);
    req.end();
  });
}

export function makeGetRequest(url: string, params?: { headers?: Headers; agent?: Agent }): Promise<HttpResponse> {
  return makeRequest(url, 'GET', params || {});
}

export function makePostRequest(url: string, body?: object, params?: { headers?: Headers; agent?: Agent }): Promise<HttpResponse> {
  return makeRequest(url, 'POST', Object.assign(params || {}, { body: body }));
}