import {HTTPMethods, MetadataKeys} from './consts.js';

export interface HandleInfo {
    method: HTTPMethods;
    path: string;
    handlerName: string | symbol;
}

const methodDecoratorFactory = (method: HTTPMethods) => {
    return (path: string): MethodDecorator => {
        return (target, propertyKey) => {
            const controllerClass = target.constructor;

            const routers: HandleInfo[] = Reflect.hasMetadata(
                MetadataKeys.ROUTERS,
                controllerClass
            )
                ? Reflect.getMetadata(MetadataKeys.ROUTERS, controllerClass)
                : [];

            routers.push({
                method,
                path,
                handlerName: propertyKey,
            });

            Reflect.defineMetadata(MetadataKeys.ROUTERS, routers, controllerClass);
        };
    };
};

export const Get = methodDecoratorFactory(HTTPMethods.GET);
export const Post = methodDecoratorFactory(HTTPMethods.POST);
export const Put = methodDecoratorFactory(HTTPMethods.PUT);
export const Delete = methodDecoratorFactory(HTTPMethods.DELETE);
export const Patch = methodDecoratorFactory(HTTPMethods.PATCH);
