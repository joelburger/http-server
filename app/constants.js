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

module.exports = {
  CRLF,
  DOUBLE_CRLF,
  HttpCodes,
  ContentTypes,
};
