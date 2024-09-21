const net = require('net');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const fs = require('fs');

const CRLF = '\r\n';
const DOUBLE_CRLF = '\r\n\r\n';

const HttpCodes = {
  Ok: {
    code: 200,
    text: 'OK',
  },
  Created: {
    code: 201,
    text: 'Created',
  },
  NotFound: {
    code: 404,
    text: 'Not Found',
  },
  InternalError: {
    code: 500,
    text: 'Internal Error',
  },
};

const ContentTypes = {
  TextPlain: 'text/plain',
  ApplicationOctetStream: 'application/octet-stream',
};

const config = parseCliParameters();

function readFileContents(filename) {
  const filePath = join(config.get('directory'), filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = readFileSync(filePath);

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

function constructResponse(httpCode, contentType, content) {
  if (content && contentType) {
    return `HTTP/1.1 ${httpCode.code} ${httpCode.text}${CRLF}Content-Type: ${contentType}${CRLF}Content-Length: ${content.length}${DOUBLE_CRLF}${content}`;
  }
  return `HTTP/1.1 ${httpCode.code} ${httpCode.text}${DOUBLE_CRLF}`;
}

function saveFile(filename, contents) {
  const filePath = join(config.get('directory'), filename);
  fs.writeFileSync(filePath, contents);
}

function handleRequest(socket, data) {
  const { verb, path, headers, body } = parseRequest(data);

  if (path === '/') {
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok)));
  } else if (path.startsWith('/echo')) {
    const echoValue = extractParameter(/^\/echo\/(?<echoValue>.+)$/, 'echoValue', path);
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok, ContentTypes.TextPlain, echoValue)));
  } else if (path === '/user-agent') {
    const userAgent = headers.get('User-Agent');
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok, ContentTypes.TextPlain, userAgent)));
  } else if (path.startsWith('/files')) {
    const filename = extractParameter(/^\/files\/(?<filename>.+)$/, 'filename', path);

    if (verb === 'GET') {
      const contents = readFileContents(filename);
      if (contents) {
        socket.write(Buffer.from(constructResponse(HttpCodes.Ok, ContentTypes.ApplicationOctetStream, contents)));
      } else {
        socket.write(Buffer.from(constructResponse(HttpCodes.NotFound)));
      }
    } else if (verb === 'POST') {
      saveFile(filename, body);
      socket.write(Buffer.from(constructResponse(HttpCodes.Created)));
    } else {
      socket.write(Buffer.from(constructResponse(HttpCodes.InternalError)));
    }
  } else {
    socket.write(Buffer.from(constructResponse(HttpCodes.NotFound)));
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
