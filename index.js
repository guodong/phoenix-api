/**
 * Created by zhangliqing on 2017/9/15.
 */
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var rp = require('request-promise');
var service = require('./service.local');
var shortid = require('shortid');
var cors = require('cors')

var app = express();
var router = express.Router();
var port = process.env.PORT || 8080;


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors())
app.use('/', router);

//生成token  var token = jwt.sign({ foo: 'bar' }, 'shhhguanshanhh');
// 初始时插入cloudware
// var busybox = new Models.Cloudware({name:'busybox',logo:'https://www.busybox.net/images/busybox1.png',description:'BusyBox combines tiny versions of many common UNIX utilities into a single small executable.',image:'busybox',memory:2,timestamp:new Date()});
// busybox.save(function (err,busybox) {
//   if (err)
//     return console.error(err);
//   else
//     console.log('insert successfully!');
// })

// shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$-');

router.route('/instances').post(function (req, res) {
  var serviceName = shortid.generate()
  serviceName = serviceName.replace('_', 'aa')
  serviceName = serviceName.replace('-', 'bb')
  console.log('create service: ' + serviceName)
  var data = {
    "scale": 1,
    "assignServiceIpAddress": false,
    "startOnCreate": true,
    "type": "service",
    "stackId": "1st15",
    "launchConfig": {
      "instanceTriggeredStop": "stop",
      "kind": "container",
      "networkMode": "managed",
      "privileged": false,
      "publishAllPorts": false,
      "readOnly": false,
      "runInit": false,
      "startOnCreate": true,
      "stdinOpen": true,
      "tty": true,
      "vcpu": 1,
      "type": "launchConfig",
      "labels": {
        "io.rancher.container.pull_image": "always",
        "io.rancher.scheduler.affinity:host_label": "cloudware=true"
      },
      "restartPolicy": {"name": "always"},
      "secrets": [],
      "dataVolumes": [],
      "dataVolumesFrom": [],
      "dns": [],
      "dnsSearch": [],
      "capAdd": [],
      "capDrop": [],
      "devices": [],
      "logConfig": {"driver": "", "config": {}},
      "dataVolumesFromLaunchConfigs": [],
      "imageUuid": "docker:daocloud.io/guodong/xfce4-pulsar-ide-xterm",
      "ports": [],
      "blkioWeight": null,
      "cgroupParent": null,
      "count": null,
      "cpuCount": null,
      "cpuPercent": null,
      "cpuPeriod": null,
      "cpuQuota": null,
      "cpuSet": null,
      "cpuSetMems": null,
      "cpuShares": null,
      "createIndex": null,
      "created": null,
      "deploymentUnitUuid": null,
      "description": null,
      "diskQuota": null,
      "domainName": null,
      "externalId": null,
      "firstRunning": null,
      "healthInterval": null,
      "healthRetries": null,
      "healthState": null,
      "healthTimeout": null,
      "hostname": null,
      "ioMaximumBandwidth": null,
      "ioMaximumIOps": null,
      "ip": null,
      "ip6": null,
      "ipcMode": null,
      "isolation": null,
      "kernelMemory": null,
      "memory": null,
      "memoryMb": null,
      "memoryReservation": null,
      "memorySwap": null,
      "memorySwappiness": null,
      "milliCpuReservation": null,
      "oomScoreAdj": null,
      "pidMode": null,
      "pidsLimit": null,
      "removed": null,
      "requestedIpAddress": null,
      "shmSize": null,
      "startCount": null,
      "stopSignal": null,
      "user": null,
      "userdata": null,
      "usernsMode": null,
      "uts": null,
      "uuid": null,
      "volumeDriver": null,
      "workingDir": null,
      "networkLaunchConfig": null
    },
    "secondaryLaunchConfigs": [],
    "name": serviceName,
    "createIndex": null,
    "created": null,
    "description": null,
    "externalId": null,
    "healthState": null,
    "kind": null,
    "removed": null,
    "selectorContainer": null,
    "selectorLink": null,
    "uuid": null,
    "vip": null,
    "fqdn": null
  };
  switch (req.body.cloudware) {
    case 'rstudio':
      data.launchConfig.imageUuid = "docker:daocloud.io/guodong/xfce4-pulsar-ide-rstudio"

      break;
    case 'gedit':
      data.launchConfig.imageUuid = "docker:daocloud.io/guodong/xfce4-pulsar-ide-gedit"
      break;
  }
  request.post({
    url: service.rancher.endpoint + '/projects/1a3504/service',
    json: data
  }, function (err, httpResponse, body) {
    if (err) {
      res.send(500, 'post to rancher error.')
      return;
    }
    console.log(body)
    request.get({
      url: service.rancher.endpoint + '/projects/1a3504/loadbalancerservices/1s18'
    }, function (err, httpResponse, body1) {
      var proxyData = JSON.parse(body1)
      proxyData.lbConfig.portRules.push({
        "protocol": "http",
        "type": "portRule",
        "hostname": serviceName + ".ex-lab.org",
        "priority": 12,
        "serviceId": body.id,
        "sourcePort": 80,
        "targetPort": 5678
      })
      request.put({
        url: service.rancher.endpoint + '/projects/1a3504/loadbalancerservices/1s18',
        json: proxyData
      }, function (err, httpResponse, body2) {
        res.send(JSON.stringify({ws: 'ws://' + serviceName + '.ex-lab.org'}))
      })
    })

  });
})

router.route('/instance/:instance_id')
  .delete(function (req, res) {
    Models.Instance.find({_id: req.params.instance_id}, function (err, instanceArray) {
      if (err) {
        res.send(404, 'Instance not found')
        return
      }
      var instance = instanceArray.pop();
      request.del({url: service.rancher.endpoint + '/projects/1a3504/containers/' + instance.rancher_container_id}, function (err, httpResponse, body) {
        if (err) {
          res.send(500, 'Internal error.');
          return;
        }
        body_j = JSON.parse(body);
        if (body_j.id == instance.rancher_container_id) {
          Models.Instance.remove({_id: req.params.instance_id}, function (err) {
            if (err) {
              res.send(500, 'Database internal error.')
              return;
            }
            return res.send(204, 'Delete success.');
          });
        } else {
          console.log(body_j.id);
          console.log(instance.rancher_container_id);
          res.send(500, 'Internal error.')
          return;
        }

      });
    });
  })

function getPrivateIp(rancher_container_id) {
  var options = {
    uri: service.rancher.endpoint + '/projects/1a3504/containers/' + rancher_container_id,
    //oauth: [service.rancher.user,service.rancher.pass],
    json: true
  }
  return rp(options)
    .then(function (res) {
      if (!res.primaryIpAddress) {
        return null;
      }
      return res.primaryIpAddress;
    })
    .catch(function (err) {
      return console.error(err);
    })
}

app.listen(port);
console.log('listening on port ' + port);