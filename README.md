# HTTP Server Project - CodeCrafters Challenge

This project is a simple Node.js server that handles HTTP requests and responses. It supports various endpoints and
functionalities such as echoing values, returning user-agent information, and handling file operations.

## Features

- **Root Endpoint**: Returns a simple OK response.
- **Echo Endpoint**: Echoes back a value provided in the URL.
- **User-Agent Endpoint**: Returns the user-agent header from the request.
- **File Operations**: Supports reading and writing files via GET and POST requests.
- **Gzip Compression**: Supports Gzip content encoding

## Endpoints

- `/`: Root endpoint, returns HTTP 200 OK.
- `/echo/:value`: Echoes back the value provided in the URL.
- `/user-agent`: Returns the user-agent header from the request.
- `/files/:filename`: Handles file operations. Supports GET for reading files and POST for writing files.

## Installation

Install dependencies:
```sh
npm install
```

## Usage

1. Start the server:
    ```sh
    node app/main.js --directory /path/to/your/directory
    ```

2. The server will listen on `localhost:4221`.

## Configuration

- **--directory**: Specify the directory for file operations.

## Example Requests

- **Root Endpoint**:
    ```sh
    curl http://localhost:4221/
    ```

- **Echo Endpoint**:
    ```sh
    curl http://localhost:4221/echo/hello
    ```

- **User-Agent Endpoint**:
    ```sh
    curl http://localhost:4221/user-agent
    ```

- **File Operations**:
    - GET:
        ```sh
        curl http://localhost:4221/files/yourfile.txt
        ```
    - POST:
        ```sh
        curl -X POST -d "file content" http://localhost:4221/files/yourfile.txt
        ```

