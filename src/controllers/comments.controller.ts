import { Request, Response } from "express";
import { PublicFlyerModel } from "../models/publicFlyer";
import { Types } from "mongoose";

type AuthUser = { id: string; role: string };

const getAuthUser = (req: Request): AuthUser | null => {
  const user = req.user as AuthUser | undefined;
  if (!user?.id) return null;
  return user;
};

const isOwnerOrSuperadmin = (ownerId: unknown, user: AuthUser): boolean => {
  if (user.role === "superadmin") return true;
  return ownerId?.toString() === user.id;
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    flyer.comments.push({ userId: user.id as any, comment, createdAt: new Date() });
    await flyer.save();

    res.status(201).json({
      message: "Comment added",
      comments: flyer.comments
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId, commentId } = req.params;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const comments = flyer.comments as unknown as Types.DocumentArray<any>;
    const targetComment = comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!isOwnerOrSuperadmin(targetComment.userId, user)) {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
    }

    targetComment.deleteOne();
    await flyer.save();

    res.status(200).json({
      message: "Comment deleted",
      comments: flyer.comments
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};

export const addReply = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId, commentId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const comments = flyer.comments as unknown as Types.DocumentArray<any>;
    const targetComment: any = comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    targetComment.replies.push({
      userId: user.id as any,
      comment,
      createdAt: new Date()
    });

    await flyer.save();

    res.status(201).json({
      message: "Reply added",
      comment: targetComment
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to add reply", error });
  }
};

export const getReplies = async (req: Request, res: Response) => {
  try {
    const { flyerId, commentId } = req.params;
    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const comments = flyer.comments as Types.DocumentArray<any>;
    const targetComment = comments.id(commentId);

    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ replies: targetComment.replies });
  } catch (error) {
    res.status(500).json({ message: "Failed to get replies", error });
  }
};

export const updateReply = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId, commentId, replyId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Reply cannot be empty" });
    }

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const comments = flyer.comments as unknown as Types.DocumentArray<any>;
    const targetComment = comments.id(commentId);
    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const targetReply: any = targetComment.replies.id(replyId);
    if (!targetReply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!isOwnerOrSuperadmin(targetReply.userId, user)) {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
    }

    targetReply.comment = comment;
    targetReply.createdAt = new Date();

    await flyer.save();

    res.status(200).json({
      message: "Reply updated successfully",
      replies: targetComment.replies
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to update reply", error });
  }
};

export const deleteReply = async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId, commentId, replyId } = req.params;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const comment = flyer.comments as unknown as Types.DocumentArray<any>;
    const targetComment = comment.id(commentId);

    if (!targetComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const targetReply = targetComment.replies.id(replyId);
    if (!targetReply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!isOwnerOrSuperadmin(targetReply.userId, user)) {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
    }

    targetReply.deleteOne();

    await flyer.save();

    res.status(200).json({
      message: "Reply deleted successfully",
      replies: targetComment.replies
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete reply", error });
  }
};
