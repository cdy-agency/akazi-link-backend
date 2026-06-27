/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import {
  cancelInterview,
  completeInterview,
  getInterviewById,
  listInterviews,
  scheduleInterview,
  updateInterview,
} from '../services/interview.service';
import { INTERVIEW_TYPES } from '../config/pipeline.config';

export const listAdminInterviews = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.jobId) filter.jobId = req.query.jobId;
    if (req.query.applicationId) filter.applicationId = req.query.applicationId;

    const interviews = await listInterviews(filter);
    res.status(200).json({
      message: 'Interviews retrieved successfully',
      interviews,
    });
  } catch (error) {
    console.error('Error listing interviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAdminInterviewById = async (req: Request, res: Response) => {
  try {
    const interview = await getInterviewById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    res.status(200).json({
      message: 'Interview retrieved successfully',
      interview,
    });
  } catch (error) {
    console.error('Error getting interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAdminInterview = async (req: Request, res: Response) => {
  try {
    const {
      applicationId,
      scheduledDate,
      interviewType,
      meetingLink,
      location,
      notes,
    } = req.body as {
      applicationId?: string;
      scheduledDate?: string;
      interviewType?: string;
      meetingLink?: string;
      location?: string;
      notes?: string;
    };

    if (!applicationId || !scheduledDate || !interviewType) {
      return res.status(400).json({
        message: 'applicationId, scheduledDate, and interviewType are required',
      });
    }

    if (!INTERVIEW_TYPES.includes(interviewType as any)) {
      return res.status(400).json({
        message: `Invalid interviewType. Allowed: ${INTERVIEW_TYPES.join(', ')}`,
      });
    }

    const interview = await scheduleInterview({
      applicationId,
      scheduledDate: new Date(scheduledDate),
      interviewType: interviewType as any,
      meetingLink,
      location,
      notes,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      message: 'Interview scheduled successfully',
      interview,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error scheduling interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAdminInterview = async (req: Request, res: Response) => {
  try {
    const { scheduledDate, meetingLink, location, interviewType, notes } =
      req.body as {
        scheduledDate?: string;
        meetingLink?: string;
        location?: string;
        interviewType?: string;
        notes?: string;
      };

    const updates: Record<string, unknown> = {};
    if (scheduledDate) updates.scheduledDate = new Date(scheduledDate);
    if (meetingLink !== undefined) updates.meetingLink = meetingLink;
    if (location !== undefined) updates.location = location;
    if (interviewType) updates.interviewType = interviewType;
    if (notes !== undefined) updates.notes = notes;

    const interview = await updateInterview(
      req.params.id,
      updates as any,
      req.user?.id
    );

    res.status(200).json({
      message: 'Interview updated successfully',
      interview,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error updating interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelAdminInterview = async (req: Request, res: Response) => {
  try {
    const interview = await cancelInterview(req.params.id, req.user?.id);
    res.status(200).json({
      message: 'Interview cancelled successfully',
      interview,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error cancelling interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const completeAdminInterview = async (req: Request, res: Response) => {
  try {
    const {
      technicalScore,
      communicationScore,
      professionalismScore,
      overallScore,
      notes,
      recommendation,
    } = req.body as {
      technicalScore?: number;
      communicationScore?: number;
      professionalismScore?: number;
      overallScore?: number;
      notes?: string;
      recommendation?: string;
    };

    const interview = await completeInterview({
      interviewId: req.params.id,
      technicalScore,
      communicationScore,
      professionalismScore,
      overallScore,
      notes,
      recommendation: recommendation as any,
      actorId: req.user?.id,
    });

    res.status(200).json({
      message: 'Interview completed successfully',
      interview,
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const message = error instanceof Error ? error.message : 'Server error';
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message });
    }
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
