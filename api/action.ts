import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchCompetitionAction, type CompetitionAction } from '../src/server/competitionStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const state = await dispatchCompetitionAction(req.body as CompetitionAction);
    return res.status(200).json({ success: true, state });
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败';
    return res.status(400).json({ error: message });
  }
}
