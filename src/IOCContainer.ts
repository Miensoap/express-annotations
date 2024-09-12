import 'reflect-metadata';
import path from 'path';
import {pathToFileURL} from 'url';
import fs from "fs";
import {MetadataKeys} from './controller/consts.js';

export function Autowired() {
    return function (target: any, propertyKey: string) {
        const className = Reflect.getMetadata("design:type", target, propertyKey).name;
        try {
            target[propertyKey] = IoCContainer.getInstance(className);
            IoCContainer.setInstance(target.constructor.name, target);
        } catch (error) {
            IoCContainer.addPendingInjection(() => {
                target[propertyKey] = IoCContainer.getInstance(className);
            });
        }
    };
}

export function Component<T extends { new(...args: any[]): {} }>(target: T) {
    IoCContainer.setInstance(target.name, new target());
}


export class IoCContainer {
    private static instances: Map<string, any> = new Map();
    private static pendingInjections: Array<() => void> = [];
    private static _controllers: any[] = [];

    public static getInstance<T>(className: string): T {
        const instance = this.instances.get(className);
        if (!instance) {
            throw new Error(`No instance found for ${className}`);
        }
        return instance;
    }

    public static setInstance<T extends { constructor: Function }>(className: string, instance: T): void {
        if (!this.instances.get(className)) {
            this.instances.set(className, instance);
        }

        if (Reflect.getMetadata(MetadataKeys.CONTROLLER, instance.constructor)) {
            this._controllers.push(this.instances.get(className));
        }

        this.processPendingInjections();
    }

    private static processPendingInjections(): void {
        const pending = this.pendingInjections;
        this.pendingInjections = [];

        pending.forEach(injectFn => injectFn());
    }

    public static addPendingInjection(injectFn: () => void): void {
        this.pendingInjections.push(injectFn);
    }

    public static get controllers(): Object[] {
        return this._controllers;
    }

    public static async scanComponents(directory: string) {
        const files = this.getFiles(directory);
        await Promise.all(files.map(async (file) => {
            const filePath = path.resolve(directory, file);
            const fileURL = pathToFileURL(filePath);
            await import(fileURL.href);
        }));
    }

    private static getFiles(directory: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(directory);

        list.forEach(file => {
            file = path.resolve(directory, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.getFiles(file));
            } else if (file.endsWith('.js')) {
                results.push(file);
            }
        });
        return results;
    }
}



