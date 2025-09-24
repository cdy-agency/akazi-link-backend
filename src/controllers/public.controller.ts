import { Request, Response } from 'express';
import Job from '../models/Job';
import User from '../models/User';


export const listPublicJobs = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const now = new Date();
    const query: any = {
      isActive: true,
      $or: [
        { applicationDeadlineAt: { $exists: false } },
        { applicationDeadlineAt: { $gt: now } }
      ]
    };

    if (category && typeof category === 'string') {
      query.category = category;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .populate('companyId', 'companyName logo location about');

    res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
  } catch (error) {
    console.error('Error listing public jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const listPublicUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
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
      $or: [
        { applicationDeadlineAt: { $exists: false } },
        { applicationDeadlineAt: { $gt: now } }
      ]
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
