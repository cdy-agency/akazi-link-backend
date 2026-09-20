import { Request, Response } from "express";
import { PublicFlyerModel } from "../models/publicFlyer";
import {
  parseSingleFile,
  updateSingleFileFieldOptional,
} from "../services/fileUploadService";
import { Types } from "mongoose";
import {
  UPLOAD_LIMITS,
  assertUploadedFileSize,
  respondUploadError,
} from "../utils/upload-limits";

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const PostFlyer = async (req: Request, res: Response) => {
  try {
    const title = normalizeOptionalString(req.body.title);
    const description = normalizeOptionalString(req.body.description) || "";
    const url = normalizeOptionalString(req.body.url);
    const applicationEmailRaw = normalizeOptionalString(
      req.body.applicationEmail
    );
    const applicationEmail = applicationEmailRaw
      ? applicationEmailRaw.toLowerCase()
      : "";
    const from = normalizeOptionalString(req.body.from) || "";
    const end = normalizeOptionalString(req.body.end) || "";
    const image = parseSingleFile((req.body as any).image);
    if (image) {
      assertUploadedFileSize(image, UPLOAD_LIMITS.image, "Flyer image");
    }

    if (!title) {
      res.status(400).json({ message: "Please provide a title" });
      return;
    }

    if (!url && !applicationEmail) {
      res.status(400).json({
        message:
          "Provide an application URL and/or an email for CV submissions",
      });
      return;
    }

    if (applicationEmail && !isValidEmail(applicationEmail)) {
      res.status(400).json({ message: "Invalid application email" });
      return;
    }

    const publicFlyer = await PublicFlyerModel.create({
      title,
      description,
      url: url || undefined,
      applicationEmail: applicationEmail || undefined,
      from,
      end,
      ...(image ? { image } : {}),
    });

    res.status(201).json({
      message: "Public Flyer is Created Successfully",
      publicFlyer: publicFlyer.toJSON(),
    });
  } catch (error: any) {
    return respondUploadError(res, error, "Failed to create Public Flyer");
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
    const existing = await PublicFlyerModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Flyer not found" });

    const title = normalizeOptionalString(req.body.title);
    const description = normalizeOptionalString(req.body.description);
    const url =
      req.body.url !== undefined
        ? normalizeOptionalString(req.body.url)
        : undefined;
    const applicationEmailRaw =
      req.body.applicationEmail !== undefined
        ? normalizeOptionalString(req.body.applicationEmail)
        : undefined;
    const applicationEmail =
      applicationEmailRaw === undefined
        ? undefined
        : applicationEmailRaw
          ? applicationEmailRaw.toLowerCase()
          : "";
    const from = normalizeOptionalString(req.body.from);
    const end = normalizeOptionalString(req.body.end);
    const image = parseSingleFile(req.body.image);
    if (image) {
      assertUploadedFileSize(image, UPLOAD_LIMITS.image, "Flyer image");
    }

    if (applicationEmail && !isValidEmail(applicationEmail)) {
      return res.status(400).json({ message: "Invalid application email" });
    }

    const nextUrl =
      url !== undefined ? url || undefined : existing.url || undefined;
    const nextEmail =
      applicationEmail !== undefined
        ? applicationEmail || undefined
        : existing.applicationEmail || undefined;

    if (!nextUrl && !nextEmail) {
      return res.status(400).json({
        message:
          "Provide an application URL and/or an email for CV submissions",
      });
    }

    const updatedData: Record<string, unknown> = {};
    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (url !== undefined) updatedData.url = url || undefined;
    if (applicationEmail !== undefined) {
      updatedData.applicationEmail = applicationEmail || undefined;
    }
    if (from !== undefined) updatedData.from = from;
    if (end !== undefined) updatedData.end = end;

    await PublicFlyerModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (image) {
      await updateSingleFileFieldOptional(
        PublicFlyerModel as any,
        id,
        "image",
        image
      );
    }

    const updatedFlyer = await PublicFlyerModel.findById(id);
    res.status(200).json({
      message: "Flyer Updated Successfully",
      flyer: updatedFlyer,
    });
  } catch (error: any) {
    return respondUploadError(res, error, "Failed to update Flyer");
  }
};

export const likeFlyer = async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; role: string } | undefined;
    if (!user?.id) {
      return res.status(403).json({ message: "Access Denied: User not authenticated" });
    }

    const { flyerId } = req.params;
    const userId = user.id;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const alreadyLiked = flyer.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      flyer.likes = flyer.likes.filter((id) => id.toString() !== userId);
    } else {
      flyer.likes.push(userId as any);
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
