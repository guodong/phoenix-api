/**
 * Created by zhangliqing on 2017/9/15.
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var service = require('./service');
var router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', router);

var port = process.env.PORT || 8080;


router.route('/instance')
  .get(function (req,res) {
    res.send(200,"test");
  }) 
  .post(function (req,res) {
    var cloudware = {'id':1,'name':'matlab','memory':5,'image':'matlab-img'}; //$cloudware = Cloudware::find($request->cloudware_id);
    var file=''; //$file = $request->file;
    var data= {
      'instanceTriggeredStop': "stop",
      'startOnCreate': true,
      'privileged': false,
      'stdinOpen': true,
      'tty': true,
      'readOnly': false,
      'type': "container",
      'imageUuid': "docker:" + cloudware.image,
      'ports': ["5678/tcp"],
      'environment': {
        'DISPLAY': '',
        'FILE': file
      },
      'labels': {
        "io.rancher.scheduler.affinity:host_label": "cloudware=true"
      },
      'command': ['startxfce4']
    };
    //if (!empty($cloudware->memory)) {
    //   $data['memory'] = $cloudware->memory * (1 << 30); // 1 << 30 = 1G
    // }

    var instance={};
    request.post({url:service.rancher.endpoint+'/projects/1a5/container',
      form:{
        'auth': [service.rancher.user,service.rancher.pass],
        'json': data
      }},function (err,httpResponse,body) {
        if(err){
          return console.error(err)
        }
        instance['rancher_container_id'] = body.id;
        instance['cloudware_id'] = cloudware.id;
        instance['memory'] = cloudware.memory;
        instance['user_id'] = body.req.user.id;
    })

    var port = null;
    var ip;
    for(var i = 0; i < 10; i++){
      setTimeout(function(){
        ip = getPrivateIp(instance.rancher_container_id);
      },1000);
      if(ip){
        break;
      }
    }

    if(ip){
      //client set
    }
    setTimeout(function () {},8000);
    instance['ws'] = 'ws://' + service.proxy.server + '/pulsar-' + instance.id;

    res.send(200,instance)
  })

router.route('/instance/:instance_id')
  .delete(function (req,res) {
    res.send('delete ' + req.params.instance_id)
  })

function getPrivateIp(rancher_container_id) {
  var url = service.rancher.endpoint+'/projects/1a5/containers/'+rancher_container_id;
  var oauth = [service.rancher.user,service.rancher.pass];
  request.get({url: url, oauth: oauth}, function (err,response,body) {
    if(err){
      return console.error(err)
    }
    if(!body.primaryIpAddress){
      return null;
    }
    return body.primaryIpAddress;
  })
}

app.listen(port);
console.log('listening on port ' + port);