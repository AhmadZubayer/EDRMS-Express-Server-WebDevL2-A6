import { Router } from "express";
import { upload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";

export const userRoutes = Router();

userRoutes.get("/profile", auth(), userController.getProfile);

userRoutes.patch(
	"/update-profile",
	auth(),
	upload.single("photo"),
	validateRequest(userValidation.updateProfileSchema),
	userController.updateProfile,
);

userRoutes.put(
	"/complete-profile",
	auth(),
	upload.single("photo"),
	validateRequest(userValidation.completeProfileSchema),
	userController.completeProfile,
);

userRoutes.patch("/is-safe", auth(), userController.toggleIsSafe);
