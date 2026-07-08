import { DrawContext, DzImage, ImageLoadOptions, JobStartOptions, JobStartResult, LPA_CreateContextOptions, PageEndResult } from "lpapi-ble";
export interface WXCanvasCreateOptions {
    canvas?: WechatMiniprogram.Canvas | WechatMiniprogram.OffscreenCanvas;
}
export declare class WXContext extends DrawContext {
    private mOptions;
    private mCanvas?;
    static createInstance(options?: LPA_CreateContextOptions): WXContext | undefined;
    constructor(context?: WXCanvasCreateOptions);
    protected createCanvas(): HTMLCanvasElement;
    /**
     * 通过 canvas 来创建 Image 对象。
     */
    private createImage;
    loadImage(options: string | ImageLoadOptions): Promise<HTMLImageElement | DzImage | null>;
    startJob(options: JobStartOptions): JobStartResult | undefined;
    commitJob(): Promise<PageEndResult | undefined>;
}
