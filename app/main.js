const net = require('net');
const { join } = require('node:path');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { DOUBLE_CRLF, CRLF, HttpCodes, ContentTypes } = require('./constants');
const { gzipSync } = require('node:zlib');

const config = parseCliParameters();

function readFileContents(filename) {
  const filePath = join(config.get('directory'), filename);

  if (!existsSync(filePath)) {
    return null;
  }

  const data = readFileSync(filePath, 'utf8');

  return Buffer.from(data).toString('utf8');
}

function extractParameter(pattern, parameter, path) {
  const matches = pattern.exec(path);

  return matches.groups[parameter];
}

function parseRequest(data) {
  const stringValue = data.toString();
  const endOfRequestLine = stringValue.indexOf(CRLF);
  const requestLine = stringValue.substring(0, stringValue.indexOf(CRLF));
  const [verb, path, version] = requestLine.split(' ');

  const endOfHeader = stringValue.indexOf(DOUBLE_CRLF);
  const headerLines = stringValue.substring(endOfRequestLine, endOfHeader);
  const headers = headerLines.split(CRLF).reduce((acc, currentValue) => {
    const [headerKey, headerValue] = currentValue.split(':').map((value) => value.trim());
    return acc.set(headerKey, headerValue);
  }, new Map());

  const body = stringValue.substring(endOfHeader + DOUBLE_CRLF.length);

  return {
    verb,
    path,
    headers,
    body,
  };
}

function writeResponse(socket, httpCode, contentType, contentEncodings, content) {
  const statusLine = `HTTP/1.1 ${httpCode.code} ${httpCode.text}${CRLF}`;

  const isGzip = contentEncodings && contentEncodings.split(',').includes('gzip');

  const body = isGzip ? gzipSync(content) : content;

  const headers = [
    contentType && `Content-Type: ${contentType}`,
    contentEncodings && `Content-Encoding: ${contentEncodings}`,
    body && `Content-Length: ${body.length}`,
  ]
    .filter(Boolean)
    .join(CRLF);

  if (isGzip) {
    socket.write(`${statusLine}${headers}${DOUBLE_CRLF}`);
    socket.write(body);
  } else {
    socket.write(`${statusLine}${headers}${DOUBLE_CRLF}${body || ''}`);
  }
}

function saveFile(filename, contents) {
  const filePath = join(config.get('directory'), filename);
  writeFileSync(filePath, contents);
}

function getContentEncodings(headers) {
  return headers
    .get('Accept-Encoding')
    ?.split(',')
    .map((value) => value.trim())
    .filter((encoding) => encoding === 'gzip')
    .join(',');
}

function handleRequest(socket, data) {
  const { verb, path, headers, body } = parseRequest(data);

  const contentEncodings = getContentEncodings(headers);

  if (path === '/') {
    writeResponse(socket, HttpCodes.OK);
  } else if (path.startsWith('/echo')) {
    const echoValue = extractParameter(/^\/echo\/(?<echoValue>.+)$/, 'echoValue', path);
    writeResponse(socket, HttpCodes.OK, ContentTypes.TextPlain, contentEncodings, echoValue);
  } else if (path === '/user-agent') {
    const userAgent = headers.get('User-Agent');
    writeResponse(socket, HttpCodes.OK, ContentTypes.TextPlain, contentEncodings, userAgent);
  } else if (path.startsWith('/files')) {
    const filename = extractParameter(/^\/files\/(?<filename>.+)$/, 'filename', path);

    if (verb === 'GET') {
      const contents = readFileContents(filename);
      if (contents) {
        writeResponse(socket, HttpCodes.OK, ContentTypes.ApplicationOctetStream, contentEncodings, contents);
      } else {
        writeResponse(socket, HttpCodes.NotFound);
      }
    } else if (verb === 'POST') {
      saveFile(filename, body);
      writeResponse(socket, HttpCodes.Created);
    } else {
      writeResponse(socket, HttpCodes.InternalError);
    }
  } else {
    writeResponse(socket, HttpCodes.NotFound);
  }
}

function parseCliParameters() {
  const map = new Map();

  const cliArguments = process.argv.slice(2);

  cliArguments.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      map.set(arg.slice(2), cliArguments[index + 1]);
    }
  });

  return map;
}

const server = net.createServer((socket) => {
  socket.on('data', (data) => handleRequest(socket, data));

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
