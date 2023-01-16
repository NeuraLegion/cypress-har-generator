import express, { Request, Response, json } from 'express';
import minimist from 'minimist';
import { join } from 'path';

const app = express();

// get port from passed in args from scripts/start.js
const { port } = minimist(process.argv.slice(2));

app.use('/assets', express.static(join(__dirname, 'assets')));
app.use('/', express.static(join(__dirname, 'public')));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/', (_: Request, res: Response) =>
  res.render('./index.hbs', {
    pages: [
      { id: 'fetch', name: 'Fetch' },
      { id: 'frame', name: 'Frame' },
      { id: 'service-worker', name: 'Service worker' },
      { id: 'web-worker', name: 'Web worker' }
    ]
  })
);
app.get('/pages/:page', (req: Request, res: Response) =>
  res.render(`./${req.params.page}.hbs`)
);
app.post('/api/math', json(), (req: Request, res: Response) => {
  const { args, op }: { args: number[]; op: string } = req.body;

  switch (op) {
    case 'sum':
      return res.json(args.reduce((a: number, b: number) => a + b));
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
app.listen(port);
