//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
//var data_url = 'https://sammky19.qcloud.la/data_handler.php'
var data_url = 'https://631103516.gobeyondcode.com/data_handler.php'
Page({
    data: {
        userInfo: {},
        logged: false,
        takeSession: false,
        requestResult: '',
        page: 0,
        navData: [
          {
            name: "文章",  //文本
            current: 1,    //是否是当前页，0不是  1是
            ico: 'icon-gonglve',  //不同图标
            fn: 'gotoIndex'   //对应处理函数
          }, {
            name: "话题",
            current: 0,
            ico: 'icon-liuyan',
            fn: 'gotoDiscussion'
          }, {
            name: "我的",
            current: 0,
            ico: 'icon-wode',
            fn: 'bindViewMy'
          },
        ],
    },

    onLoad (params) {
      var that = this;
      wx.request({
        url: data_url,
        data: {
          db: 'wx_app'
        },
        method: 'POST',
        header: {'Content_Type': 'application/json'},
        complete: function (res) {
          var json_data = res.data;
          that.setData({
            items: json_data
          });
          if (res == null || res.data == null) {
            console.error('网络请求失败');
            return;
          }
        }

      })
    },

    // 用户登录示例
    login: function () {
      var that = this;
      wx.login({
        success(res) {
          if (res.code) {
            console.log('登录成功！' + res.code)
            wx.getUserInfo({
              success(res) {
                that.setData({ userInfo: res.userInfo, logged: true })
              }
            })
          } else {
            console.error('获取用户登录态失败！' + res.errMsg)
          }
        },
        fail() { },
        complete() { },
      })
    },

    // 切换是否带有登录态
    switchRequestMode: function (e) {
        this.setData({
            takeSession: e.detail.value
        })
        this.doRequest()
    },

    doRequest: function () {
        util.showBusy('请求中...')
        var that = this
        var options = {
            url: config.service.requestUrl,
            login: true,
            success (result) {
                util.showSuccess('请求成功完成')
                console.log('request success', result)
                that.setData({
                    requestResult: JSON.stringify(result.data)
                })
            },
            fail (error) {
                util.showModel('请求失败', error);
                console.log('request fail', error);
            }
        }
        if (this.data.takeSession) {  // 使用 qcloud.request 带登录态登录
            qcloud.request(options)
        } else {    // 使用 wx.request 则不带登录态
            wx.request(options)
        }
    },

    // 上传图片接口
    doUpload: function () {
        var that = this

        // 选择图片
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: function(res){
                util.showBusy('正在上传')
                var filePath = res.tempFilePaths[0]

                // 上传图片
                wx.uploadFile({
                    url: config.service.uploadUrl,
                    filePath: filePath,
                    name: 'file',

                    success: function(res){
                        util.showSuccess('上传图片成功')
                        res = JSON.parse(res.data)
                        that.setData({
                            imgUrl: res.data.imgUrl
                        })
                    },

                    fail: function(e) {
                        util.showModel('上传图片失败')
                    }
                })

            },
            fail: function(e) {
                console.error(e)
            }
        })
    },

    // 预览图片
    previewImg: function () {
        wx.previewImage({
            current: this.data.imgUrl,
            urls: [this.data.imgUrl]
        })
    },

    // 切换信道的按钮
    switchChange: function (e) {
        var checked = e.detail.value

        if (checked) {
            this.openTunnel()
        } else {
            this.closeTunnel()
        }
    },

    openTunnel: function () {
        util.showBusy('信道连接中...')
        // 创建信道，需要给定后台服务地址
        var tunnel = this.tunnel = new qcloud.Tunnel(config.service.tunnelUrl)

        // 监听信道内置消息，包括 connect/close/reconnecting/reconnect/error
        tunnel.on('connect', () => {
            util.showSuccess('信道已连接')
            console.log('WebSocket 信道已连接')
            this.setData({ tunnelStatus: 'connected' })
        })

        tunnel.on('close', () => {
            util.showSuccess('信道已断开')
            console.log('WebSocket 信道已断开')
            this.setData({ tunnelStatus: 'closed' })
        })

        tunnel.on('reconnecting', () => {
            console.log('WebSocket 信道正在重连...')
            util.showBusy('正在重连')
        })

        tunnel.on('reconnect', () => {
            console.log('WebSocket 信道重连成功')
            util.showSuccess('重连成功')
        })

        tunnel.on('error', error => {
            util.showModel('信道发生错误', error)
            console.error('信道发生错误：', error)
        })

        // 监听自定义消息（服务器进行推送）
        tunnel.on('speak', speak => {
            util.showModel('信道消息', speak)
            console.log('收到说话消息：', speak)
        })

        // 打开信道
        tunnel.open()

        this.setData({ tunnelStatus: 'connecting' })
    },

    /**
     * 点击「发送消息」按钮，测试使用信道发送消息
     */
    sendMessage() {
        if (!this.data.tunnelStatus || !this.data.tunnelStatus === 'connected') return
        // 使用 tunnel.isActive() 来检测当前信道是否处于可用状态
        if (this.tunnel && this.tunnel.isActive()) {
            // 使用信道给服务器推送「speak」消息
            this.tunnel.emit('speak', {
                'word': 'I say something at ' + new Date(),
            });
        }
    },

    /**
     * 点击「关闭信道」按钮，关闭已经打开的信道
     */
    closeTunnel() {
        if (this.tunnel) {
            this.tunnel.close();
        }
        util.showBusy('信道连接中...')
        this.setData({ tunnelStatus: 'closed' })
    },

    gotoIndex: function (event) {
      this.setData({
        page: 0,
        navData: [
          {
            name: "文章",  //文本
            current: 1,    //是否是当前页，0不是  1是
            ico: 'icon-gonglve',  //不同图标
            fn: 'gotoIndex'   //对应处理函数
          }, {
            name: "话题",
            current: 0,
            ico: 'icon-liuyan',
            fn: 'gotoDiscussion'
          }, {
            name: "我的",
            current: 0,
            ico: 'icon-wode',
            fn: 'bindViewMy'
          },
        ],
      })
    },

    gotoDiscussion: function (event) {
      this.setData({ 
        page: 1,
        navData: [
          {
            name: "文章",  //文本
            current: 0,    //是否是当前页，0不是  1是
            ico: 'icon-gonglve',  //不同图标
            fn: 'gotoIndex'   //对应处理函数
          }, {
            name: "话题",
            current: 1,
            ico: 'icon-liuyan',
            fn: 'gotoDiscussion'
          }, {
            name: "我的",
            current: 0,
            ico: 'icon-wode',
            fn: 'bindViewMy'
          },
        ],
      })
    },

    bindViewMy: function (event) {
      this.setData({
        page: 2,
        navData: [
          {
            name: "文章",  //文本
            current: 0,    //是否是当前页，0不是  1是
            ico: 'icon-gonglve',  //不同图标
            fn: 'gotoIndex'   //对应处理函数
          }, {
            name: "话题",
            current: 0,
            ico: 'icon-liuyan',
            fn: 'gotoDiscussion'
          }, {
            name: "我的",
            current: 1,
            ico: 'icon-wode',
            fn: 'bindViewMy'
          },
        ],
      })
    }
})
