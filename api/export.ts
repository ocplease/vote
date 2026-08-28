import type { VercelRequest, VercelResponse } from '@vercel/node';
import { competitionStateToCsv, getCompetitionState } from '../src/server/competitionStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const csv = competitionStateToCsv(await getCompetitionState());
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=competition-scores-${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : '导出失败' });
  }
}
