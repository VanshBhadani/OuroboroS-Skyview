import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(302, {
    Location: `http://localhost:4173${req.url}`,
    'Access-Control-Allow-Origin': '*'
  });
  res.end();
});

server.listen(4174, '127.0.0.1', () => {
  console.log('Redirecting http://localhost:4174 -> http://localhost:4173');
});
