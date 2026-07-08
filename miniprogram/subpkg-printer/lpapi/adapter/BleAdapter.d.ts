import { IBleAdapter, LPA_AuthorizeOptions, LPA_BleDevice, LPA_BleDeviceConnectOptions, LPA_BleDiscoveryOptions, LPA_Device, LPA_DeviceRequestOptions, LPA_GattCharacteristic, LPA_GattService, LPA_GetCharacteristicsOptions, LPA_GetServicesOptions, LPA_InitOptions, LPA_NotifyCharacteristicOptions, LPA_OpenAdapterOptions, LPA_ReadCharacteristicOptions, LPA_ReadResult, LPA_RequestOptions, LPA_Response, LPA_SetMtuOptions, LPA_SetMtuResult, LPA_WriteCharacteristicOptions } from "lpapi-ble";
type CharacteristicValueChangeListener = WechatMiniprogram.OnBLECharacteristicValueChangeCallback;
export interface InitOptions extends LPA_RequestOptions<any>, LPA_InitOptions {
    canvas?: WechatMiniprogram.OffscreenCanvas;
}
export declare class BleAdapter implements IBleAdapter {
    private static _instance?;
    private mDeviceId?;
    private mConnected?;
    private mDeviceInfo?;
    private mIsAdapterOpened?;
    private mShowWriteLog?;
    private mCharacteristicValueChangeAction?;
    private mCharacteristicValueChangeMap;
    private mCharacteristicMap;
    /**
     * 打印机链接状态变化回调函数。
     */
    private mConnectionStateChange?;
    /**
     * 设备搜索回调函数。
     *      1. 第二次搜索蓝牙设备的时候，第一次搜索的回调可能会继续回调，所以在二次搜索的时候通过修改该属性来取消第一次的回调；
     *      2. offBluetoothDeviceFound 不一定会生效，并且有些平台可能还没有该函数；
     */
    private mDeviceFoundAction?;
    /**
     * 蓝牙适配器状态变化通知回调函数。
     */
    private mBleAdapterStateChange?;
    static getInstance(): BleAdapter;
    constructor();
    get platform(): string;
    getDeviceInfo(): WechatMiniprogram.DeviceInfo | undefined;
    /**
     * 蓝牙授权认证。
     */
    authorize(options?: LPA_AuthorizeOptions): Promise<LPA_Response<any>>;
    openAdapter(options?: LPA_OpenAdapterOptions): Promise<LPA_Response<any>>;
    private resetAllEventListener;
    closeAdapter(): Promise<LPA_Response<any>>;
    resetAdapter(callback?: (result: boolean) => void): Promise<LPA_Response<any>>;
    startDiscovery(options?: LPA_BleDiscoveryOptions): Promise<LPA_Response<any>>;
    stopDiscovery(options?: LPA_RequestOptions<any>): Promise<LPA_Response<any>>;
    getFoundDevices(options?: LPA_RequestOptions<LPA_Device[]>): Promise<LPA_Response<LPA_Device[]>>;
    connect(options: LPA_BleDeviceConnectOptions): Promise<LPA_Response<any>>;
    private resetCharacteristicValueChangeEvent;
    disconnect(options?: LPA_DeviceRequestOptions): Promise<LPA_Response<any>>;
    getConnectedBleDevices(): Promise<LPA_BleDevice[]>;
    setBleMtu(options: LPA_SetMtuOptions): Promise<LPA_SetMtuResult>;
    getGATTServices(options: LPA_GetServicesOptions): Promise<LPA_GattService[]>;
    getGATTCharacteristics(options: LPA_GetCharacteristicsOptions): Promise<LPA_GattCharacteristic[]>;
    onBLECharacteristicValueChange(characterId: string, callback: CharacteristicValueChangeListener): void;
    offBLECharacteristicValueChange(cid: string): void;
    read(options: LPA_ReadCharacteristicOptions): Promise<LPA_ReadResult>;
    notify(options: LPA_NotifyCharacteristicOptions): Promise<LPA_Response<any>>;
    write(options: LPA_WriteCharacteristicOptions): Promise<LPA_Response<any>>;
}
export {};
