import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCompetitionState } from '../src/server/competitionStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(await getCompetitionState());
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : '读取比赛状态失败' });
  }
}
