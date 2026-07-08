import { DrawItemExtOptions, DrawPageItems, LPA_JsonPrintOption, LPAPI } from "lpapi-ble";
import { InitOptions } from "./adapter/BleAdapter";
export declare class LPAPIFactory {
    private static api?;
    static getApiList(): string[];
    /**
     * 获取LPAPI接口实例。
     */
    static getInstance(options?: InitOptions): LPAPI;
    static createInstance(options?: InitOptions): LPAPI;
}
export type DefineConfigFunc<T> = () => T;
export type DefineConfigOptions<T> = T | DefineConfigFunc<T>;
export declare function definePrintConfig(options: LPA_JsonPrintOption): LPA_JsonPrintOption;
export declare function definePrintConfig(callback: () => LPA_JsonPrintOption): () => LPA_JsonPrintOption;
export declare function definePageConfig(page: DrawPageItems): DrawPageItems;
export declare function defineDrawConfig(options: DrawItemExtOptions): DrawItemExtOptions;
export * from "lpapi-ble";
