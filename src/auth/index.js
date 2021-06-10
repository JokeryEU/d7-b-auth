// import atob from "atob";
import { verifyJWT } from "./tools.js";
import AuthorModel from "../schemas/authors.js";

export const jwtAuth = async (req, res, next) => {
  try {
    // const token = req.headers.authorization.split(" ")[1];
    const token = req.cookies.accessToken;
    const decoded = await verifyJWT(token);
    const user = await AuthorModel.findOne({
      _id: decoded._id,
    });
    if (!user) {
      throw new Error("Credentials are incorect");
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// export const basicAuthMiddleware = async (req, res, next) => {
//   if (!req.headers.authorization) {
//     const error = new Error("Please provide auth!");
//     error.httpStatusCode = 401;
//     next(error);
//   } else {
//     const decoded = atob(req.headers.authorization.split(" ")[1]);
//     const [email, password] = decoded.split(":");

//     const user = await AuthorSchema.checkCredentials(email, password);
//     if (user) {
//       req.user = user;
//       next();
//     } else {
//       const error = new Error("Credentials are wrong");
//       error.httpStatusCode = 401;
//       next(error);
//     }
//   }
// };

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    const error = new Error("Admin Only");
    error.httpStatusCode = 403;
    next(error);
  }
};
