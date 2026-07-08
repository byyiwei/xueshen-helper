// pages/wdfxPrint/index.js
import { LPAPIFactory, LPAPI, LPAUtils, LPA_Result } from "../../js_sdk/lpapi-ble/index";
// 注意：微信小程序本身不支持 xml 解析功能，用户可以使用任何符合规范的DOMParser解析工具；
// 当前所用的 dom解析工具是：https://github.com/jindw/xmldom；
// import { DOMParser } from "../../libs/dom-parser";
import { wdfxStr } from "../wdfxPrint/datas";

Page({
    /**
     * 页面的初始数据
     */
    data: {
        labelWidth: 960,
        labelHeight: 960,
        deviceList: [{ name: "未检测到打印机", deviceId: "" }],
        deviceIndex: 0,
        orientationList: [
            { name: "横向打印", value: 0 },
            { name: "右转90度", value: 90 },
            { name: "旋转180度", value: 180 },
            { name: "左转90度", value: 270 },
        ],
        orientationIndex: 0,
        gapList: [
            { name: "随打印机设置", value: 255 },
            { name: "小票纸", value: 0 },
            { name: "不干胶", value: 2 },
            { name: "卡纸", value: 3 },
            { name: "透明贴", value: 4 },
        ],
        gapIndex: 0,
        darknessList: [
            { name: "随打印机设置", value: 255 },
            { name: "6 (正常)", value: 6 },
            { name: "7", value: 7 },
            { name: "8", value: 8 },
            { name: "9", value: 9 },
            { name: "10 (较浓)", value: 10 },
            { name: "11", value: 11 },
            { name: "12", value: 12 },
            { name: "13", value: 13 },
            { name: "14", value: 14 },
            { name: "15 (最浓)", value: 15 },
        ],
        darknessIndex: 0,
        speedList: [
            { name: "随打印机设置", value: 255 },
            { name: "最慢", value: 1 },
            { name: "较慢", value: 2 },
            { name: "正常", value: 3 },
            { name: "较快", value: 4 },
            { name: "最快", value: 5 },
        ],
        speedIndex: 0,
        previewImage: "",
        previewList: [],
        threshold: 150,
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        console.log(`---- printPage.onLoad:`, options);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {
        console.log(`---- printPage.onReady:`);
        // const query = wx.createSelectorQuery();
        // query
        //     .select(`#${this.data.canvasId}`)
        //     .fields({ node: true, size: true })
        //     .exec((res) => {
        //         console.log(`---- querySelector(${this.data.canvasId}) ----`);
        //         console.log(res);
        //         const canvas = res[0].node;
        //         this.initApi(canvas);
        //     });
        this.initApi();
        // 生成预览图片。
        this.handlePreviewLabel();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log(`---- printPage.onShow:`);
        // this.lpapi.setDrawContext(this.context);
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {
        console.log(`---- printPage.onHide:`);
        this.closePrinter();
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        console.log(`---- printPage.onUnload:`);
    },
    handleDeviceChanged(e) {
        console.log(`--------- onDeviceChanged: ${e.detail.value} ------------`);
        this.setData({ deviceIndex: e.detail.value });
    },
    handleOrientationChanged(e) {
        console.log(`--------- onOrientationChanged: ${e.detail.value} ------------`);
        this.setData({ orientationIndex: e.detail.value });
    },
    handleGapTypeChanged(e) {
        console.log(`--------- onGapTypeChanged: ${e.detail.value} ------------`);
        this.setData({ gapIndex: e.detail.value });
    },
    handleDarknessChanged(e) {
        console.log(`--------- onDarknessChanged: ${e.detail.value} ------------`);
        this.setData({ darknessIndex: e.detail.value });
    },
    handleSpeedChanged(e) {
        console.log(`--------- onSpeedChanged: ${e.detail.value} ------------`);
        this.setData({ speedIndex: e.detail.value });
    },
    initApi(canvas) {
        this.lpapi = LPAPIFactory.getInstance({
            // 日志信息显示级别，值为 0 - 4，0表示不显示调试信息，4表示显示所有调试信息
            showLog: 4,
            canvas: canvas,
            // 用于进行标签绘制的画布ID
            canvasId: this.data.canvasId,
            // enableFlowControl: true,
            // dataSendMode: 0,
        });
        // /**
        //  * 蓝牙授权认证。
        //  */
        // this.lpapi.authorize().then((res) => {
        // });
        // 搜索蓝牙设备
        this.lpapi.startBleDiscovery({
            timeout: 0,
            deviceFound: (devices) => {
                this.onDeviceFound(devices);
            },
        });
    },
    handleStartDiscovery() {
        wx.showLoading({
            title: "正在搜索打印机...",
        });
        this.lpapi.startBleDiscovery({
            timeout: 5000,
            deviceFound: (devices) => {
                this.onDeviceFound(devices);
            },
            adapterStateChange: (result) => {
                if (!result.discovering) {
                    wx.hideLoading();
                }
            },
        });
    },
    handleStopDiscovery() {
        this.lpapi.stopBleDiscovery();
    },
    handleOpenPrinter() {
        this.openPrinter(true);
    },
    handleClosePrinter() {
        console.log(`---- 关闭打印机！`);
        this.lpapi.closePrinter();
    },
    getDevice() {
        return this.data.deviceList[this.data.deviceIndex];
    },
    async openPrinter(showAlert) {
        // 1. 获取当前已选择设备
        const currDevice = this.getDevice();
        if (currDevice && currDevice.deviceId) {
            if (showAlert) {
                wx.showLoading({
                    title: "正在链接打印机...",
                });
            }
            return this.lpapi.openPrinter({
                name: currDevice.name,
                deviceId: currDevice.deviceId,
                success: () => {
                    console.log(`---- 【打印机链接成功】`);
                    if (showAlert) {
                        wx.hideLoading();
                        wx.showToast({ title: "打印机链接成功！", icon: "success" });
                    }
                },
                fail: (resp) => {
                    console.warn(`---- 【打印机链接失败】`);
                    console.warn(JSON.stringify(resp));
                    if (showAlert) {
                        wx.hideLoading();
                        wx.showToast({ title: "打印机链接失败！", icon: "error" });
                    }
                },
            });
        } else {
            console.warn("---- 未检测到打印机！");
            if (showAlert) {
                wx.showToast({ title: "未检测到打印机", icon: "error" });
            }
            return { statusCode: LPA_Result.ERROR_NO_PRINTER };
        }
    },
    onDeviceFound(devices) {
        console.log(devices);
        for (const item of devices) {
            console.log(`---- 检测到设备：[${item.name}]`, item);
            const advertisData = new Uint8Array(item.advertisData);
            console.log(`advertisData: [${LPAUtils.arrayBufferToHex16(advertisData)}]`);
            if (item.serviceData) {
                console.log(`------- show serviceData:`);
                for (const key in item.serviceData) {
                    console.log(`serviceData.key = ${key}`);
                }
            }
            // const serviceData = item.serviceData;
            // if(typeof serviceData.toString === "function") {
            //     console.log(serviceData.toString());
            // }
            // if(typeof serviceData.valueOf === "function") {
            //     console.log(serviceData.valueOf());
            // }
        }
        if (devices && devices.length > 0) {
            this.setData({
                deviceList: devices,
            });
        }
    },
    getOrientation() {
        return this.data.orientationList[this.data.orientationIndex].value;
    },
    getGapType() {
        return this.data.gapList[this.data.gapIndex].value;
    },
    getPrintDarkness() {
        return this.data.darknessList[this.data.darknessIndex].value;
    },
    getPrintSpeed() {
        return this.data.speedList[this.data.speedIndex].value;
    },
    getThreshold() {
        return Number(this.data.threshold);
    },
    handlePreviewLabel() {
        // 1. 清空预览列表
        this.setData({ previewList: [] });
        // 2. 开始绘制标签，并生成预览图片；
        this.printLabel((res) => {
            // 3. 标签生成完毕后，展示标签内容
            if (res.statusCode === 0) {
                // 标签预览成功
                console.log(`---- pageComplete: 第${res.pageIndex + 1}张标签绘制成功！`);
                const prevItem = {
                    key: `${Math.random()}`,
                    value: res.dataUrl,
                };
                this.setData({ previewList: [...this.data.previewList, prevItem] });
            } else {
                console.warn(`---- pageComplete: 第 ${res.pageIndex + 1} 张标签绘制失败！`);
            }
        }, true).then((result) => {
            // 4. 标签绘制完毕
            if (result.statusCode === 0) {
                console.log(`---- previewLabel.complete: 所有标签全部生成完毕！`);
            } else {
                console.warn(`---- previewLabe.complete: 标签预览异常！statusCode = ${result.statusCode}`, result);
            }
        });
    },
    async handlePrintLabel() {
        // 1. 连接已选打印机设备
        const res = await this.openPrinter();
        if (res.statusCode !== 0) return;
        // 2. 开始绘制并打印标签
        this.printLabel().then((result) => {
            if (result.statusCode === 0) {
                console.log(`---- handlePrintLabel: 打印数据发送完毕！`);
            } else {
                console.warn(`---- handlePrintLabel: 打印数据发送异常！statusCode = ${result.statusCode}`, result);
            }
        });
    },
    /**
     * 绘制标签内容，然后根据实际需要，获取预览图片，或者直接打印标签内容。
     * @param {(res: any) => void} pageComplete 页面绘制完毕回调函数。
     * @param {boolean} preview 使用仅获取预览图片。
     * @returns {Promise}
     */
    async printLabel(pageComplete, preview) {
        const device = this.getDevice();
        //
        return this.lpapi
            .print({
                content: wdfxStr,
                jobInfo: {
                    jobName: preview ? "#!#preview#!#" : "wdfx-print-test",
                    orientation: this.getOrientation(),
                    gapType: this.getGapType(),
                    printDarkness: this.getPrintDarkness(),
                    printSpeed: this.getPrintSpeed(),
                },
                printerInfo: {
                    name: device?.name,
                    deviceId: device?.deviceId,
                },
                jobArguments: [
                  {
                    "二维码": "1111111",
                    "备注": "22222222",
                    "废物重量": "1025KG",
                    "联系人": "隔壁老王",
                    "产生单位": "呵呵呵呵呵呵呵呵呵呵呵",
                    "数字识别码": "88888888888888888888",
                    "有害成分": "惺惺惜惺惺",
                    "主要成分": "1111111111",
                    "废物代码": "22222222222222",
                    "废物形态": "2222222222222222",
                    "废物名称": "222222222222222222",
                    "废物类别": "222222222222222",
                    "注意事项": "2222222222222",
                    "产生日期": "22222222222",
                    "反应性": "√",
                    "腐蚀性": "√",
                    "易燃": "√",
                    "毒性": "√",
                  }
                ],
                onPageComplete: (res) => {
                    // 通过 pageComplete可以监控打印或者预览的进度。
                    console.log(`----- 打印进度：[${res.pageIndex} / ${res.printPages}]`);
                    if (typeof pageComplete === "function") {
                        pageComplete(res);
                    }
                },
            });
    },
})