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
      //"environment": {"DISPLAY": ":0"},
      //"command": "startxfce4",
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
        //"io.rancher.container.pull_image": "always",
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
      "imageUuid": "docker:cloudwarelabs/xfce4-min",
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
  // switch (req.body.cloudware) {
  //   case 'rstudio':
  //     data.launchConfig.imageUuid = "docker:daocloud.io/guodong/xfce4-pulsar-ide-rstudio"
  //     break;
  //   case 'gedit':
  //     data.launchConfig.imageUuid = "docker:cloudwarelabs/xfce4-pulsar-ide-gedit"
  //     break;
  // }
  request.post({
    url: service.rancher.endpoint + '/projects/1a3504/service',
    json: data
  }, function (err, httpResponse, body) {
    if (err) {
      res.send(500, 'post to rancher error.')
      return;
    }
    console.log(body)
    setTimeout(function () {
      // get xfce4-min srvice container id
      request.get({
        url: service.rancher.endpoint + '/projects/1a3504/services/' + body.id
      }, function (err, httpResponse, body) {
        var parsed = JSON.parse(body);
        var xfce4Id = parsed.instanceIds[0]

        // start pulsar
        var data = {
          "instanceTriggeredStop": "stop",
          "startOnCreate": true,
          "publishAllPorts": false,
          "privileged": false,
          "stdinOpen": true,
          "tty": true,
          "readOnly": false,
          "runInit": false,
          "networkMode": "container",
          "type": "container",
          "requestedHostId": "1h5",
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
          "imageUuid": "docker:cloudwarelabs/pulsar",
          "ports": [],
          "instanceLinks": {},
          "labels": {},
          "name": serviceName + '-pulsar',
          "networkContainerId": xfce4Id,
          "command": ["pulsar"],
          "count": null,
          "createIndex": null,
          "created": null,
          "deploymentUnitUuid": null,
          "description": null,
          "externalId": null,
          "firstRunning": null,
          "healthState": null,
          "hostname": null,
          "kind": null,
          "memoryReservation": null,
          "milliCpuReservation": null,
          "removed": null,
          "startCount": null,
          "uuid": null,
          "volumeDriver": null,
          "workingDir": null,
          "user": null,
          "domainName": null,
          "memorySwap": null,
          "memory": null,
          "cpuSet": null,
          "cpuShares": null,
          "pidMode": null,
          "blkioWeight": null,
          "cgroupParent": null,
          "usernsMode": null,
          "pidsLimit": null,
          "diskQuota": null,
          "cpuCount": null,
          "cpuPercent": null,
          "ioMaximumIOps": null,
          "ioMaximumBandwidth": null,
          "cpuPeriod": null,
          "cpuQuota": null,
          "cpuSetMems": null,
          "isolation": null,
          "kernelMemory": null,
          "memorySwappiness": null,
          "shmSize": null,
          "uts": null,
          "ipcMode": null,
          "stopSignal": null,
          "oomScoreAdj": null,
          "ip": null,
          "ip6": null,
          "healthInterval": null,
          "healthTimeout": null,
          "healthRetries": null
        }

        request.post({
          url: service.rancher.endpoint + '/projects/1a3504/container',
          json: data
        })

        // start cloudware
        switch (req.body.cloudware) {
          case 'rstudio':
            data.imageUuid = "docker:daocloud.io/guodong/rstudio"
            break;
          case 'gedit':
            data.imageUuid = "docker:cloudwarelabs/xfce4-pulsar-ide-gedit"
            break;
          default:
            data.imageUuid = "docker:daocloud.io/guodong/rstudio"
            break;
        }
        data.name = serviceName + '-cloudware'
        data.command = null
        request.post({
          url: service.rancher.endpoint + '/projects/1a3504/container',
          json: data
        })
      })
    }, 2000)



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
        // create pulsar container

        setTimeout(function () {
          res.send(JSON.stringify({ws: 'ws://' + serviceName + '.ex-lab.org'}))
        }, 2000)

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