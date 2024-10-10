import { CustomApiError } from "./CustomApiError.js";
import { InternalServerError } from "./index.js";

export const GlobalErrorHandler = (err, req, res, next) => {
	try {
		if (err instanceof CustomApiError) {
			return res.status(err.statusCode).json(err);
		}
		console.log(err);
		res.status(500).json(InternalServerError());
	} catch (error) {
		res.status(500).json(InternalServerError());
	}
};
