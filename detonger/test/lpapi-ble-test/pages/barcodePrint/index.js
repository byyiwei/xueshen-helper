// pages/barcodePrint/index.js
import { LPAPIFactory, LPAPI, LPAUtils, LPA_Result } from "../../js_sdk/lpapi-ble/index";

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
        //
        this.handlePreviewLabel();
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        console.log(`---- printPage.onShow:`);
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
    getJobName(preview) {
        if (preview) {
            // return "#!#transparent#!#";
            return "#!#preview#!#";
        } else {
            return "lpapi-ble";
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
        if (res.statusCode != 0) return;
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
        const api = this.lpapi;
        //
        const labelWidth = 40;
        const labelHeight = 30;
        const margin = 2;
        const dataList = [{ text: "10000000" }, { text: "10000001" }, { text: "10000002" }];
        //
        api.startJob({
            width: labelWidth,
            height: labelHeight,
            jobName: this.getJobName(preview),
            gapType: this.getGapType(),
            darkness: this.getPrintDarkness(),
        });
        // 如果需要批量绘制或打印，则可以循环调用 startPage 和 endPage;
        // 注意：循环绘制的时候，不能使用 foreach，因为 foreach 不支持异步处理
        for (const item of dataList) {
            // 创建打印页面
            await api.startPage();
            // 绘制外边框
            api.drawRectangle({
                width: labelWidth,
                height: labelHeight,
            });
            api.draw1DBarcode({
                text: item.text,
                x: margin,
                y: margin,
                width: labelWidth - margin * 2,
                height: labelHeight - margin * 2,
                textHeight: 5,
                type: 22,
            });
            // 结束标签绘制
            await api.endPage().then((res) => {
                if (typeof pageComplete === "function") {
                    pageComplete(res);
                }
            });
        }
        //
        return api.commitJob();
    },
});
