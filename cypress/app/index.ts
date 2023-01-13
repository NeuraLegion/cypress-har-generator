import express, { Request, Response } from 'express';
import minimist from 'minimist';
import { join } from 'path';

const app = express();

// get port from passed in args from scripts/start.js
const { port } = minimist(process.argv.slice(2));

app.use('/', express.static(join(__dirname, '..', 'public')));

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/', (_: Request, res: Response) => res.render('./index.hbs'));

app.listen(port);
