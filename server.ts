import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  competitionStateToCsv,
  dispatchCompetitionAction,
  getCompetitionState,
  type CompetitionAction,
} from './src/server/competitionStore.js';

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/state', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json(await getCompetitionState());
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '读取比赛状态失败' });
  }
});

app.post('/api/action', async (req, res) => {
  try {
    const state = await dispatchCompetitionAction(req.body as CompetitionAction);
    res.json({ success: true, state });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : '操作失败' });
  }
});

app.get('/api/export', async (_req, res) => {
  try {
    const csv = competitionStateToCsv(await getCompetitionState());
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=competition-scores-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : '导出失败' });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Competition scoring server running at http://localhost:${PORT}`);
  });
}

start();
