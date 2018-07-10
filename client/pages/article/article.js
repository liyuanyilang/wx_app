// pages/article/article.js
var data_url = 'https://sammky19.qcloud.la/data_handler.php'
//var data_url = 'https://631103516.gobeyondcode.com/data_handler.php'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    time: "",
    images: "",
    content: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(params) {
    var a_id = params.id;
    var that = this;
    wx.request({
      url: data_url,
      data: {
        id: a_id
      },
      method: 'POST',
      header: { 'Content_Type': 'application/json' },
      complete: function (res) {
        var json_data = res.data[0];
        that.setData({
          title: json_data.title,
          time: json_data.datetime,
          images: json_data.images,
          content: json_data.content,
        });
        if (res == null || res.data == null) {
          console.error('网络请求失败');
          return;
        }
      }
    })
  }
})