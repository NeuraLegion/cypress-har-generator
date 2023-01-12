import { join } from 'path';
import minimist from 'minimist';
import morgan from 'morgan';
import session from 'express-session';
import express, { NextFunction, Request, Response, json } from 'express';

declare module 'express-session' {
  interface SessionData {
    user?: string;
  }
}

const app = express();

// get port from passed in args from scripts/start.js
const { port } = minimist(process.argv.slice(2));

const matchesUsernameAndPassword = (
  body: Partial<{ username: string; password: string }> = {}
) => {
  return body.username === 'jane.lane' && body.password === 'password123';
};

const ensureLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  if (req.session!.user) {
    next();
  } else {
    res.redirect('/unauthorized');
  }
};

app.use(morgan('dev'));
app.use('/', express.static(join(__dirname, '..', 'public')));

// store a session cookie called
// 'cypress-session-cookie'
app.use(
  session({
    name: 'cypress-session-cookie',
    secret: 'sekret',
    resave: false,
    saveUninitialized: false
  })
);

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/', (_: Request, res: Response) => res.redirect('/login'));

// this is the standard HTML login page
app.get('/login', (_: Request, res: Response) => res.render('./login.hbs'));

// specifies that the jsonParser should only be
// used on the one route when it's coming from a JSON request
app.post('/login', json(), (req: Request, res: Response) => {
  // if this matches the secret username and password
  if (matchesUsernameAndPassword(req.body)) {
    req.session!.user = 'jane.lane';

    // respond with how we should redirect
    res.json({ redirect: '/dashboard' });
  } else {
    // else send back JSON error
    // with unprocessable entity
    // status code
    res.status(422).json({
      error: 'Username and/or password is incorrect'
    });
  }
});

app.get('/dashboard', ensureLoggedIn, (req: Request, res: Response) =>
  res.render('./dashboard.hbs', {
    user: req.session!.user
  })
);

app.get('/unauthorized', (_: Request, res: Response) =>
  res.render('./unauthorized.hbs')
);

app.listen(port);
