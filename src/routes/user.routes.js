import { Router } from "express";
import { changeAvatar, changeCurrentPassword, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multur.model.js";import { verifyJWT } from "../middlewares/auth.middleware.js";
;
const router = Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount: 1
        }
    ])
    ,registerUser)
router.route("/login").post(loginUser);
//secured route
router.route("/logout").get(verifyJWT,logoutUser)
router.route("/refresh-token").get(refreshAccessToken)
router.route("/changePassword").post(verifyJWT,changeCurrentPassword);
router.route("/changeAvatar").put(verifyJWT,upload.fields([{name:"avatar",maxCount:1}]),changeAvatar);
export default router;