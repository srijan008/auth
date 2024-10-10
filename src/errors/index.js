import { CustomApiError } from "./CustomApiError.js";

export const NotFoundError = (msg) => new CustomApiError(msg || "Not Found", 404);
export const BadRequestError = (msg) => new CustomApiError(msg || "Bad Request", 400);
export const UnauthorizedError = (msg) => new CustomApiError(msg || "Unauthorized", 401);
export const ForbiddenError = (msg) => new CustomApiError(msg || "Forbidden", 403);
export const InternalServerError = (msg) => new CustomApiError(msg || "Internal Server Error", 500);
