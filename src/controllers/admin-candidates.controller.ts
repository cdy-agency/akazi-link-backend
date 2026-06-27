/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import {
  getCandidateIntelligenceById,
  searchCandidates,
} from '../services/candidate-search.service';
import { isValidExperienceRange } from '../config/profile-status.config';

const parseSearchParams = (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const yearsExperience = req.query.yearsExperience as string | undefined;

  return {
    page,
    limit,
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    skill: typeof req.query.skill === 'string' ? req.query.skill : undefined,
    interviewSkill:
      typeof req.query.interviewSkill === 'string'
        ? req.query.interviewSkill
        : undefined,
    language:
      typeof req.query.language === 'string' ? req.query.language : undefined,
    certification:
      typeof req.query.certification === 'string'
        ? req.query.certification
        : undefined,
    education:
      typeof req.query.education === 'string' ? req.query.education : undefined,
    experience:
      typeof req.query.experience === 'string'
        ? req.query.experience
        : undefined,
    location:
      typeof req.query.location === 'string' ? req.query.location : undefined,
    yearsExperience:
      yearsExperience && isValidExperienceRange(yearsExperience)
        ? yearsExperience
        : undefined,
    profileStatus:
      typeof req.query.profileStatus === 'string'
        ? req.query.profileStatus
        : undefined,
    applicationStatus:
      typeof req.query.applicationStatus === 'string'
        ? req.query.applicationStatus
        : undefined,
    searchableOnly: req.query.searchableOnly !== 'false',
  };
};

export const listAdminCandidates = async (req: Request, res: Response) => {
  try {
    const params = parseSearchParams(req);
    const result = await searchCandidates(params);

    res.status(200).json({
      message: 'Candidates retrieved successfully',
      candidates: result.candidates,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error listing admin candidates:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminCandidateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    const candidate = await getCandidateIntelligenceById(id);

    res.status(200).json({
      message: 'Candidate retrieved successfully',
      candidate,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    const message = error instanceof Error ? error.message : 'Server error';

    if (statusCode) {
      return res.status(statusCode).json({ message });
    }

    console.error('Error getting admin candidate:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
