/**
 * Created by zhangliqing on 2017/9/15.
 */
module.exports = {
  rancher: {
    endpoint: 'http://117.50.1.134:8080/v2-beta',//去单引号
    user: process.env.RANCHER_USER,
    pass: process.env.RANCHER_PASS,
    env:process.env.RANCHER_ENV
  },
  etcd: {
    server: process.env.ETCD_SERVER
  },

  proxy: {
    server: process.env.PROXY_SERVER
  },

}