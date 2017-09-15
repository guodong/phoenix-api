/**
 * Created by zhangliqing on 2017/9/15.
 */
exports = {
  'rancher': {
    'endpoint': process.env.RANCHER_ENDPOINT,
    'user': process.env.RANCHER_USER,
    'pass': process.env.RANCHER_PASS,
  },
  'etcd': {
    'server': process.env.ETCD_SERVER
  },

  'proxy': {
    'server': process.env.PROXY_SERVER
  },
}