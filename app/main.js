const net = require('net');

const HttpCodes = {
  Ok: {
    code: 200,
    text: 'OK',
  },
  NotFound: {
    code: 404,
    text: 'Not Found',
  },
};

const ContentTypes = {
  TextPlain: {
    text: 'text/plain',
  },
};

function extractParameter(pattern, parameter, path) {
  const matches = pattern.exec(path);

  return matches.groups[parameter];
}

function parseRequest(data) {
  const stringValue = data.toString();

  const requestLine = stringValue.substring(0, stringValue.indexOf('\r\n'));
  const [verb, path, version] = requestLine.split(' ');

  const headerLines = stringValue.substring(requestLine.length, stringValue.indexOf('\r\n\r\n'));

  const headers = headerLines.split('\r\n').reduce((acc, currentValue) => {
    const [headerKey, headerValue] = currentValue.split(':').map((value) => value.trim());
    return acc.set(headerKey, headerValue);
  }, new Map());

  return {
    verb,
    path,
    headers,
  };
}

function constructResponse(httpCode, contentType, content) {
  if (content && contentType) {
    return `HTTP/1.1 ${httpCode.code} ${httpCode.text}\r\nContent-Type: ${contentType.text}\r\nContent-Length: ${content.length}\r\n\r\n${content}`;
  }
  return `HTTP/1.1 ${httpCode.code} ${httpCode.text}\r\n\r\n`;
}

function handleRequest(socket, data) {
  const { verb, path, headers } = parseRequest(data);

  if (path === '/') {
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok)));
  } else if (path.startsWith('/echo')) {
    const echoValue = extractParameter(/^\/echo\/(?<echoValue>.+)$/, 'echoValue', path);
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok, ContentTypes.TextPlain, echoValue)));
  } else if (path === '/user-agent') {
    const userAgent = headers.get('User-Agent');
    socket.write(Buffer.from(constructResponse(HttpCodes.Ok, ContentTypes.TextPlain, userAgent)));
  } else {
    socket.write(Buffer.from(constructResponse(HttpCodes.NotFound)));
  }
}

const server = net.createServer((socket) => {
  socket.on('data', (data) => handleRequest(socket, data));

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
