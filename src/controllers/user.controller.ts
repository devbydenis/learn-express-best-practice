import { UserService } from "../services/user.service";
import { Request, Response } from "express";
import { BadRequestError } from "../utils/errors";
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    const user = await this.userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "Successfully created user",
      data: user,
    });
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const result = await this.userService.getAllUsers(page, limit);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
      pagination: result.pagination,
    });
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const user = await this.userService.getUserById(userId);

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { email, name } = req.body;

    const user = await this.userService.updateUser(userId, { email, name });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    })
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    // ID validation moved to middleware or handled by error handler
    const userId = this.validateUserId(req.params.id);

    const user = await this.userService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  updateUser = async (req: Request, res: Response): Promise<void> => {
    const userId = this.validateUserId(req.params.id);
    const { email, name } = req.body;

    const user = await this.userService.updateUser(userId, { email, name });

    res.status(200).json({
      success: true,
      message: `Successfully updated user with id: ${userId}`,
      data: user,
    });
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    const userId = this.validateUserId(req.params.id);

    await this.userService.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  };

  searchUsers = async (req: Request, res: Response): Promise<void> => {
    const query = req.query.q;
    if (typeof query !== "string" || query.trim() === "") {
      throw new BadRequestError("Search query is required");
    }

    const users = await this.userService.searchUsers(query.trim());

    res.status(200).json({
      success: true,
      message: "Users searched successfully",
      data: users,
    });
  };

  private validateUserId(idParam: string | string[]): number {
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id || !id.trim()) {
      throw new BadRequestError("User ID is required");
    }

    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestError("Invalid user ID");
    }

    return userId;
  }
}
