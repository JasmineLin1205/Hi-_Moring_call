var aio_n = "xuan_bear";
var aio_k = "aio_lOoJ871R07grgdexMDfliWqEax7e";
var line_t = "OJI1KfSW6FnvORBbiR6+irFaD0ezUbNj3euc/8lp+2Yxddc9VlkCk3TCf6veWZ1Umv3Mmw+M8BUOOO8upJZA6W6GHUUUz3LYYQ6X1H+4H325Bt+OMsqUWqwZrCzVBukZfC6RBckoFCS1/oshCcf/PQdB04t89/1O/w1cDnyilFU=";

var aio_d = 'voice';

var keyWords = {
  '起床': 100,
  '叫醒服務': 100,
  '關系統': 0,
  '關閉': 0,
};

function postToAIO(v) {
  var url = 'https://io.adafruit.com/api/v2/' + aio_n + '/feeds/' + aio_d + '/data';
  response = UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-AIO-Key': aio_k
    },
    'method': 'post',
    'payload': JSON.stringify({
      'value': v,
    }),
  });
  json_response = JSON.parse(response);
  return json_response;
}

function doGet(e) {
  var returnText;
  var val = e.parameter.val;
  if (val) {
    var r = postToAIO(val);
    if (r.value) {
      returnText = r.value + " OK\n";
    } else {
      returnText = "Error: post value\n";
    }
  }
  var textOutput = ContentService.createTextOutput(returnText);
  return textOutput;
}

function doPost(e) {
  var msg = JSON.parse(e.postData.contents);

  // 取出 replayToken 和使用者送出的訊息文字
  var replyToken = msg.events[0].replyToken;
  var userMessage = msg.events[0].message.text;

  if (typeof replyToken === 'undefined') {
    return;
  }

  var returnText;
  var hasKeyword = false;
  var val;

  if (userMessage) {
    for (var k in keyWords) {
      if (userMessage.indexOf(k) !== -1) {
        hasKeyword = true;
        val = keyWords[k];
        postToAIO(val); // 確保找到關鍵字時立即傳送到 Adafruit IO
        break;
      }
    }
  }

  if (hasKeyword) {
    if (userMessage === '叫醒服務' || userMessage === '起床') {
      var weatherData = getWeatherData();
      var weatherMsg = formatWeatherMessage(weatherData);
      returnText = weatherMsg;
    } else {
      returnText = "已傳送指令";
    }
  } else {
    returnText = getMisunderstandWords();
  }

  // 在這裡加上對 Line 的回覆
  replyToLine(replyToken, returnText);
}

function replyToLine(replyToken, message) {
  var url = 'https://api.line.me/v2/bot/message/reply';
  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + line_t.trim(),
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': message,
      }],
    }),
  });
}


function getMisunderstandWords() {
  var _misunderstandWords = [
    "不好意思，我無法理解您的需求",
    "再說明白一點好嗎？我只是一個不太懂事的 baby 機器人",
    "我不懂您的意思，抱歉我會加強訓練的"
  ];

  if (typeof misunderstandWords === 'undefined') {
    var misunderstandWords = _misunderstandWords;
  } else {
    misunderstandWords = misunderstandWords.concat(_misunderstandWords);
  }

  return misunderstandWords[Math.floor(Math.random() * misunderstandWords.length)];
}

function getWeatherData() {
  var apiKey = 'CWA-884A1047-B895-4D88-ABC0-48659775C05F';
  var apiUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=' + apiKey + '&locationName=桃園市';
  var response = UrlFetchApp.fetch(apiUrl);
  var weatherData = JSON.parse(response.getContentText());
  return weatherData;
}

function formatWeatherMessage(weatherData) {
  var location = weatherData.records.location[0];
  var weatherElements = location.weatherElement;

  var minTempData = findElement(weatherElements, 'MinT');
  var maxTempData = findElement(weatherElements, 'MaxT');
  var rainProbData = findElement(weatherElements, 'PoP');

  if (minTempData && maxTempData && rainProbData) {
    var minTemp = minTempData.time[0].parameter.parameterName;
    var maxTemp = maxTempData.time[0].parameter.parameterName;
    var rainProb = rainProbData.time[0].parameter.parameterName;

    var currentDateTime = new Date();
    var taipeiCurrentTime = Utilities.formatDate(currentDateTime, 'Asia/Taipei', 'HH:mm');


    return '起床囉~~  懶豬!!!\n現在都 ' + taipeiCurrentTime + ' 了!!!  想遲到被扣錢嘛!!!\n今日天氣 : 晴時多雲\n今日溫度 : ' + minTemp + ' ~ ' + maxTemp + '°C\n降雨機率 : ' + rainProb + '%';
  }

  return '找不到天氣資訊';
}

function findElement(elements, elementName) {
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].elementName === elementName) {
      return elements[i];
    }
  }
  return null;
}