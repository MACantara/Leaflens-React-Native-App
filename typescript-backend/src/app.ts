import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { leafAnalyzerRouter } from './routes/leafAnalyzer.js';
import { leavesRouter } from './routes/leaves.js';
import { leafHistoryRouter } from './routes/leafHistory.js';
import { tagsRouter } from './routes/tags.js';
import { leafReferencesRouter } from './routes/leafReferences.js';
import { userRouter } from './routes/user.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/leaf-analyzer', leafAnalyzerRouter);
app.use('/api/v1/leaves', leavesRouter);
app.use('/api/v1/leaf-history', leafHistoryRouter);
app.use('/api/v1/tags', tagsRouter);
app.use('/api/v1/leaves', leafReferencesRouter);
app.use('/api/v1/user', userRouter);

app.use(notFound);
app.use(errorHandler);
