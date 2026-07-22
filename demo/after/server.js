const http = require('http');

let tasks = [
  { id: 1, title: 'Write the PRD', done: false },
  { id: 2, title: 'Ship the feature', done: false },
];
let nextId = 3;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/tasks') {
    res.writeHead(200);
    res.end(JSON.stringify(tasks));
    return;
  }

  if (req.method === 'POST' && req.url === '/tasks') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const { title } = JSON.parse(body || '{}');
      const task = { id: nextId++, title, done: false };
      tasks.push(task);
      res.writeHead(201);
      res.end(JSON.stringify(task));
    });
    return;
  }

  const completeMatch = req.url.match(/^\/tasks\/(\d+)\/complete$/);
  if (req.method === 'PATCH' && completeMatch) {
    const id = Number(completeMatch[1]);
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.done = true;
    }
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(3000, () => console.log('listening on :3000'));
