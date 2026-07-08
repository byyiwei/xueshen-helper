Page({
    data: {},
    onLoad() {
        console.log(`========== index.onLoad ==========`);
    },
    onReady() {
        console.log(`========== index.onReady ==========`);
    },
    textPrintTest() {
        console.log(`---- navigateTo ->: textPrintTest`);
        wx.navigateTo({
            url: '/pages/textPrint/index',
        });
        // wx.navigateTo({
        //     url: 'test?id=1',
        //     events: {
        //         // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        //         acceptDataFromOpenedPage: function (data) {
        //             console.log(data)
        //         },
        //         someEvent: function (data) {
        //             console.log(data)
        //         }
        //         //   ...
        //     },
        //     success: function (res) {
        //         // 通过eventChannel向被打开页面传送数据
        //         res.eventChannel.emit('acceptDataFromOpenerPage', {
        //             data: 'test'
        //         })
        //     }
        // });
    },
    qrcodePrintTest() {
        console.log(`---- navigateTo ->: qrcodePrintTest`);
        wx.navigateTo({
            url: '/pages/qrcodePrint/index',
        });
    },
    barcodePrintTest() {
        console.log(`---- navigateTo ->: barcodePrintTest`);
        wx.navigateTo({
            url: '/pages/barcodePrint/index',
        });
    },
    imagePrintTest() {
        console.log(`---- navigateTo ->: imagePrintTest`);
        wx.navigateTo({
            url: '/pages/imagePrint/index',
        });
    },
    rectanglePrintTest() {
        console.log(`---- navigateTo ->: rectPrintTest`);
        wx.navigateTo({
            url: '/pages/rectPrint/index',
        });
    },
    alignmentPrintTest() {
        console.log(`---- navigateTo ->: alignPrintTest`);
        wx.navigateTo({
            url: '/pages/alignPrint/index',
        });
    },
    tablePrintTest() {
        console.log(`---- navigateTo ->: tablePrintTest`);
        wx.navigateTo({
            url: '/pages/tablePrint/index',
        });
    },
    jsonPrintTest() {
        console.log(`---- navigateTo ->: jsonPrintTest`);
        wx.navigateTo({
            url: '/pages/jsonPrint/index',
        });
    },
    wdfxPrintTest() {
        console.log(`---- navigateTo ->: wdfxPrintTest`);
        wx.navigateTo({
            url: '/pages/wdfxPrint/index',
        });
    },
    multiPagePrintTest() {
        console.log(`---- navigateTo ->: multiPagePrintTest`);
        wx.navigateTo({
            url: '/pages/multiPagePrint/index',
        });
    },
    
    localImagePrintTest() {
        const api = this.lpapi;
        const labelWidth = 40;
        const labelHeight = 40;
        const margin = 2;
        const url = "/static/yinlifun.png";
        //
        this.checkAndOpenPrinter(() => {
            api.loadImage(url, (image) => {
                api.startJob({
                    width: labelWidth,
                    height: labelHeight,
                    jobName: this.getJobName(),
                });
                // 绘制标签外边框
                api.drawRectangle({
                    width: labelWidth,
                    height: labelHeight,
                    lineWidth: 0.3,
                });
                // 绘制图片
                api.drawImage({
                    image: image,
                    x: margin,
                    y: margin,
                    width: labelWidth - margin * 2,
                    height: labelHeight - margin * 2,
                });
                //
                api.commitJob({
                    gapType: this.getGapType(),
                    darkness: this.getPrintDarkness(),
                    threshold: this.getThreshold(),
                }).then((resp) => {
                    this.previewLabel(resp);
                });
            });
        });
    },
});