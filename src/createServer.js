'use strict';

const { Server } = require('node:http');
const path = require('node:path');
const querystring = require('querystring');
const fs = require('fs');

function createServer() {
  const server = new Server();

  server.on('request', (req, res) => {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === '/') {
      showPageWithForm(res);
    }

    if (pathname === '/submit') {
      if (req.method === 'GET') {
        return sendRequest(res, 400, 'Please return to home page');
      } else if (req.method === 'POST') {
        req.on('data', 'utf8', (data) => {
          try {
            const formData = querystring.parse(data);
            const isFormValid = Object.values(formData).every((value) => value);

            if (!isFormValid) {
              sendRequest(
                res,
                400,
                'Please return and choose all params in form',
              );
            } else {
              res.end(JSON.stringify(formData));
            }
          } catch (err) {
            sendRequest(res, 500, `Internal server error parsing JSON: ${err}`);
          }
        });
      }

      sendRequest(res, 400, 'Invalid search link');
    }
  });

  server.on('error', (res, error) => {
    sendRequest(res, 500, `Internal Server Error: ${error}`);
  });

  return server;
}

function showPageWithForm(res) {
  const filePath = path.join(__dirname, 'index.html');
  const readFileStream = fs.createReadStream(filePath);

  res.writeHead(200, { 'content-type': 'text/html' });
  readFileStream.pipe(res);

  readFileStream.on('error', (error) => {
    sendRequest(res, 500, error.message);
  });

  res.on('close', () => readFileStream.destroy());
}

function sendRequest(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
  res.end(message);
}

module.exports = {
  createServer,
};
