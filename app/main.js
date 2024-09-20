const net = require("net");

const echoMatcher = /^\/echo\/(?<echoValue>.+)$/;

function extractParameter(pattern, parameter, path) {
    const matches = pattern.exec(path);

    return matches.groups[parameter];
}

function parseRequest(data) {

    // GET /index.html HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n

    const stringValue = data.toString();

    const requestLine = stringValue.substring(0, stringValue.indexOf('\r\n'));
    const [verb, path, version] = requestLine.split(' ');

    return {
        verb,
        path,
    };
}


const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const {verb, path} = parseRequest(data);

        if (path === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n');
        } if (path.startsWith('/echo')) {
            const echoValue = extractParameter(echoMatcher, 'echoValue', path);
            socket.write(Buffer.from(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${echoValue.length}\r\n\r\n${echoValue}`));
        } else {
            socket.write(Buffer.from('HTTP/1.1 404 Not Found\r\n\r\n'));
        }
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");


