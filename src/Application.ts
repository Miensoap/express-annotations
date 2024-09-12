import 'reflect-metadata';
import express, {Application as ExApplication} from 'express';
import cookieParser from "cookie-parser";

import {HandleInfo} from './controller/Route.decorator.js';
import {MetadataKeys} from './controller/consts.js';
import {IoCContainer} from "./IOCContainer.js";
import {passError} from "./controller/passError.js";

export class Application {
    private readonly _instance: ExApplication;
    private readonly afterMiddleWares;

    async start(port: number, rootDir: string) {
        await IoCContainer.scanComponents(rootDir);
        this.registerRouters(IoCContainer.controllers);
        this.afterMiddleWares.forEach(middleWare => this.addMiddleWare(middleWare));
        this._instance.listen(port);
    }

    get instance(): ExApplication {
        return this._instance;
    }

    serveStatic(prefix: string, resourcePath: string): void {
        this.instance.use(prefix, express.static(resourcePath));
    }

    constructor(beforeMiddleWares: express.Handler[], afterMiddleWares: express.Handler[]) {
        this._instance = express();
        this._instance.use(express.json());
        this._instance.use(cookieParser());
        beforeMiddleWares.forEach(middleWare => this.addMiddleWare(middleWare));
        this.afterMiddleWares = afterMiddleWares;
    }

    private addMiddleWare(middleWare: express.Handler): void {
        this._instance.use(middleWare);
    }

    private registerRouters(controllers: any[]) {
        const info: Array<{ api: string; handler: string }> = [];

        controllers.forEach((controllerInstance) => {
            const basePath: string = Reflect.getMetadata(
                MetadataKeys.BASE_PATH,
                controllerInstance.constructor
            );

            const routers: HandleInfo[] = Reflect.getMetadata(
                MetadataKeys.ROUTERS,
                controllerInstance.constructor
            );

            const exRouter = express.Router();

            routers.forEach(({method, path, handlerName}) => {
                exRouter[method](
                    path,
                    passError(controllerInstance[String(handlerName)].bind(controllerInstance),
                    ));

                info.push({
                    api: `${method.toLocaleUpperCase()} ${basePath + path}`,
                    handler: `${controllerInstance.constructor.name}.${String(handlerName)}`,
                });
            });

            this._instance.use(basePath, exRouter);
        });

        console.table(info);
    }
}
