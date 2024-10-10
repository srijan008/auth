import { NotFoundError } from "./index.js";

export const NotFoundErrorHandler = (req, res, next) => {
	throw NotFoundError("Not Found");
};
