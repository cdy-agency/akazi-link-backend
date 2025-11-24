import { Request, Response } from "express";
import { PublicFlyerModel } from "../models/publicFlyer";
import { parseSingleFile } from "../services/fileUploadService";
import { Types } from "mongoose";

export const PostFlyer = async (req: Request,  res:Response)=>{
    try {
        const {title,description,url, from, end} = req.body
        const image = parseSingleFile((req.body as any).image)

        if(!title || !url){
            res.status(400).json({message:'Please provide title and url'})
            return
        }

        const publicFlyer = await PublicFlyerModel.create({
            title,
            description,
            url,
            from,
            end,
            ...(image ? {image}: {})
        })

        res.status(201).json({
            message:"Public Flyer is Created Successfully",
            publicFlyer: publicFlyer.toJSON()
        })
    } catch (error: any) {
        res.status(500).json({message:'Failed to create Public Flyer'})
    }
}

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
      .skip(skip);

    const totalFlyers = await PublicFlyerModel.countDocuments(filter);

    const today = new Date();
    const flyersWithStatus = flyers.map(flyer => {
      const endDate = new Date(flyer.end);
      const remainingTime = endDate.getTime() - today.getTime();
      const remainingDays = Math.max(Math.ceil(remainingTime / (1000 * 60 * 60 * 24)), 0);

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
    res.status(500).json({ message: "An error occurred while fetching flyers." });
  }
};


export const updateFlyer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, url, from, end } = req.body;

    let image;
    try {
      image = parseSingleFile((req.body as any).image);
    } catch (error) {
      image = undefined;
    }

    const updatedData: any = {};

    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (url) updatedData.url = url;
    if (from) updatedData.from = from;
    if (end) updatedData.end = end;
    
    if (image !== undefined && image !== null) {
      updatedData.image = image;
    }

    const flyer = await PublicFlyerModel.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!flyer) {
      res.status(404).json({ message: "Flyer not found" });
      return;
    }

    res.status(200).json({
      message: "Flyer Updated Successfully",
      flyer,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "Failed to update Flyer", error });
  }
};

export const likeFlyer = async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const { userId } = req.body;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    const alreadyLiked = flyer.likes.includes(userId);

    if (alreadyLiked) {
      flyer.likes = flyer.likes.filter(id => id !== userId);
    } else {
      flyer.likes.push(userId);
    }

    await flyer.save();

    res.status(200).json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likes: flyer.likes.length
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to toggle like", error });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const { userId, comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    flyer.comments.push({ userId, comment, createdAt: new Date() });
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
    const { flyerId, commentId } = req.params;

    const flyer = await PublicFlyerModel.findById(flyerId);
    if (!flyer) return res.status(404).json({ message: "Flyer not found" });

    flyer.comments = flyer.comments.filter(
      (c: any) => c._id.toString() !== commentId
    );

    await flyer.save();

    res.status(200).json({
      message: "Comment deleted",
      comments: flyer.comments
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to delete comment", error });
  }
};


export const deleteFlyer = async(req: Request,  res:Response) =>{
    try {
        const {id} = req.params
        
        if(!Types.ObjectId.isValid(id)){
            res.status(400).json({message: 'Invalid Flyer ID'})
        }

        const flyer = await PublicFlyerModel.findByIdAndDelete(id)

        if(!flyer){
            res.status(400).json({message: 'Flyer not found'})
        }
        res.status(200).json({ message: 'Flyer deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete Flyer', error });   
    }
}
