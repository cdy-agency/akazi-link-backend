/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Job from '../models/Job';
import Application from '../models/Application';
import {
  isJobStatus,
  JobStatus,
  syncJobActiveFlag,
} from '../config/job.config';

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const parseJobFields = (body: Record<string, unknown>) => {
  const applicationDeadline =
    typeof body.applicationDeadline === 'string' ? body.applicationDeadline : '';
  const applicationDeadlineAt = applicationDeadline
    ? new Date(applicationDeadline)
    : undefined;

  return {
    title: typeof body.title === 'string' ? body.title : undefined,
    description:
      typeof body.description === 'string' ? body.description : undefined,
    skills: parseStringArray(body.skills),
    province: typeof body.province === 'string' ? body.province : undefined,
    district: typeof body.district === 'string' ? body.district : undefined,
    experience:
      typeof body.experience === 'string' ? body.experience : undefined,
    employmentType:
      typeof body.employmentType === 'string' ? body.employmentType : undefined,
    salary: typeof body.salary === 'string' ? body.salary : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    otherBenefits: parseStringArray(body.otherBenefits),
    responsibilities: parseStringArray(body.responsibilities),
    benefits: parseStringArray(body.benefits),
    applicationDeadline,
    applicationDeadlineAt,
    status: isJobStatus(body.status) ? body.status : undefined,
  };
};

const validateRequiredJobFields = (
  fields: ReturnType<typeof parseJobFields>
): string | null => {
  if (!fields.title?.trim()) return 'Title is required';
  if (!fields.description?.trim()) return 'Description is required';
  if (!fields.employmentType) return 'Employment type is required';
  if (!fields.category?.trim()) return 'Category is required';
  if (!fields.province?.trim()) return 'Province is required';
  if (!fields.district?.trim()) return 'District is required';
  if (!fields.benefits.length) return 'At least one benefit is required';
  return null;
};

const formatJob = (job: InstanceType<typeof Job>) => ({
  id: job._id,
  title: job.title,
  description: job.description,
  skills: job.skills,
  province: job.province,
  district: job.district,
  experience: job.experience,
  employmentType: job.employmentType,
  salary: job.salary,
  category: job.category,
  otherBenefits: job.otherBenefits,
  responsibilities: job.responsibilities,
  benefits: job.benefits,
  companyId: job.companyId,
  status: job.status,
  isActive: job.isActive,
  createdByAdminId: job.createdByAdminId,
  updatedByAdminId: job.updatedByAdminId,
  applicationDeadline: job.applicationDeadline,
  applicationDeadlineAt: job.applicationDeadlineAt,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
});

export const listAdminJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const skip = (page - 1) * limit;
    const status =
      typeof req.query.status === 'string' && isJobStatus(req.query.status)
        ? req.query.status
        : undefined;

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      message: 'Jobs retrieved successfully',
      jobs: jobs.map(formatJob),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error listing admin jobs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminJobById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({
      message: 'Job retrieved successfully',
      job: formatJob(job),
    });
  } catch (error) {
    console.error('Error getting admin job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdminJob = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Admin ID not found in token' });
    }

    const fields = parseJobFields(req.body as Record<string, unknown>);
    const validationError = validateRequiredJobFields(fields);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const status: JobStatus = fields.status ?? 'DRAFT';
    const isActive = syncJobActiveFlag(status);

    const job = await Job.create({
      title: fields.title,
      description: fields.description,
      skills: fields.skills,
      province: fields.province,
      district: fields.district,
      experience: fields.experience,
      employmentType: fields.employmentType,
      salary: fields.salary,
      category: fields.category,
      otherBenefits: fields.otherBenefits,
      responsibilities: fields.responsibilities,
      benefits: fields.benefits,
      applicationDeadline: fields.applicationDeadline,
      ...(fields.applicationDeadlineAt
        ? { applicationDeadlineAt: fields.applicationDeadlineAt }
        : {}),
      status,
      isActive,
      createdByAdminId: adminId,
      updatedByAdminId: adminId,
    });

    res.status(201).json({
      message: 'Job created successfully',
      job: formatJob(job),
    });
  } catch (error) {
    console.error('Error creating admin job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminJob = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;

    if (!adminId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Admin ID not found in token' });
    }
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const fields = parseJobFields(req.body as Record<string, unknown>);
    const set: Record<string, unknown> = { updatedByAdminId: adminId };

    if (fields.title !== undefined) set.title = fields.title;
    if (fields.description !== undefined) set.description = fields.description;
    if (req.body.skills !== undefined) set.skills = fields.skills;
    if (fields.province !== undefined) set.province = fields.province;
    if (fields.district !== undefined) set.district = fields.district;
    if (fields.experience !== undefined) set.experience = fields.experience;
    if (fields.employmentType !== undefined) {
      set.employmentType = fields.employmentType;
    }
    if (fields.salary !== undefined) set.salary = fields.salary;
    if (fields.category !== undefined) set.category = fields.category;
    if (req.body.otherBenefits !== undefined) {
      set.otherBenefits = fields.otherBenefits;
    }
    if (req.body.responsibilities !== undefined) {
      set.responsibilities = fields.responsibilities;
    }
    if (req.body.benefits !== undefined) set.benefits = fields.benefits;
    if (fields.applicationDeadline !== undefined) {
      set.applicationDeadline = fields.applicationDeadline;
      set.applicationDeadlineAt = fields.applicationDeadlineAt;
    }
    if (fields.status) {
      set.status = fields.status;
      set.isActive = syncJobActiveFlag(fields.status);
    }

    const updated = await Job.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Job updated successfully',
      job: updated ? formatJob(updated) : null,
    });
  } catch (error) {
    console.error('Error updating admin job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminJobStatus = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body as { status?: JobStatus };

    if (!adminId) {
      return res
        .status(403)
        .json({ message: 'Access Denied: Admin ID not found in token' });
    }
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }
    if (!isJobStatus(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const job = await Job.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          isActive: syncJobActiveFlag(status),
          updatedByAdminId: adminId,
        },
      },
      { new: true, runValidators: true }
    );

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({
      message: 'Job status updated successfully',
      job: formatJob(job),
    });
  } catch (error) {
    console.error('Error updating admin job status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAdminJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Job ID' });
    }

    const applicationCount = await Application.countDocuments({ jobId: id });
    if (applicationCount > 0) {
      return res.status(400).json({
        message:
          'Cannot delete a job that has applications. Close or archive it instead.',
      });
    }

    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin job:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
