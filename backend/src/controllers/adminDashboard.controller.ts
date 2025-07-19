import { getDashboardOverview } from '../services/dashboard.service';
import { Request, Response } from 'express';

export const dashboardOverviewHandler = async (req: Request, res: Response) => {
  try {
    const data = await getDashboardOverview();
    console.log('📊 Dashboard data fetched:', data);
    return res.json(data);
  } catch (error) {
    console.error('⚠️ Dashboard Controller ERROR:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};
