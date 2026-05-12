import { Hono } from 'hono';
import type { AppEnv } from './env';
import { registerRoute } from './routes/register';
import { chatRoute } from './routes/chat';
import { coachRoute } from './routes/coach';
import { critiqueRoute } from './routes/critique';
import { budgetRoute } from './routes/budget';
import { intentRoute } from './routes/intent';

const app = new Hono<AppEnv>();

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.route('/v1/register', registerRoute);
app.route('/v1/chat', chatRoute);
app.route('/v1/coach', coachRoute);
app.route('/v1/critique', critiqueRoute);
app.route('/v1/budget', budgetRoute);
app.route('/v1/intent', intentRoute);

app.onError((err, c) => {
  console.error('unhandled', err);
  return c.json({ error: 'internal', message: err.message }, 500);
});

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404));

export default app;
