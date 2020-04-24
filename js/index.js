//取消浏览器的所有事件，使得active的样式在手机上正常生效
document.addEventListener('touchstart',function(){
    return false;
},true);
// 禁止选择
document.oncontextmenu=function(){
	return false;
};
// H5 plus事件处理
var as='pop-in';// 默认窗口动画
function plusReady(){
	plus.device.setWakelock(true)
	// 隐藏滚动条
	plus.webview.currentWebview().setStyle({scrollIndicator:'none'});
	// Android处理返回键
	plus.key.addEventListener('backbutton',function(){
		('iOS'==plus.os.name)?plus.nativeUI.confirm('确认退出？', function(e){
			if(e.index>0){
				plus.runtime.quit();
			}
		}, '智恒达', ['取消','确定']):(confirm('确认退出？')&&plus.runtime.quit());
	},false);
	compatibleAdjust();
}
if(window.plus){
	plusReady();
}else{
	document.addEventListener('plusready',plusReady,false);
}
document.addEventListener("resume", recReady, false);
// DOMContentLoaded事件处理
var _domReady=false;

var urlApi = 'http://fin-notice.xingyun361.com'
//var urlApi = 'http://172.16.120.235:8008'

document.addEventListener('DOMContentLoaded',function(){
	plus.device.setWakelock(true)
	_domReady=true;
	compatibleAdjust();
	var time = new Date().getTime()
	document.getElementById('content').setAttribute('data-time', time)
	ready();
	smsReady();
//	setInterval(recReady, 60000);
//	setInterval(() => {
//		Ajax.post(urlApi+'/testpost', JSON.stringify({username: '保持通讯'}), function(res){
//			var resData = JSON.parse(res)
//		})
//	}, 10000)
},false);
function recReady(){
	console.log('----recReady---time:' + document.getElementById('content').getAttribute('data-time'))
	ready(document.getElementById('content').getAttribute('data-time'))
}
// 兼容性样式调整
var _adjust=false;
function compatibleAdjust(){
	if(_adjust||!window.plus||!_domReady){
		return;
	}
	_adjust=true;
	// 预创建二级窗口
//	preateWebviews();
	// 关闭启动界面
	plus.navigator.setStatusBarBackground('#D74B28');
	setTimeout(function(){
		plus.navigator.closeSplashscreen();
	},200);
}


// H5 plus事件处理
//SmsInfo存放一条短信的各项内容
var SmsInfo = {}
//Sms存放所有短信
var Sms = {}
function smsReady(){
	// 监听短信 
	plus.messaging.listenMessage(function(msg){
		console.log('--------listenMessage');
		plus.device.setWakelock(true);
		var content = msg.body;
		if (regContent(content)) {
			ready(document.getElementById('content').getAttribute('data-time'));
			setTimeout(recReady, 10000);
		}
	}, function(e){
		console.log('监听短信失败: '+JSON.stringify(e));
	});
}


function ready(time){
	console.log('--------ready');
	if (!time) {
		time = new Date().getTime();
	}
	console.log('newTime:' + new Date());
	var activity = plus.android.runtimeMainActivity();
	var Cursor = plus.android.importClass("android.database.Cursor");
	var Uri = plus.android.importClass("android.net.Uri");
	var uri = Uri.parse("content://sms/inbox");
	var projection=new Array("_id","address","person","body","date","type","read");
	var cusor = activity.managedQuery(uri,projection,null,null,"date desc");
	if(cusor != null){
		console.log('--cusor');
		cusor.moveToFirst();
		var idColumn = cusor.getColumnIndex("_id");	
		var nameColumn = cusor.getColumnIndex("person");
		var phoneNumberColumn = cusor.getColumnIndex("address");
		var smsbodyColumn = cusor.getColumnIndex("body");
		var dateColumn = cusor.getColumnIndex("date");
		var readColumn = cusor.getColumnIndex("read");
		var typeColumn = cusor.getColumnIndex("type");
		document.getElementById('content').setAttribute('data-time', cusor.getLong(dateColumn));
		var cusorIdx=0;
		var html = '';
		while(cusorIdx<10){
//		SmsInfo.id = cusor.getString(idColumn);
//		SmsInfo.Name = cusor.getInt(nameColumn);
//		SmsInfo.PhoneNumber = cusor.getString(phoneNumberColumn);
			SmsInfo.Type = cusor.getString(typeColumn);
			SmsInfo.Read = cusor.getString(readColumn);
			SmsInfo.Date = cusor.getLong(dateColumn);
			SmsInfo.Date = getFormatDate(SmsInfo.Date);
			SmsInfo.Smsbody = cusor.getString(smsbodyColumn);
			if (regContent(SmsInfo.Smsbody)) {
				var SmsInfoTime = new Date(SmsInfo.Date).getTime();
//				document.getElementById('content').setAttribute('data-time', SmsInfoTime);
				if (SmsInfoTime > time) {
					var content = SmsInfo.Smsbody;
					Ajax.post(urlApi + '/qq/sendmsg', JSON.stringify({msginfo: content}), function(res){						
						var resData = JSON.parse(res);
					})
				}
				html+='<li class="sms-list"><div class="sms-date">'+SmsInfo.Date
				+'</div><span class="sms-content">'+SmsInfo.Smsbody+'</span></li>';
			}
			cusorIdx++;
			cusor.moveToNext();
		}
		document.getElementById('plist').innerHTML = html;
//		cusor.close() //关闭
	} else {
		console.log('---------------------error')
		console.log('cusor:' + cusor)
//		plus.runtime().restart()		
	}
}


function regContent (content) {
	var reg_jn = 
		content.indexOf('江南银行')!=-1 && 
		content.indexOf('转入')!=-1 && 
		(content.indexOf('*1660') != -1 || content.indexOf('*1679') != -1) && 
		content.indexOf('江苏智恒达型云网络科技有限公司') === -1 && 
		content.indexOf('常州同城江苏岳洋通金属加工有限公司') === -1 &&
		content.indexOf('常州同城江苏智恒达机械科技有限公司') === -1 &&
		content.indexOf('江苏智恒达机械科技有限公司') === -1;
	var reg_hx = content.indexOf('华夏银行')!=-1 && content.indexOf('收入')!=-1 && (content.indexOf('账户0863') != -1 || content.indexOf('账户1963') != -1);
	var reg_nh = content.indexOf('中国农业银行')!=-1 && content.indexOf('人民币-') == -1 && content.indexOf('理财赎回') == -1 && content.indexOf('现存交易') == -1 && content.indexOf('尾号0173') != -1;
	if (reg_jn || reg_hx || reg_nh) {
		return true
	} else {
		console.log('短信格式不匹配')
	}
}


//扩展Date功能：将long型日期转换为特定的格式
Date.prototype.format = function (format) {
   var o = {
       "M+": this.getMonth() + 1,
       "d+": this.getDate(),
       "h+": this.getHours(),
       "m+": this.getMinutes(),
       "s+": this.getSeconds(),
       "q+": Math.floor((this.getMonth() + 3) / 3),
       "S": this.getMilliseconds()
   }
   if (/(y+)/.test(format)) {
       format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
   }
   for (var k in o) {
       if (new RegExp("(" + k + ")").test(format)) {
           format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
       }
   }
   return format;
}


//将long型日期转换为特定格式
function getFormatDate(l, pattern) {
	date = new Date(l);
	   if (pattern == undefined) {
	       pattern = "yyyy-MM-dd hh:mm:ss";
	   }
	return date.format(pattern);
}


var Ajax={
  get: function(url, fn) {       
    var xhr = new XMLHttpRequest();            
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {      
      if (xhr.readyState == 4 && xhr.status == 200 || xhr.status == 304) {     
        fn.call(this, xhr.responseText);  
      }
    };
    xhr.send();
  },
  post: function (url, data, fn) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");    
	  xhr.onreadystatechange = function() {
	    if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
	      fn.call(this, xhr.responseText);
	    }
	    console.log(xhr.responseText)
	  };
	  console.log('-----send')
	  xhr.send(data);
	  console.log('-----end')
	  console.log(data)
  }
}