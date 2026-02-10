import { AuthService } from "../services/auth.service";
import { Request, Response } from "express";
import { ChangePasswordDTO, CreateUserDTO, LoginDTO } from "../types/user.types";
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const data: CreateUserDTO = req.body;
    const result = await this.authService.register(data);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  };

  login = async (req: Request, res: Response) => {
    const data: LoginDTO = req.body 
    const result = await this.authService.login(data);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: result,
    });
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { oldPassword, newPassword }: ChangePasswordDTO = req.body;

    await this.authService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  };
}
