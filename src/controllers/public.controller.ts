import { Request, Response } from 'express';
import Job from '../models/Job';
import User from '../models/User';
import Employee from '../models/Employee';
import Company from '../models/Company';

function buildPublicJobBaseQuery(now = new Date()) {
  return {
    isActive: true,
    $and: [
      {
        $or: [
          { applicationDeadlineAt: { $exists: false } },
          { applicationDeadlineAt: { $gt: now } },
        ],
      },
      {
        $or: [
          { status: { $exists: false } },
          { status: 'PUBLISHED' },
        ],
      },
    ],
  };
}

function normalizeEmploymentType(value: string) {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, '');
  if (normalized === 'parttime') return 'part-time';
  return normalized;
}

export const listPublicJobs = async (req: Request, res: Response) => {
  try {
    const {
      category,
      q,
      employmentType,
      province,
      district,
      page,
      limit,
    } = req.query;

    const now = new Date();
    const query: Record<string, unknown> = buildPublicJobBaseQuery(now);

    if (category && typeof category === 'string' && category.trim()) {
      query.category = category.trim();
    }

    if (province && typeof province === 'string' && province.trim()) {
      query.province = province.trim();
    }

    if (district && typeof district === 'string' && district.trim()) {
      query.district = district.trim();
    }

    if (employmentType && typeof employmentType === 'string' && employmentType !== 'all') {
      query.employmentType = normalizeEmploymentType(employmentType);
    }

    if (q && typeof q === 'string' && q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchingCompanies = await Company.find({ companyName: regex }).select('_id').lean();
      const companyIds = matchingCompanies.map((company) => company._id);

      const searchConditions: Record<string, unknown>[] = [
        { title: regex },
        { description: regex },
        { province: regex },
        { district: regex },
        { category: regex },
      ];

      if (companyIds.length > 0) {
        searchConditions.push({ companyId: { $in: companyIds } });
      }

      (query.$and as Record<string, unknown>[]).push({ $or: searchConditions });
    }

    const pageNum = Math.max(1, Number.parseInt(String(page || '1'), 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, Number.parseInt(String(limit || '50'), 10) || 50)
    );
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total, categories] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('companyId', 'companyName logo location about'),
      Job.countDocuments(query),
      Job.distinct('category', {
        ...buildPublicJobBaseQuery(now),
        category: { $exists: true, $nin: ['', null] },
      }),
    ]);

    res.status(200).json({
      message: 'Jobs retrieved successfully',
      jobs,
      total,
      page: pageNum,
      limit: limitNum,
      categories: (categories as string[]).filter(Boolean).sort(),
    });
  } catch (error) {
    console.error('Error listing public jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listPublicUsers = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = {};

    if (status === 'active') {
      query.isActive = { $ne: false };
    }

    const users = await Employee.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.status(200).json({ message: 'Users retrieved successfully', users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const job = await Job.findOne({
      _id: id,
      isActive: true,
      $and: [
        {
          $or: [
            { applicationDeadlineAt: { $exists: false } },
            { applicationDeadlineAt: { $gt: now } },
          ],
        },
        {
          $or: [
            { status: { $exists: false } },
            { status: 'PUBLISHED' },
          ],
        },
      ],
    }).populate('companyId', 'companyName logo location about');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ message: 'Job retrieved successfully', job });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const getPublicUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find user by ID, excluding sensitive information
    const user = await User.findById(id)
      .select('-password -__v -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User retrieved successfully', user });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
