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

var verifyToken = function (req,res,next) {
  if(req.headers.secret != 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE1MDU4MTM0NTd9.Ftw1yHeUrqdNvymFZcIpuEoS0RHBFZqu4MfUZON9Zm0'){
    res.send(401,'Authentication failed.');
    return;
  }
  next();
}


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', router);
router.use(verifyToken);

//生成token  var token = jwt.sign({ foo: 'bar' }, 'shhhguanshanhh');
// 初始时插入cloudware
// var busybox = new Models.Cloudware({name:'busybox',logo:'https://www.busybox.net/images/busybox1.png',description:'BusyBox combines tiny versions of many common UNIX utilities into a single small executable.',image:'busybox',memory:2,timestamp:new Date()});
// busybox.save(function (err,busybox) {
//   if (err)
//     return console.error(err);
//   else
//     console.log('insert successfully!');
// })

router.route('/instance')
  .get(function (req,res) {
    Models.Instance.find({user_id: req.headers.user_id},function (err,instances) {
      if(err){
        res.send(500,'Database error.')
        return console.error(err);
      }
      res.send(200,instances);
    });
  }) 
  .post(function (req,res) {
    Models.Cloudware.find({_id:req.body.cloudware_id},function (err,cloudwareArray) {
      if(err){
        res.send(404,'Cloudware not found.');
        return;
      }
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
      instance['user_id'] = req.body.user_id;
      request.post({url:service.rancher.endpoint+'/projects/1a3504/container', json: data},function (err,httpResponse,body) {
        if(err){
          res.send(500,'post to rancher error.')
          return;
        }
        instance.rancher_container_id = body.id;
        instance.cloudware_id = cloudware._id;
        instance.memory = cloudware.memory;
      });

      var ip,count=0;
      var getPrip=function () {
        if(count++ == 10){
          res.send(500,'Get private ip error.');
          return;
        }
        setTimeout(function(){
          ip = getPrivateIp(instance.rancher_container_id);
          if(!ip){
            getPrip()
          }else {
            instance.ws = 'ws://' + service.proxy.server + '/pulsar-' + instance.id;
            instance.save(function (err,instance) {
              if (err){
                res.send(500,'Instance save to database error.')
                return;
              }
              res.send(201,'Instance created success.');
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
    Models.Instance.find({_id:req.params.instance_id},function (err,instanceArray) {
      if(err){
        res.send(404,'Instance not found')
        return
      }
      var instance = instanceArray.pop();
      request.del({url:service.rancher.endpoint+'/projects/1a3504/containers/'+instance.rancher_container_id},function (err,httpResponse,body) {
        if(err){
          res.send(500,'Internal error.');
          return;
        }
        body_j = JSON.parse(body);
        if(body_j.id == instance.rancher_container_id){
          Models.Instance.remove({_id: req.params.instance_id},function (err) {
            if(err){
              res.send(500,'Database internal error.')
              return;
            }
            return res.send(204,'Delete success.');
          });
        }else {
          console.log(body_j.id);
          console.log(instance.rancher_container_id);
          res.send(500,'Internal error.')
          return;
        }

      });
    });
  })

function getPrivateIp(rancher_container_id) {
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