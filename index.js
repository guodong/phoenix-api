/**
 * Created by zhangliqing on 2017/9/15.
 */
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var rp = require('request-promise');
var service = require('./service.local');
var Models = require('./database');
var jwt = require('jsonwebtoken');



var app = express();
var router = express.Router();
var port = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', router);

//生成token  var token = jwt.sign({ foo: 'bar' }, 'shhhguanshanhh');//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MDU4MTM0NTd9.Ftw1yHeUrqdNvymFZcIpuEoS0RHBFZqu4MfUZON9Zm0
var verifyToken = function (token,res) {
  jwt.verify(token, 'shhhguanshanhh', function(err, decoded) {
    if(err){
      res.send(401,'no authorization');
      return;
    }
  });
}


// 初始时插入cloudware
// var busybox = new Models.Cloudware({name:'busybox',logo:'https://www.busybox.net/images/busybox1.png',description:'BusyBox combines tiny versions of many common UNIX utilities into a single small executable.',image:'busybox',memory:2,timestamp:new Date()});
// busybox.save(function (err,busybox) {
//   if (err)
//     return console.error(err);
//   else
//     console.log('insert successfully!');
// })

router.route('/instance')
  .get(function (req,res) {//当前用户云件实例列表
    Models.Instance.find({user_id: "3"},function (err,instances) {
      if(err){
        res.send(500,'Get instance list error.')
        return console.error(err);
      }
      res.send(200,instances);
    })
  }) 
  .post(function (req,res) {
    Models.Cloudware.find({_id:'59c08ef624c407a7b33eb589'},function (err,cloudwareArray) {//$cloudware = Cloudware::find($request->cloudware_id);  由id找cloudware
      if(err) return console.error(err);
      var cloudware = cloudwareArray.pop();
      var data= {
        instanceTriggeredStop: "stop",
        startOnCreate: true,
        privileged: false,
        stdinOpen: true,
        tty: true,
        readOnly: false,
        type: "container",
        imageUuid: "docker:" + cloudware.image,
        ports: ["5678/tcp"],
        environment: {
          DISPLAY: '',
          FILE: '' //$file = $request->file;   ？？？？
        },
        labels: {
          "io.rancher.scheduler.affinity:host_label": "cloudware=true"
        },
        command: ['sh']
      };
      if(cloudware.memory != null) data.memory=cloudware.memory*(1<<30)

      var instance=new Models.Instance();
      request.post({url:service.rancher.endpoint+'/projects/1a3504/container',
        json: data
      },function (err,httpResponse,body) {
        if(err){
          res.send(500,'post to '+service.rancher.endpoint+'/projects/1a3504/container error.')
          return console.error(err)
        }
        instance.rancher_container_id = body.id;
        instance.cloudware_id = cloudware._id;
        instance.memory = cloudware.memory;
        //instance['user_id'] = body.req.user.id;
      })

      var ip,count=0;
      var getPrip=function () {
        if(count++ == 10){
          res.send(500,'Get private ip error.');
          return;
        }
        setTimeout(function(){
          ip = getPrivateIp(instance.rancher_container_id);
          if(!ip){
            console.log('ip '+ip);
            getPrip()
          }else {
            instance.ws = 'ws://' + service.proxy.server + '/pulsar-' + instance.id;
            instance.save(function (err,instance) {
              if (err){
                res.send(500,'Instance save to db error.')
                return console.error(err);
              }
              res.send(200,instance);
            })
            return;
          }
        },1000);
        return;
      }
      getPrip();
    })
  })

router.route('/instance/:instance_id')
  .delete(function (req,res) {
    Models.Instance.remove({rancher_container_id: req.params.instance_id},function (err) {
      if(err){
        res.send(500,'Remove instance error.')
        return console.log(err);
      }
      return res.send(200,'Delete success.');
    })
  })

function getPrivateIp(rancher_container_id) {
  console.log('rancher_container_id '+rancher_container_id);
  var options = {
    uri: service.rancher.endpoint+'/projects/1a3504/containers/'+rancher_container_id,
    //oauth: [service.rancher.user,service.rancher.pass],
    json:true
  }
  return rp(options)
    .then(function (res) {
      if(!res.primaryIpAddress){
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