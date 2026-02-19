import { Request, Response } from "express";
import { PublicFlyerModel } from "../models/publicFlyer";
import {
  parseSingleFile,
  updateSingleFileFieldOptional,
} from "../services/fileUploadService";
import { Document, Types } from "mongoose";
import { IPublicFlyer } from "../types/models";

export const PostFlyer = async (req: Request, res: Response) => {
  try {
    const { title, description, url, from, end } = req.body;
    const image = parseSingleFile((req.body as any).image);

    if (!title || !url) {
      res.status(400).json({ message: "Please provide title and url" });
      return;
    }

    const publicFlyer = await PublicFlyerModel.create({
      title,
      description,
      url,
      from,
      end,
      ...(image ? { image } : {}),
    });

    res.status(201).json({
      message: "Public Flyer is Created Successfully",
      publicFlyer: publicFlyer.toJSON(),
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create Public Flyer" });
  }
};

export const getFlyer = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search as string;

    const filter: any = {};
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const flyers = await PublicFlyerModel.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1})
      .populate("comments.userId", "email role")
      .populate("comments.replies.userId", "email role");

    const totalFlyers = await PublicFlyerModel.countDocuments(filter);

    const today = new Date();
    const flyersWithStatus = flyers.map((flyer) => {
      const endDate = new Date(flyer.end);
      const remainingTime = endDate.getTime() - today.getTime();
      const remainingDays = Math.max(
        Math.ceil(remainingTime / (1000 * 60 * 60 * 24)),
        0
      );

      return {
        ...flyer.toObject(),
        status: remainingDays > 0 ? "active" : "end",
        remainingDays,
      };
    });

    res.status(200).json({
      data: flyersWithStatus,
      page,
      limit,
      totalResult: totalFlyers,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching flyers." });
  }
};

export const getFlyerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Flyer ID" });
    }

    const flyer = await PublicFlyerModel.findById(id)
      .populate("comments.userId", "email role")
      .populate("comments.replies.userId", "email role");

    if (!flyer) {
      return res.status(404).json({ message: "Flyer not found" });
    }

    const today = new Date();
    const endDate = new Date(flyer.end);
    const remainingTime = endDate.getTime() - today.getTime();
    const remainingDays = Math.max(
      Math.ceil(remainingTime / (1000 * 60 * 60 * 24)),
      0
    );

    res.status(200).json({
      data: {
        ...flyer.toObject(),
        status: remainingDays > 0 ? "active" : "end",
        remainingDays,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch flyer" });
  }
};


export const updateFlyer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, url, from, end } = req.body;

    // Parse optional image
    const image = parseSingleFile(req.body.image);

    // Collect fields to update
    const updatedData: any = {};
    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (url) updatedData.url = url;
    if (from) updatedData.from = from;
    if (end) updatedData.end = end;

    // Update normal fields
    const flyer = await PublicFlyerModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!flyer) return res.status(404).json({ message: 'Flyer not found' });

    // Update image if provided
    if (image) {
      await updateSingleFileFieldOptional(PublicFlyerModel as any, id, 'image', image);
    }

    // Return the updated flyer
    const updatedFlyer = await PublicFlyerModel.findById(id);
    res.status(200).json({
      message: 'Flyer Updated Successfully',
      flyer: updatedFlyer,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to update Flyer' });
  }
};

export const likeFlyer = async (req: Request, res: Response) => {
  try {``
    const { flyerId } = req.params;
    const { userId } = req.body;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const alreadyLiked = flyer.likes.includes(userId);

    if (alreadyLiked) {
      flyer.likes = flyer.likes.filter((id) => id !== userId);
    } else {
      flyer.likes.push(userId);
    }

    await flyer.save();

    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likes: flyer.likes.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle like", error });
  }
};

export const deleteFlyer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid Flyer ID" });
    }

    const flyer = await PublicFlyerModel.findByIdAndDelete(id);

    if (!flyer) {
      res.status(400).json({ message: "Flyer not found" });
    }
    res.status(200).json({ message: "Flyer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete Flyer", error });
  }
};
