# `lpapi-ble-wx`

lpapi-ble-wx 是一款基于微信小程序自身提供的 BLE 接口和 canvas 绘图所封装的标签编辑及蓝牙打印接口，接口通过 canvas 来按照用户需要进行2D绘图，绘制完毕后将图片内容转换为打印机所支持的指令，然后通过 BLE 将数据发送到打印机，然后开始打印图片。

**注意：本接口仅适用于德佟印立方系列标签打印机！**

## 1.1 使用说明

1. 本打印接口需运行在微信小程序上（详细的系统限制，可查看微信公开平台）。
2. 如果发现打印速度异常缓慢，可以尝试关闭“调试模式”。
3. 安卓手机使用时，请确保打开手机蓝牙、手机 GPS 定位功能，并确保允许微信
   App 的定位隐私权限。
4. 苹果手机使用时，请确保打开手机蓝牙，并确保允许微信的蓝牙隐私权限。

## 1.2 使用方法

### 1. 获取开发包

+ 通过 npm/yarn：

> npm install lpapi-ble-wx
或者
> yarn add lpapi-ble-wx

+ 通过[德佟印立方官网](https://detonger.com/index.html)下载接口包：
    
    打开德佟印立方官网后，在顶部点击[软件下载](https://detonger.com/software-sdk-download.html)，然后选择[SDK开发包下载](https://detonger.com/software-sdk-download.html)，然后点击 [蓝牙打印 WeChat SDK（含API文档）](https://detonger.com/software/%E9%81%93%E8%87%BB%E6%8A%80%E6%9C%AF-LPAPI%EF%BC%88WeChat%EF%BC%89%E6%89%93%E5%8D%B0%E6%8E%A5%E5%8F%A3-2024-01-02.zip)下载即可。

### 2. 配置蓝牙操作权限

```json
// app.json
{
    "permission": {
        "scope.userLocation": {
            "desc": "蓝牙搜索"
        },
        "scope.bluetooth": {
            "desc": "蓝牙搜索"
        }
    }
}
```

### 3. 获取接口实例对象

-   方法 1: 通过离屏 canvas 方式绘制标签内容

```js
// index.js
import { LPAPIFactory } from "../../js_sdk/lpapi-ble/index";

Page({
    onReady() {
        this.lpapi = LPAPIFactory.getInstance();
    },
});
```

-   方法 2：通过隐藏 canvas 方式绘制标签内容；

```xml
<!-- index.xaml -->
<view>
    <canvas type="2d" id="{{canvasId}}" style="position:fixed;left:-999999rpx;top:-999999rpx;"></canvas>
</view>
```

```js
// index.js
import { LPAPIFactory } from "../../js_sdk/lpapi-ble/index";
Page({
    onReady() {
        const query = wx.createSelectorQuery();
        query
            .select(`#${this.data.canvasId}`)
            .fields({ node: true, size: true })
            .exec((res) => {
                console.log(`---- querySelector(${this.data.canvasId}) ----`);
                console.log(res);
                const canvas = res[0].node;
                // 通过隐藏Canvas获取接口实例
                this.lpapi = LPAPIFactory.getInstance({ canvas: canvas });
            });
    },
});
```

备注： 具体使用方法参考官方 demo；

## 接口介绍

```TypeScript
interface InitOptions {
	/** 通过 createSelectorQuery 获取到的Canvas对象 */
    canvas?: Canvas;
	/** 是否显示相关日志信息 */
    logLevel?: number;
}
interface LPAPIFactory {
	/**
	 * 通过配置信息获取接口实例对象。
	 */
    static getInstance(context: InitOptions): LPAPI;
}
```

## 2.1 setSupportPrefixes(models: string|string[])

### 功能描述
设置搜索、连接的打印机的型号限定。

### 参数
models: 待搜索的打印机型号列表。
多个打印机型号可以通过字符串数组来指定，也可以通过";"将多个型号拼接成一个字符串来指定。
在 startBleDiscovery 或者 openPrinter 之前执行此方法，可以限定指定的打印机型号。

## 2.2 startBleDiscovery(opts: object)

### 功能描述
获取搜索到的打印机列表。
### 参数

| 属性             |类型   |默认值|必填|说明|
| ---------------- |--------|---|----|----|
|models            | string |   |否|链接的目标打印机，不指定会自动搜索打印机|
|timeout           | number |   |否|单位毫秒。打印机搜索超时时间，0：表示搜索到目标设备后立即停止搜索，大于零表示指定超时时间到了之后自动停止搜索，不指定表示不会自动停止搜索，需要通过 stopBleDiscovery来停止搜索。|
|interval          | number |   |否|单位毫秒，搜索到设备后，设备上报（回调）间隔|
|deviceFound       |function|   |否|搜索到蓝牙设备时的回调函数|
|adapterStateChange|function|   |否|蓝牙搜索状态变化时的回调函数|
|success           |function|   |否|蓝牙搜索功能启动成功时的回调函数|
|fail              |function|   |否|蓝牙搜索功能启动失败，或者扫描停止时的回调函数|
|complete          |function|   |否|蓝牙设备启动成功、失败、停止、检测到设备等时候的回调函数|

+ deviceFound: (devices: LPA_BleDevice[]) => void 回调参数

**LPA_BleDevice**

| 属性     | 类型    |说明|
| -------- |------- |----|
|name      |string  |设备名称   |
|deviceId  |string  |设备ID     |
|RSSI      |string  |设备信号强度|

+ adapterStateChange: (res: Object) => void 回调参数

**object res**

| 属性      |类型      |说明|
| --------- |-------- |----|
|discovering|boolean |设备搜索状态   |

+ 回调参数
LPA_Response

| 属性      |类型               |说明|
| --------- |----------------- |----|
|statusCode |number            |搜索结果状态码，0表示成功|
|resultInfo |BluetoothDevice[] |蓝牙设备列表|
|resultInfo[i].name     |string|设备名称|
|resultInfo[i].deviceId |string|设备ID|
|resultInfo[i].RSSI     |string|设备信号强度|

+ 回调结果状态码

|状态码|说明    |
|-----|--------|
| 0   | 蓝牙扫描启动成功|
| -1  | 检测到蓝牙设备|
| 1   | 蓝牙搜索已停止（超时时间到或者通过stopBleDiscovery停止）|
| 2   | 蓝牙适配器打开失败|
| 3   | 蓝牙扫描打开失败|

## 2.3 openPrinter(opts: object)
### 功能描述
打开指定名称或型号的打印机。
### 参数
| 属性  | 类型  |默认值|必填 |说明|
| ----- | ------ |----|----|----|
|name   |string  |    | 否 |打印机名称，如果未指定打印机名称，链接缓存的打印机或者自动搜索打印机|
|deviceId|string  |   | 否 |打印机设备ID|
|success |function|   | 否 |接口调用成功回调函数|
|fail    |function|   | 否 |接口调用失败回调函数|
|complete|function|   | 否 |接口调用结束的回调函数（调用成功、失败都会执行）|

<a id="lpa-result"></a>
+ LPA_Result 状态码：

|属性 |枚举值                    |说明|
| --- |-------------------------|----|
|-1   |ASYNC_WAIT               |异步等待中|
|0x00 |OK                       |打印成功|
|0x01 |ERROR_PARAM              |参数错误|
|0x02 |ERROR_NO_PRINTER         |未检测到打印机或者未指定打印机|
|0x03 |ERROR_DISCONNECTED       |打印机未连接|
|0x04 |ERROR_CONNECT_FAILED     |打印机链接失败|
|0x05 |ERROR_START_NOTIFICATION |数据Notify特征值启动失败|
|0x06 |ERROR_DATA_SEND_ERROR    |数据发送失败|
|0x07 |ERROR_DATA_RECEIVE_ERROR |数据接收异常，打印机无响应|
|0x08 |ERROR_IS_PRINTING        |打印机正在打印过程中不能打印其他标签|
|0x09 |ERROR_RESPONSE_TIMEOUT   |指令发送响应超时|
|0x10 |ERROR_JOB_CREATE         |打印任务创建失败|
|0x11 |ERROR_JOB_CANCELED       |打印任务被取消|
|0x12 |ERROR_GET_IMAGE_DATA     |打印数据获取失败|
|0x20 |ERROR_OTHER              |其他未知异常|

+ complete 回调函数: (result: Object) => void

| 属性                    |类型   |说明|
| ----------------------- |------|----|
|statusCode           |LPA_Result|链接结果状态码，0：表示成功，其他可参考 [LPA_Result](#lpa-result) 枚举详情|
|resultInfo               |string|当链接失败的时候会显示错误信息|
|resultInfo.name          |string|链接成功时的打印机名称|
|resultInfo.deviceId      |string|链接成功时的打印机设备ID|
|resultInfo.serviceId     |string|目标打印机服务ID|
|resultInfo.printerDPI    |number|打印机打印头分辨率|
|resultInfo.printerWidth  |number|打印机打印头宽度|
|resultINfo.hardwareFlags |number|打印机硬件标志位|
|resultInfo.softwareFlags |number|打印机软件标志位|

+ success 回调函数：(result: Object) => void
回调参数参考 complete 回调，当打印机链接成功的时候，属性 statusCode 为0；

+ fail 回调函数：(result: Object) => void
回调参数参考 complete 回调，当打印机链接失败的时候，属性 statusCode 不为0，具体可参考 [LPA_Result](#lpa-result)。

### 返回值

Promise<LPA_Response<string|Object>>
返回值类型可参考 complete 回调参数。

## 2.4 closePrinter()

### 功能描述
关闭已连接打印机。

## 2.5 startJob(opts: LPA_JobStartOptions): JobStartResult|undefined
### 功能描述
创建指定大小的打印任务。
### 参数[LPA_JobStartOptions]
| 属性          | 类型  |默认值|必填|说明|
| ------------- | ------|----|----|----|
|width          |number  |   |是|标签宽度（单位：毫米）。|
|height         |number  |   |是|标签高度（单位：毫米）。|
|orientation    |number  | 0 |否|标签旋转角度，默认为0，表示不旋转，具体可参考下面的 orientation参数描述|
|jobName        |string  |   |否|打印任务名称，值可参考下面的 jobName 参数描述。|
|dpi            |number  |   |否|打印任务的分辨率，如果打印机已连接，则使用打印机的分辨率，如果打印机未连接则使用上次连接过的打印机的分辨率，否则使用默认分辨率203|
|backgroundColor|string  |   |否 |预览任务的背景色，只有当打印任务为预览任务的时候有效|
|backgroundImage|Image   |   |否 |预览任务的背景色，只有当打印任务为预览任务的时候有效|

+ jobName参数描述

| 值      |描述|
|-------- |----|
|#!#prev  |当打印任务名称以该字符串开头的时候，当前打印任务不参与打印，最终会生成白色底色的预览图片 |
|#!#trans |当打印任务名称以该字符串开头的时候，当前打印任务不参与打印，最终会生成透明底色的预览图片 |
|其他     |在打印机链接成功的情况下直接打印当前打印任务，否则返回错误 |

+ orientation参数描述

|旋转方向|描述|
|------ |----|
| 0     | 不旋转 |
| 90    | 右转90度|
| 180   | 旋转180度|
| 270   | 左转90度|

### 返回值
+ 如果返回值为空: 表示任务创建失败；
+ 如果返回值非空：表示任务创建成功，成功时返回值内容的具体信息如下：

| 属性     | 类型          |说明|
| -------- | -------------|----|
|canvas    |Canvas        |用于绘制标签内容的Canvas对象 |
|context   |RendingContext|目标Canvas的绘制上下文环境 |
|isPreview |boolean       |当前任务是不是预览任务 |
|width     |number        |标签的宽度，单位毫米 |
|height    |number        |标签的高度，单位毫米|
|jobName   |string        |当前任务名称 |

## 2.6 startPrintJob(opts: LPA_JobStartOptions)
### 功能描述
创建用于打印的打印任务，返回值为 Promise<number>，值为0表示打印任务创建成功，同时打印机也链接成功，在绘制完毕后可直接进行打印。
### 参数[LPA_JobStartOptions]
| 属性      | 类型  |默认值|必填|说明|
| --------- | ------|----|----|----|
|width      |number  |   |是|标签宽度（单位：毫米）。|
|height     |number  |   |是|标签高度（单位：毫米）。|
|orientation|number  | 0 |否|标签旋转角度，默认为0，表示不旋转，具体可参考startJob中的 orientation参数描述|
|jobName    |string  |   |否|打印任务名称，值可参考startJob中的 jobName 参数描述。|
|printerName|string  |   |否|打印机设备名称，与deviceId二选一，否则无法关联目标打印机|
|deviceId   |string  |   |否|打印机设备ID，与printerName二选一，否则无法关联目标打印机|
|callback   |function|   |否|打印任务创建完毕回调函数|

### 返回值 Promise\<LPA_Result>

0   ：表示成功；
其他：表示对应的错误代码，具体可参考 [LPA_Result](#lpa-result) 枚举值详情；

<a id="commitJob"></a>
## 2.7 commitJob(options: object): Promise<LPA_JobPrintResult>

### 功能描述
结束绘制，开始打印绘制内容，如果打印任务是预览任务，则返回预览图片。
### 参数
#### options: object
|属性          |类型     |默认值|必填 |说明|
| ------------ | ------- |---- |----|----|
|printDarkness | number  | 255 |否 |打印浓度|
|printSpeed    | number  | 255 |否 |打印速度|
|gapType       | number  | 255 |否 |纸张类型|
|gapLength     | number  |auto |否 |纸张间隔长度|
|threshold     | boolean | 192 |否 |灰度阈值|
|success       |function |     |否 |接口调用成功回调函数|
|fail          |function |     |否 |接口调用失败回调函数|
|complete      |function |     |否 |接口调用结束的回调函数（调用成功、失败都会执行）|

+ 打印浓度：darkness

|值  |说明|
|----|----|
|255 |随打印机设置|
|6   |正常|
|10  |较浓|
|15  |最浓|

+ 打印速度：speed

|值  |说明|
|----|----|
|255 |随打印机设置|
|1   |最慢  |
|2   |较慢  |
|3   |正常  |
|4   |较快  |
|5   |最快  |

+ 纸张类型：gapType

|值  |说明       |
|----|----------|
|255 |随打印机设置|
|0   |连续纸     |
|1   |定位孔     |
|2   |间隙纸     |
|3   |黑标纸     |

<a id="printable"></a>
+ printable 状态

|状态码 | 打印机状态描述  |
|------| -------------- |
| 0  | 当前是可以打印的 |
| 1  | 当前正在打印 |
| 2  | 当前正在转动马达 |
| 10 | 当前没有打印任务 |
| 11 | 有打印任务，但是页面数据还没有接收完全 |
| 12 | 当前打印任务被取消 |
| 30 | 打印电压太低了 |
| 31 | 打印电压太高了 |
| 32 | 没有检测到打印头 |
| 33 | 打印头温度太高了 |
| 34 | 打印机盖子打开了 |
| 35 | 未检测到纸张 |
| 36 | 碳带盒未锁紧 |
| 37 | 未检测到碳带 |
| 38 | 不匹配的碳带 |
| 39 | 环境温度过低 |
| 40 | 用完的碳带 |
| 41 | 用完的色带 |
| 50 | 标签盒未锁紧 |

<a id="page-print-result"></a>
+ LPA_PagePrintResult 属性

|属性      | 类型            |说明|
|----------| -------------- |----|
|statusCode|LPA_Result      |链接结果状态码，0：表示成功，其他参考 [LPA_Result](#lpa-result) 详情|
|dataUrl   |string          |返回的BASE64格式的预览图片|
|imageData |ImageData       |通过canvas获取到的图片二进制数据对象，预览模式下该属性为空|
|canvas    |Canvas          |用于进行标签绘制的canvas对象|
|context   |RendingContext2D|canvas绘制上下文环境|
|printPages|number          |当前打印任务的打印页数，通常为1|
|pageIndex |number          |在整个打印任务中，当前页的索引，从0开始|
|printData |Uint8Array      |在action为0x01的时候，返回的二进制打印数据|

<a id="commitJob-complete"></a>
+ complete 回调函数：(result: LPA_JobPrintResult) => void
回调参数 statusCode 为 0 表示打印成功，否则表示打印失败，回调参数**LPA_JobPrintResult**描述如下：

|属性        | 类型                 |说明|
|------------| ------------------- |----|
|statusCode  |LPA_Result           |链接结果状态码，0：表示成功，其他参考 [LPA_Result](#lpa-result) 详情|
|printable   |number               |打印失败时候的打印机状态，值可参考 [printable](#printable)|
|pages       |LPA_PagePrintResult[]|打印任务中每一张标签的打印结果详情，具体可参考[LPA_PagePrintResult](#page-print-result)|
|previewData |string[]             |生成的 base64 图片列表，供预览。在进行多页打印的时候会返回所有页的预览信息|
|printData   |Uint8Array[]         |供打印的十六进制指令集和，该功能暂未实现|
|dataUrls    |string[]             |等同于参数 previewData|

<a id="commitJob-success"></a>
+ success 回调函数：(result: LPA_JobPrintResult) => void
打印成功，具体参数描述参考 complete回调。

<a id="commitJob-fail"></a>
+ fail 失败回调函数：(result: LPA_JobPrintResult) => void
打印失败，statusCode 表示对应的错误代码，具体可参考 LPA_Result.

<a id="commitJob-return"></a>
### 返回值
Promise<LPA_JobPrintResult>

返回值内容可参考回调函数 [complete](#commitJob-complete)。

## 2.8 setItemOrientation(orientation: number)
### 功能描述
设置后续绘制对象的默认旋转方向。

### 参数
orientation: number
|值  |说明|
|----|----|
|0   |不旋转   |
|90  |右转90度 |
|180 |旋转180度|
|270 |左转90度 |

## 2.9 setItemHorizontalAlignment(alignment: number)

### 功能描述
设置后续绘制对象的水平对齐方向。

### 参数
alignment: number
|值  |说明|
|----|----|
|0   |水平居左对齐 |
|1   |水平居中对齐 |
|2   |水平居右对齐 |
|3   |拉伸对齐    |

## 2.10 setItemVerticalAlignment(alignment: number)

### 功能描述
设置后续绘制对象的垂直对齐方向。

### 参数
alignment: number
|值  |说明|
|----|----|
|0   |垂直居上对齐 |
|1   |垂直居中对齐 |
|2   |垂直居下对齐 |
|3   |拉伸对齐    |


## 2.11 drawText(opts: object)
### 功能描述
绘制字符串对象。

### 参数
| 属性           |类型    |默认值|必填|说明|
| ----------------- | ----- |---|----|----|
|text               |string |   |是|要绘制的目标字符串|
|fontHeight         |number |   |是|字体高度，单位：毫米|
|x                  |number |0  |否|水平坐标位置，默认为0，单位：毫米|
|y                  |number |0  |否|垂直坐标位置，默认为0，单位：毫米|
|width              |number |0  |否|显示区域的宽度，默认为0，表示当行显示，单位：毫米|
|height             |number |0  |否|显示区域的高度，默认为0，表示自适应高度，单位：毫米|
|fontStyle          |number |   |否|字体样式，默认为0，表示常规字体，具体可参考下面的字体样式说明|
|fontName           |string |   |否|字体名称|
|autoReturn         |number | 1 |否|默认为1，表示按字符换行，0表示不换行|
|lineSpace          |number |   |否|行间距|
|charSpace          |number |   |否|字符间距|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

+ 字体样式：fontStyle

| 值 |说明|
|----|----|
| 0  | 常规字体|
| 1  | 粗体|
| 2  | 斜体|
| 3  | 粗斜体|

## 2.12 drawBarcode(opts: object)
### 功能描述
绘制一维码。
### 参数
| 属性              | 类型    |默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|text               | string |    | 是 |一维码内容|
|x                  | number |    | 否 |水平坐标位置（单位：毫米）|
|y                  | number |    | 否 |垂直坐标位置（单位：毫米）|
|width              | number |    | 否 |一维码宽度（单位：毫米），默认为0，表示宽度自适应|
|height             | number |    | 否 |一维码高度（单位：毫米），默认为0，表示高度自适应|
|textHeight         | number |    | 否 |一维码中字符串的高度（单位：毫米），默认自适应|
|barcodeType        | number |    | 否 |
|textAlign          | number |  1 | 否 |一维码中字符串的对齐方式，默认居中对齐 |
|textFlag           | number | 2 | 否 | 一维码中字符串的位置, 0：表示不显示字符串，1：表示字符串在上面，2：表示字符串在下面。|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

+ 一维码类型：barcodeType

|类型|说明|
|----| ---- |
| 20 | UPCA |
| 21 | UPCE |
| 22 | EAN13 |
| 23 | EAN8 |
| 24 | CODE39 |
| 25 | ITF25 |
| 26 | CODABAR |
| 27 | CODE93 |
| 28 | CODE128 |
| 29 | ISBN |
| 30 | ECODE39 |
| 31 | ITF14 |
| 32 | ChinaPost |
| 33 | Matrix25 |
| 34 | Industrial25 |
| 60 | AUTO = 60 |

## 2.13 drawQRCode(opts: object)
### 功能描述
绘制二维码。

### 参数
opts: object
| 属性              | 类型 |默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|text               | string |    | 是 |二维码内容|
|x                  | number | 0  | 否 |水平坐标位置（单位：毫米）|
|y                  | number | 0  | 否 |垂直坐标位置（单位：毫米）|
|width              | number | 0  | 否 |显示宽度（单位：毫米）|
|height             | number | 0  | 否 |显示高度（单位：毫米）|
|eccLevel           | number | 0  | 否 |二维码纠错级别|
|version            | number |    | 否 |二维码版本号，默认根据内容自动选择|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

+ QRCode二维码纠错级别：eccLevel

|纠错级别|描述|
|----| ---- |
| 0  | Low |
| 1  | Middle |
| 2  | Quality |
| 3  | High |


## 2.14 drawPDF417(options: object)
### 功能描述
绘制PDF417二维码。

### 参数
options: object
| 属性              | 类型 |默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|text               | string |    | 是 |二维码内容|
|x                  | number | 0  | 否 |水平坐标位置（单位：毫米）|
|y                  | number | 0  | 否 |垂直坐标位置（单位：毫米）|
|width              | number | 0  | 否 |显示宽度（单位：毫米）|
|height             | number | 0  | 否 |显示高度（单位：毫米）|
|eccLevel           | number | 0  | 否 |二维码纠错级别|
|cols               | number |    | 否 |横向多少个模块（不包括左右起止符和层指示符，所以最小为1，加上起止符和层指示符，最小为5）|
|aspectratio        | number |    | 否 |二维码宽高比，当未指定二维码宽度个数的时候，通过宽高比来自定计算二维码的宽和高，不指定的话，默认为3|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

## 2.15 drawDataMatrix(options: object)
### 功能描述
绘制 DataMatrix 二维码。

### 参数
options: object
| 属性              | 类型|默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|text               | string |    | 是 |二维码内容|
|x                  | number | 0  | 否 |水平坐标位置（单位：毫米）|
|y                  | number | 0  | 否 |垂直坐标位置（单位：毫米）|
|width              | number | 0  | 否 |显示宽度（单位：毫米）|
|height             | number | 0  | 否 |显示高度（单位：毫米）|
|codeShape          | number | 0  | 否 |DM码形状，0：根据内容与宽高，自动选择形状，1：使用方形码，2：使用矩形码|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

## 2.16 drawLine(opts: object)

### 功能描述
绘制直线。

### 参数
| 属性              | 类型 |默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|x1                 | number | 0  | 否 |起点的水平坐标位置（单位：毫米）|
|y1                 | number | 0  | 否 |起点的垂直坐标位置（单位：毫米）|
|x2                 | number | x1 | 否 |终点的水平坐标位置（单位：毫米）|
|y2                 | number | y1 | 否 |终点的垂直坐标位置（单位：毫米）|
|lineWidth          | number |0.4 | 否 |起点+终点模式下的线条宽度（单位：毫米）|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

## 2.17 drawRectangle(opts: object)
### 功能描述
绘制矩形。
### 参数
#### opts: object
|属性               |类型     |默认值|必填|说明|
| ----------------- | ------ | ---- |----|----|
|x                  | number | 0    | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|y                  | number | 0    | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|width              | number |      | 是 | 绘制对象的水宽度（单位：毫米）|
|height             | number |      | 是 | 绘制对象的水高度（单位：毫米）|
|lineWidth          | number | auto | 否 | 线条宽度 |
|cornerWidth        | number |      | 否 | 绘制圆角矩形时的圆角半径 |
|cornerHeight       | number |      | 否 | 绘制圆角矩形时的圆角半径 |
|fill               | boolean|false | 否 | 是否绘制填充矩形|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

## 2.18 drawEllipse(options: object)
### 功能描述
绘制矩形。
### 参数
#### options: object
| 属性              | 类型    |默认值|必填|说明|
| ----------------- | ------ | ----|----|----|
|x                  | number | 0   | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|y                  | number | 0   | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|width              | number |     | 是 | 绘制对象的水宽度（单位：毫米）|
|height             | number |     | 是 | 绘制对象的水高度（单位：毫米）|
|lineWidth          | number | auto | 否 | 线条宽度 |
|fill               | boolean|false| 否 | 是否绘制填充矩形|
|orientation        | number |auto | 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto | 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto | 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

## 2.19 drawCircle(options: object)
### 功能描述
绘制正圆形。
### 参数
#### options: object
|属性|类型|默认值|必填|说明|
| ------ | ------ | ---- |----|----|
|x       |number  | 0    | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|y       |number  | 0    | 否 | 绘制对象的水平左边位置（单位：毫米），值默认为0|
|radius  |number  |      | 是 | 圆半径（单位：毫米）|
|lineWidth          | number | auto | 否 | 线条宽度 |
|fill    |boolean |false | 否 | 是否绘制填充矩形|

## 2.20 drawImage(opts: object): Promise<boolean>
### 功能描述
绘制图片资源。
### 参数
| 属性              | 类型  |默认值|必填|说明|
| ----------------- | ------ |----|----|----|
|image              |Image/string   |    | 是 |图片对象|
|x                  |number  | 0  | 否 |水平坐标位置（单位：毫米）|
|y                  |number  | 0  | 否 |垂直坐标位置（单位：毫米）|
|width              |number  | 0  | 否 |图片显示宽度（单位：毫米）|
|height             |number  | 0  | 否 |图片显示高度（单位：毫米）|
|orientation        | number |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

### 返回值 Promise\<boolean>
如果指定的图片内容为图片的 url 字符串，则需要等待图片异步加载完毕之后才可以进行绘制，否则在结束打印任务的时候，如果图片还未加载完毕，则无法正常显示图片内容。

## 2.21 drawTable(opts: object)

### 功能描述
绘制图片资源。
### 参数
| 属性              | 类型       |默认值|必填 |说明|
| ----------------- | ----------- |----|----|-------|
|x                  |number       | 0  | 否 |水平坐标位置（单位：毫米）|
|y                  |number       | 0  | 否 |垂直坐标位置（单位：毫米）|
|width              |number       |auto| 否 |表格显示宽度（单位：毫米）|
|height             |number       | 0  | 否 |表格显示高度（单位：毫米）|
|lineWidth          |number       |0.35| 否 |表格边线宽度（单位：毫米），当线宽小于等于0的时候不显示表格边框|
|rows          |TableCell[][]|    | 是 |表格中的单元格内容，内容是一个二维数组，默认数组的长度表示表格的行数，数组中所有子数组的最大长度表示单元格的列数，单元格内容可参考下列的 [TableCell](#table-cell)参数详情|
|cells              |TableCell[]  |    | 否 |表格中的单元格内容，内容是一个一维数组，作用等同与tableRows。由于cells是个一维数组，所以需要通过**rowCount**和**columnCount**来指定表格的行数和列数。单元格内容可参考下列的 TableCell参数详情。|
|rowCount           | number      |auto| 否 |表格行数，在通过tableRows指定单元格内容的时候，可以根据行数自动计算表格的行数，值默认为单元格的行数|
|columnCount        | number      |auto| 否 |表格的列数，在通过tableRows来指定单元格内容的时候，可以自动计算单元格的列数，值默认为所有行单元格的最大值|
|rowHeights         | number[]    |auto| 否 |表格单元格的行高列表，当对应值大于等于1的时候，单位为毫米，显示的时候会按照给定的大小显示单元格的高度，当值小于1的时候，值表示空间分配系数，单元格的显示高度会根据所有系数的比例来分配表格的剩余空间|
|columnWidths       | number[]    |auto| 否 |表格单元格的列宽列表，当对应值大于等于1的时候，单位为毫米，显示的时候会按照给定的大小显示单元格的宽度，当值小于1的时候，值表示空间分配系数，单元格的显示宽度会根据所有系数的比例来分配表格的剩余空间|
|groups            | MergeGroup[] |auto| 否 |单元格合并列表。具体可参考下面的 [MergeGroup](#merge-group) 参数详情。备注：单元格的合并信息也可以通过单元格内容的**rowSpan**与**columnSpan**来替代|
|orientation        | number     |auto| 否 |绘制选项的旋转方向，如果未设置，则使用默认旋转方向|
|horizontalAlignment| number     |auto| 否 |绘制选项的水平对齐方式，如果未设置，则使用默认对齐方式|
|verticalAlignment  | number     |auto| 否 |绘制选项的垂直对齐方式，如果未设置，则使用默认对齐方式|

<a id="table-cell"></a>
+ TableCell参数详情：

**备注：TableCell可为字符串，如果为字符串，则表示当前单元格内容为字符串。**

| 属性      | 类型  |默认值|必填 |说明|
| --------- | ------ |----|----|-------|
|rowSpan    |number  |null| 否 |合并单元格的行数，不指定表示不进行单元格合并处理|
|columnSpan |number  |null| 否 |合并单元格的列数，不指定表示不进行单元格合并处理|
|type       |DrawType|    | 是 |单元格类型，具体可参考 [print()](#print)接口中的 [DrawType](#draw-type) 参数详情|
|其他       |any     |    |    |其他参数可参考具体的绘制接口|

<a id="merge-group"></a>
+ MergeGroup 参数详情：

**备注：在实际使用中单元格的合并信息也可以通过具体某个单元格的 rowSpan和columnSpan来指定单元格的合并信息，效果等同于通过 group 来指定单元格合并信息。**

| 属性  | 类型    | 说明 |
| ----- | ------ | ---- |
|x      |number  |待合并单元格的列索引|
|y      |number  |待合并单元格的行索引|
|width  |number  |需要合并的单元格列数|
|height |number  |需要合并的单元格行数|

## 2.22 printImage(options: Object): Promise<LPA_JobPrintResult>

### 功能描述
直接打印图片
### 参数
| 属性              | 类型        |默认值|必填 |说明|
| ----------------- | ---------- |----|----|-------|
|image              |Image/string|    | 是 |Image图片实例对象或者BASE64字符串，再或者图片URL路径|
|width              | number     |auto| 否 |图片的打印宽度，单位毫米。（不指定的情况下默认为图片的实际宽度，单位是像素）|
|height             | number     | 0  | 否 |图片的打印高度，单位毫米。（不指定的情况下默认为图片的实际高度，单位是像素）|
|orientation        | number     | 0  | 否 |打印任务旋转角度|
|jobName            | string     | 0  | 否 |打印任务名称|
|sx                 | number     |auto| 否 |图片的剪切位置（单位：像素）|
|sy                 | number     |auto| 否 |图片的剪切位置（单位：像素）|
|swidth             | number     |auto| 否 |原始图片中需要打印的宽度（单位：像素）|
|sheight            | number     |auto| 否 |原始图片中需要打印的高度（单位：像素）|
|threshold          | number     |auto| 否 |图片灰度转换阈值|
|copies             | number     |auto| 否 |打印份数|
|success            |function    |   |否|接口调用成功回调函数|
|fail               |function    |   |否|接口调用失败回调函数|
|complete           |function    |   |否|接口调用结束的回调函数（调用成功、失败都会执行）|

+ success 回调参数：
    参考 [commitJob](#commitJob-success) 的回调参数。
+ fail 回调参数：
    参考 [commitJob](#commitJob-fail) 的回调参数。
+ complete 回调参数：
    参考 [commitJob](#commitJob-complete) 的回调参数。

### 返回值: Promise<LPA_JobPrintResult>
返回值参考 [commitJob](#commitJob-return) 的返回值。

## 2.23 printImageData(options: Object): Promise<LPA_Result>

### 功能描述
直接打印图片的二进制数据
### 参数
| 属性              | 类型        |默认值|必填 |说明|
| ----------------- | ---------- |----|----|-------|
|imageData          |ImageData   |    | 是 |ImageData格式的二进制打印数据|
|data         |ArrayBuffer/string|null| 否 | ArrayBuffer格式的图片二进制数据，或者图片二进制数据对应的十六进制字符串|
|width              | number     |null| 否 |如果需要通过 data 来指定图片信息，则该参数表示图片的像素宽度|
|height             | number     |null| 否 |如果需要通过 data 来指定图片信息，则该参数表示图片的像素高度|
|orientation        | number     | 0  | 否 |打印任务旋转角度|
|gapType            | number     | 0  | 否 |打印纸张类型|
|printDarkness      | number     |auto| 否 |打印浓度|
|printSpeed         | number     |auto| 否 |打印速度|
|threshold          | number     |auto| 否 |图片灰度转换阈值|
|printAlignment     | number     |auto| 否 |打印对齐方式，值参考下列的printAlignment参数详情|
|success            |function    |null|否|接口调用成功回调函数|
|fail               |function    |null|否|接口调用失败回调函数|
|complete           |function    |null|否|接口调用结束的回调函数（调用成功、失败都会执行）|

+ printAlignment 参数详情：

| printAlignment |说明|
| -------------- | --------- |
|0x0000 |当打印任务宽度超过打印机打印头宽度的时候靠右打印|
|0x0200 |当打印任务宽度超过打印机打印头宽度的时候居中打印|
|0x0400 |当打印任务宽度超过打印机打印头宽度的时候靠左打印|

+ success 回调：() => void;
    打印成功回调函数。
+ fail回调: (result: LPA_Result) => void;
    打印失败回调函数，参数result表示错误代码，具体可参考 [LPA_Result](#lpa-result)。
+ complete回调：(result: LPA_Result) => void;
    打印完毕回调函数，参数result表示打印结果状态吗，0表示成功，其他表示失败，具体可参考 [LPA_Result](#lpa-result) 详情。

+ 返回值：Promise<LPA_Result>
    0: 表示成功，
    其他：参考LPA_Result详情。

<a id="print"></a>
## 2.24 print(options: Object): Promise<LPA_JobPrintResult>

### 功能描述
通过JSON方式配置所有打印任务相关信息
### 参数
| 属性          | 类型              |默认值|必填 |说明|
| ------------- | ------------------ |----|----|-------|
|jobInfo        |IJobInfo            |    | 是 |打印任务相关参数|
|printerInfo    |IPrinterInfo        |null| 否 |打印机相关参数|
|jobPages       |DrawItemOptions[][] |null| 否 |打印页面数组，绘制信息的二维码数组|
|jobPage        |DrawItemOptions[]   |null| 否 |单张标签中的绘制选项数组，用于处理只有一张标签的情况，该参数与jobPages二选一，其中一个必须有值，否则为无效打印任务|
|jobArguments   |Record<string,any>[]|null| 否 |打印参数列表，在批量打印的情况下，该参数可以配置批量打印的数据列表，可以通过 jobPage中绘制内容的 columnName 属性来关联 Record中的key来实现批量打印的功能|
|onJobCreated   |(res: Object) => void|null|否|打印任务创建完毕时的回调函数，该参数常用于 Uni 开发环境中，用于实时更新画布大小|
|onPageComplete |(res: Object) => void|null|否|打印页面处理完毕时的回调函数|
|onJobComplete  |(res: Object) => void|null|否|所有打印页面处理完毕时的回调函数|

+ IJobInfo：打印任务参数详情

| 属性                | 类型        |默认值|必填 |说明|
| ------------------- | ---------- |----|----|-------|
|jobWidth     |number      |    | 是 |打印任务宽度，单位毫米|
|jobHeight    |number      |    | 是 |打印任务高度，单位毫米|
|orientation  |number      | 0  | 否 |打印任务旋转角度，值可参考startJob接口中的 orientation参数详情|
|jobName      |string      |null| 否 |打印任务名称，值可参考startJob中的jobName参数详情|
|gapType      |number      |255 | 否 |打印纸张类型，默认随打印机设置|
|printDarkness|number      |255 | 否 |打印浓度，默认随打印机设置|
|printSpeed   |number      |255 | 否 |打印速度，默认随打印机设置|
|threshold    |number      |192 | 否 |图片灰度转换阈值|

+ IPrinterInfo：打印机参数详情

| 属性        | 类型       |默认值|必填 |说明|
| ------------| --------- |----|----|-------|
|printerName  |string     |null| 否 |打印机名称|
|deviceId     |string     |null| 否 |打印机设备ID|
|printerDPI   |number     |null| 否 |打印机分辨率|

+ DrawItemOptions：页面绘制内容参数详情

| 属性   | 类型   |默认值|必填 |说明|
| -------| ------- |----|----|-------|
|type    |DrawType |null| 否 |打印机名称|
|其他    |any      |null| 否 |具体绘制参数参考对应的draw函数|

<a id="draw-type"></a>
+ DrawType: 绘制类型参数详情

| type      |说明|
| --------- | --------- |
|text       |绘制文本内容|
|barcode    |绘制一维码内容|
|qrcode     |绘制二维码内容|
|pdf417     |绘制PDF417二维码内容|
|dataMatrix |绘制DataMatrix二维码内容|
|image      |绘制图片内容|
|rect       |绘制矩形对象|
|ellipse    |绘制椭圆对象|
|line       |绘制直线对象|
|table      |绘制表格对象|
|arcText    |绘制弧形字符串|

+ onJobCreated回调函数：(result: Object) => Promise<number>
打印任务创建成功时的回调函数。

<a id="print_on-page-complete"></a>
+ onPageComplete回调函数: (result: LPA_PagePrintResult) => void
在进行多页打印的时候，每打印完一张标签，就会触发该回调函数的调用，用户可以在该回调函数中展示打印进度，或者提前进行标签的预览处理。

| 属性      | 类型             |说明|
| --------- | --------------- |-------|
|statusCode |LPA_Result       |页面打印/预览结果状态码，0表示成功，其他表示失败，具体错误代码参考 LPA_Result 详情|
|dataUrl    |string           |生成的预览图片url链接或者BASE64字符串|
|imageData  |ImageData        |生成的用于打印的ImageData格式的图片二进制数据|
|canvas     |Canvas           |用于绘制标签的Canvas对象|
|context    |RenderingContext |用于绘制标签的Canvas上下文环境|

### 返回值：
返回值可参考 [commitJob](#commitJob-return) 的返回值。

## 2.25 printWdfx(options: Object): Promise<LPA_JobPrintResult>

### 功能描述
解析并打印wdfx格式的字符串
### 参数
| 属性          | 类型                |默认值|必填 |说明|
| ------------- | ------------------- |----|----|-------|
|content        |string               |    | 是 |wdfx文件内容字符串|
|jobInfo        |IJobInfo             |    | 是 |参考 [print()](#print)接口描述|
|printerInfo    |IPrinterInfo         |null| 否 |参考 [print()](#print)接口描述|
|jobPages       |DrawItemOptions[][]  |null| 否 |参考 [print()](#print)接口描述|
|jobPage        |DrawItemOptions[]    |null| 否 |参考 [print()](#print)接口描述|
|jobArguments   |Record<string, any>[]|null| 否 |参考 [print()](#print)接口描述|
|onJobCreated   |(res: Object) => void|null| 否 |参考 [print()](#print)接口描述|
|onPageComplete |(res: Object) => void|null| 否 |参考 [print()](#print)接口描述|
|onJobComplete  |(res: Object) => void|null| 否 |参考 [print()](#print)接口描述|
|doc            |Document             |    | 否 |在一些特殊的环境下，譬如Uni环境下，DOMParser无法直接使用，此时可以将wdfx字符串解析后传给底层，让底层去解析处理|
|domParser      |DOMParser            |    | 否 |在一些特殊的环境下，譬如Uni环境下，默认的DOMParser无法使用，此时就需要用户引入第三方的DOMParser来解析wdfx内容|

+ onPageComplete回调函数: (result: LPA_PagePrintResult) => void
参考 [print](#print)接口的 [onPageComplete](#print_on-page-complete) 回调函数的描述。

### 返回值：Promise<LPA_JobPrintResult>
返回值可参考 [commitJob](#commitJob-return) 的返回值描述。
