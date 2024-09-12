import {MetadataKeys} from './consts.js';
import {Component} from "../IOCContainer.js";

type Constructor<T = any> = new (...args: any[]) => T;
export const Controller = (basePath: string): ClassDecorator => {
    return (target: Function) => {
        Reflect.defineMetadata(MetadataKeys.BASE_PATH, basePath, target);
        Reflect.defineMetadata(MetadataKeys.CONTROLLER, true, target);
        Component(target as Constructor);
    };
};
