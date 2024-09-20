const net = require("net");

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
        } else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');

        }
    });

    socket.on("close", () => {
        socket.end();
    });
});

server.listen(4221, "localhost");


