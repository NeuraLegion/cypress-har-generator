import {
  Entry,
  Header,
  Param,
  PostData,
  QueryString,
  Timings
} from 'har-format';
import Protocol from 'devtools-protocol';
import { parse as parseUrl } from 'url';
import { parse as parseQs } from 'querystring';
import { ChromeEntry } from './ChromeEntry';

export class EntryFactory {
  public Create(entry: ChromeEntry): undefined | Entry {
    if (
      !entry.responseParams ||
      (!entry.isWebSocket && !entry.responseFinishedS && !entry.responseFailedS)
    ) {
      return;
    }

    const { request } = entry.requestParams;
    const { response } = entry.responseParams;

    if (entry.isWebSocket) {
      const requestStatus = entry.responseParams.response.requestHeadersText.split(
        ' '
      );
      (request as any).method = requestStatus[0];
      (request as any).url = requestStatus[1];
      (response as any).protocol = entry.responseParams.response.headersText.split(
        ' '
      )[0];
    }

    const { method, url } = request as any;

    const wallTimeMs: number = entry.requestParams.wallTime * 1000;
    const startedDateTime: string = new Date(wallTimeMs).toISOString();

    const httpVersion: string = (response as any).protocol || 'unknown';

    const { status, statusText } = response;

    const partialHarEntry: {
      request: { headers: Header[]; headersSize: number };
      response: { headers: Header[]; headersSize: number };
    } = this.parseHeaders(httpVersion, request, response);

    const redirectURL: string = this.getHeaderValue(
      partialHarEntry.response.headers,
      'location',
      ''
    );

    const queryString: QueryString[] = this.parseQueryString(url);

    const postData: PostData = this.parsePostData(
      (request as Protocol.Network.Request).postData,
      partialHarEntry.request.headers
    );

    const { time, timings } = this.computeTimings(entry);

    let serverIPAddress: string = (response as Protocol.Network.Response)
      .remoteIPAddress;
    if (serverIPAddress) {
      serverIPAddress = serverIPAddress.replace(/^\[(.*)\]$/, '$1');
    }
    const connection: string = String(
      (response as Protocol.Network.Response).connectionId
    );

    const { newPriority } = entry;
    const _priority: Protocol.Network.ResourcePriority =
      newPriority ?? (request as Protocol.Network.Request).initialPriority;

    const payload: {
      request: { bodySize: number };
      response: { transferSize: number; bodySize: number; compression: number };
    } = this.computePayload(entry, partialHarEntry);
    const { mimeType } = response as Protocol.Network.Response;
    const encoding = entry.responseBodyIsBase64 ? 'base64' : undefined;

    let _websocket: { response?: string; request?: string; url: string }[];
    if (entry.isWebSocket) {
      _websocket = entry.frames.map(
        ({ type, data }: { data: string; type: 'response' | 'request' }) => ({
          [type]: data,
          url
        })
      );
    }

    return {
      startedDateTime,
      time,
      request: {
        method,
        url,
        httpVersion,
        cookies: [],
        headers: partialHarEntry.request.headers,
        queryString,
        headersSize: partialHarEntry.request.headersSize,
        bodySize: payload.request.bodySize,
        postData
      },
      response: {
        status,
        statusText,
        httpVersion,
        cookies: [],
        headers: partialHarEntry.response.headers,
        redirectURL,
        headersSize: partialHarEntry.response.headersSize,
        bodySize: payload.response.bodySize,
        _transferSize: payload.response.transferSize,
        content: {
          size: entry.responseLength,
          mimeType: entry.isWebSocket ? 'x-unknown' : mimeType,
          compression: payload.response.compression,
          text: entry.responseBody,
          encoding
        }
      },
      cache: {},
      timings,
      serverIPAddress,
      connection,
      _priority,
      _websocket
    } as any;
  }

  private parseHeaders(
    httpVersion: string,
    request: Protocol.Network.Request | Protocol.Network.WebSocketRequest,
    response: Protocol.Network.Response | Protocol.Network.WebSocketResponse
  ): {
    request: { headers: Header[]; headersSize: number };
    response: { headers: Header[]; headersSize: number };
  } {
    const requestHeaders: Protocol.Network.Headers =
      response.requestHeaders || request.headers;
    const responseHeaders: Protocol.Network.Headers = response.headers;

    const headers = {
      request: {
        headers: this.zipNameValue(requestHeaders),
        headersSize: -1
      },
      response: {
        headers: this.zipNameValue(responseHeaders),
        headersSize: -1
      }
    };

    if (httpVersion.match(/^http\/[01].[01]$/)) {
      const requestText: string = this.getRawRequest(
        request,
        headers.request.headers
      );
      const responseText: string = this.getRawResponse(
        response,
        headers.response.headers
      );

      headers.request.headersSize = requestText.length;
      headers.response.headersSize = responseText.length;
    }

    return headers;
  }

  private computeTimings(
    entry: ChromeEntry
  ): { time: number; timings: Timings } {
    if (entry.isWebSocket) {
      const sessionTime: number =
        entry.frames.length === 0
          ? -1
          : this.toMilliseconds(
              entry.frames[entry.frames.length - 1].time -
                entry.requestParams.timestamp
            );

      return {
        time: sessionTime,
        timings: {
          blocked: -1,
          dns: -1,
          connect: -1,
          send: 0,
          wait: sessionTime,
          receive: -1,
          ssl: -1
        }
      };
    }
    const timing: Protocol.Network.ResourceTiming = (entry.responseParams
      .response as Protocol.Network.Response).timing;
    const finishedTimestamp: number =
      entry.responseFinishedS || entry.responseFailedS;
    const time: number = this.toMilliseconds(
      finishedTimestamp - entry.requestParams.timestamp
    );

    const blockedBase: number = this.toMilliseconds(
      timing.requestTime - entry.requestParams.timestamp
    );
    const blockedStart: number = this.firstNonNegative([
      timing.dnsStart,
      timing.connectStart,
      timing.sendStart
    ]);

    const blocked: number =
      blockedBase + (blockedStart === -1 ? 0 : blockedStart);

    let dns: number = -1;

    if (timing.dnsStart >= 0) {
      const start = this.firstNonNegative([
        timing.connectStart,
        timing.sendStart
      ]);
      dns = start - timing.dnsStart;
    }

    let connect: number = -1;

    if (timing.connectStart >= 0) {
      connect = timing.sendStart - timing.connectStart;
    }

    const send: number = timing.sendEnd - timing.sendStart;
    const wait: number = timing.receiveHeadersEnd - timing.sendEnd;
    const receive: number = this.toMilliseconds(
      finishedTimestamp - (timing.requestTime + timing.receiveHeadersEnd / 1000)
    );

    let ssl: number = -1;

    if (timing.sslStart >= 0 && timing.sslEnd >= 0) {
      ssl = timing.sslEnd - timing.sslStart;
    }

    return {
      time,
      timings: { blocked, dns, connect, send, wait, receive, ssl }
    };
  }

  private computePayload(
    entry: ChromeEntry,
    partialHarEntry: {
      request: { headers: Header[]; headersSize: number };
      response: { headers: Header[]; headersSize: number };
    }
  ): {
    request: { bodySize: number };
    response: { transferSize: number; bodySize: number; compression: number };
  } {
    let bodySize: number;
    let compression: number;
    let transferSize: number = entry.encodedResponseLength;

    if (partialHarEntry.response.headersSize === -1) {
      bodySize = -1;
      compression = undefined;
    } else if (entry.responseFailedS) {
      bodySize = 0;
      compression = 0;
      transferSize = partialHarEntry.response.headersSize;
    } else {
      bodySize =
        entry.encodedResponseLength - partialHarEntry.response.headersSize;
      compression = entry.responseLength - bodySize;
    }

    return {
      request: {
        bodySize: parseInt(
          this.getHeaderValue(
            partialHarEntry.request.headers,
            'content-length',
            '-1'
          ),
          10
        )
      },
      response: {
        bodySize,
        transferSize,
        compression
      }
    };
  }

  private zipNameValue(map: {
    [key: string]: string | string[];
  }): { name: string; value: string }[] {
    const pairs: { name: string; value: string }[] = [];

    for (const [name, value] of Object.entries(map)) {
      const items = Array.isArray(value) ? value : [value];

      for (const item of items) {
        pairs.push({ name, value: item });
      }
    }

    return pairs;
  }

  private getRawRequest(
    request: Protocol.Network.Request | Protocol.Network.WebSocketRequest,
    headers: Header[]
  ): string {
    const { method, url, protocol } = request as any;

    return [
      `${method} ${url} ${protocol}`,
      headers.map(({ name, value }: Header) => `${name}: ${value}`),
      '',
      ''
    ].join('\r\n');
  }

  private getRawResponse(
    response: Protocol.Network.Response | Protocol.Network.WebSocketResponse,
    headers: Header[]
  ): string {
    const { status, statusText, protocol } = response as any;

    return [
      `${protocol} ${status} ${statusText}`,
      headers.map(({ name, value }: Header) => `${name}: ${value}`),
      '',
      ''
    ].join('\r\n');
  }

  private getHeaderValue(
    headers: Header[],
    name: string,
    fallback: string = ''
  ): string {
    const pattern: RegExp = new RegExp(`^${name}$`, 'i');
    const header: Header | undefined = headers.find((item: Header) =>
      item.name.match(pattern)
    );

    return header?.value ?? fallback;
  }

  private parseQueryString(requestUrl: string): QueryString[] {
    const { query } = parseUrl(requestUrl, true);

    return this.zipNameValue(query);
  }

  private parsePostData(postData: string, headers: Header[]): PostData {
    if (!postData) {
      return undefined;
    }

    const mimeType: string = this.getHeaderValue(headers, 'content-type');
    const params: Param[] =
      mimeType === 'application/x-www-form-urlencoded'
        ? this.zipNameValue(parseQs(postData))
        : [];

    return {
      mimeType,
      params,
      text: postData
    };
  }

  private firstNonNegative(values: number[]): number {
    const value: number = values.find((item: number) => item >= 0);

    return value ?? -1;
  }

  private toMilliseconds(time: number): number {
    return time < 0 ? -1 : time * 1000;
  }
}
