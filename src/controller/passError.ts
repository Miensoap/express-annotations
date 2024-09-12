import {Request, Response, NextFunction} from "express";

export const passError = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        if (next) next(err);
    });
}
