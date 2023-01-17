import express, { Request, Response, json } from 'express';
import minimist from 'minimist';
import { Server } from 'ws';
import { join } from 'path';

const app = express();
const ws = new Server({ noServer: true, path: '/ws' });

// get port from passed in args from scripts/start.js
const { port } = minimist(process.argv.slice(2));

app.use('/assets', express.static(join(__dirname, 'assets')));
app.use('/', express.static(join(__dirname, 'public')));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

ws.on('connection', socket => {
  const timer = setInterval(() => {
    const data = `This is a message at time ${Date.now()}`;

    socket.send(data);
  }, 100);

  socket.once('close', () => clearInterval(timer));
});

app.get('/', (_: Request, res: Response) =>
  res.render('./index.hbs', {
    pages: [
      { id: 'fetch', name: 'Fetch' },
      { id: 'frame', name: 'Frame' },
      { id: 'service-worker', name: 'Service worker' },
      { id: 'worker', name: 'Workers (Shared and Web)' },
      { id: 'multi-targets', name: 'Multi targets' },
      { id: 'server-sent-events', name: 'Server-sent events' },
      { id: 'websocket', name: 'WebSocket' }
    ]
  })
);
app.get('/pages/:page', (req: Request, res: Response) =>
  res.render(`./${req.params.page}.hbs`)
);
app.get('/api/events', (req: Request, res: Response) => {
  const headers = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);
  const timer = setInterval(() => {
    const data = `data: This is a message at time ${Date.now()}\n\n`;

    res.write(data);
  }, 100);

  req.on('close', () => clearInterval(timer));
});
app.post('/api/math', json(), (req: Request, res: Response) => {
  const { args, op }: { args: number[]; op: string } = req.body;

  switch (op) {
    case 'sum':
      return res.json(args.reduce((a: number, b: number) => a + b));
    case 'divide':
      return res.json(args.reduce((a: number, b: number) => Math.round(a / b)));
    default:
      return res.sendStatus(400);
  }
});
app.get('/api/products', (_: Request, res: Response) =>
  res.json({
    products: [
      { Name: 'Cheese', Price: 2.5, Location: 'Refrigerated foods' },
      { Name: 'Crisps', Price: 3, Location: 'the Snack isle' },
      { Name: 'Pizza', Price: 4, Location: 'Refrigerated foods' },
      { Name: 'Chocolate', Price: 1.5, Location: 'the Snack isle' },
      { Name: 'Self-raising flour', Price: 1.5, Location: 'Home baking' },
      { Name: 'Ground almonds', Price: 3, Location: 'Home baking' }
    ]
  })
);
const server = app.listen(port);
server.on('upgrade', (request, socket, head) =>
  ws.handleUpgrade(request, socket, head, client =>
    ws.emit('connection', client, request)
  )
);
