import Application from '../models/Application';
import Interview from '../models/Interview';
import Offer from '../models/Offer';
import { normalizeApplicationStatus } from '../config/application.config';

export const getPipelineMetrics = async () => {
  const [
    applications,
    shortlisted,
    interviewsScheduled,
    offersSent,
    hires,
  ] = await Promise.all([
    Application.countDocuments(),
    Application.countDocuments({
      status: {
        $in: [
          'SHORTLISTED',
          'shortlisted',
          'INTERVIEW_SCHEDULED',
          'INTERVIEW_COMPLETED',
          'SELECTED',
          'OFFER_SENT',
        ],
      },
    }),
    Interview.countDocuments({ status: 'SCHEDULED' }),
    Offer.countDocuments({ offerStatus: 'SENT' }),
    Application.countDocuments({
      status: { $in: ['HIRED', 'hired'] },
    }),
  ]);

  const byStatus = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusBreakdown: Record<string, number> = {};
  for (const row of byStatus) {
    const key = normalizeApplicationStatus(row._id);
    statusBreakdown[key] = (statusBreakdown[key] || 0) + row.count;
  }

  return {
    applications,
    shortlisted,
    interviewsScheduled,
    offersSent,
    hires,
    statusBreakdown,
  };
};
