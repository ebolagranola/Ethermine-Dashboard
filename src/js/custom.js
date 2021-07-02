const {getCurrentWindow} = require('electron').remote;
const fs = require('fs');
let poolStats, miningStats, workerStats, payoutStats;
var miningComplete = workersComplete = payoutComplete = false;
// let fileURL = './src/assets/walletAddress.txt';
let fileURL = './resources/app/src/assets/walletAddress.txt';
let address = null;
let interval;

function reload() {
  getCurrentWindow().reload();
}

function run(address) {
  getMiningStats(address);
  getWorkerStats(address);
  getPayoutStats(address);
  cycleUnits('.units');
  cycleUnits('#unpaid');

  interval = setInterval(function() { reload(); }, 60000);
}

$(window).on('load', function() {
  fs.readFile(fileURL, (error, text) => {
    if (error) throw error;
    address = text.toString();
    $('#walletAddress input').val(address);
    run(address);
  });

  $('#walletAddress input').keyup(delay(function (e) {
    address = this.value;
    if (address.length == 42) {
      fs.writeFile(fileURL, address, (error) => {
        if (error) throw error;
      });
      reload();
    } else {
      clearInterval(interval);
    }
  }, 500));

  if (miningComplete && workersComplete && payoutComplete) {
    $('.loading').hide();
  }
});

// ***************************************************************************

function getPoolStats() {
  $.ajax({
    'url': 'https://api.ethermine.org/poolStats',
    'type': 'GET',
    'dataType': 'json',
    'success': function(response) {
      poolStats = response.data;
    }
  }).done(function() {
    populatePoolStats();
  });
}

function getMiningStats(address) {
  $.ajax({
    'url': 'https://api.ethermine.org/miner/' + address + '/currentStats',
    'type': 'GET',
    'dataType': 'json',
    'success': function(response) {
      miningStats = response.data;
    }
  }).done(function() {
    populateMiningStats();
    getPoolStats();
  });
}

function getWorkerStats(address) {
  $.ajax({
    'url': 'https://api.ethermine.org/miner/' + address + '/workers',
    'type': 'GET',
    'dataType': 'json',
    'success': function(response) {
      workerStats = response.data;
    }
  }).done(function() {
    populateWorkerStats();
  });
}

function getPayoutStats(address) {
  $.ajax({
    'url': 'https://api.ethermine.org/miner/' + address + '/payouts',
    'type': 'GET',
    'dataType': 'json',
    'success': function(response) {
      payoutStats = response.data;
    }
  }).done(function() {
    populatePayoutStats();
  });
}

// ***************************************************************************
function populatePoolStats() {
  let unit = $("#unpaid").children();
  let temp = poolStats.price[String(unit[0].className)];
  for (let i = 1; i < unit.length; i++) {
    if (unit[i].className == "usd") {
      temp = parseFloat(poolStats.price[String(unit[i].className)]) * parseFloat(unit[i].children[1].innerHTML);
      temp = parseFloat(temp).toFixed(2);
    } else if (unit[i].className == "btc") {
      temp = (parseFloat(poolStats.price[String(unit[i].className)]) * parseFloat(unit[i].children[1].innerHTML)).toFixed(6);
    } else {
      temp = poolStats.price[String(unit[i].className)];
    }
    unit[i].children[1].innerHTML = temp;
  }
}

let currID, property, payoutMessage;
let date, dateToday;

function populateMiningStats() {
  if (miningStats) {
    $('#content_wrapper #hashRates').children().each(function() {
      property = miningStats[this.id];

      property = convert2MH(property);
      $(this).find(".loading").remove();
      $(this).find("span").append(property);
    });

    $('#content_wrapper #currencyRates .units').children().each(function() {
      property = miningStats[this.id];
      if (this.id == "usdPerMin") {
        property = (property * 60 * 24).toFixed(2);
      } else {
        property = (property * 60 * 24).toFixed(6);
      }
      $(this).find(".loading").remove();
      $(this).find("span").append(property);
    });

    $('#unpaid').find(".loading").remove();
    $('#unpaid span').append((miningStats["unpaid"] / Math.pow(10, 18)).toFixed(6));

    miningComplete = true;
  } else {
    clearInterval(interval);
  }
}

function populateWorkerStats() {
  if (workerStats) {
    for (let i = 0; i < workerStats.length; i++) {
      $('#workers table').append("<tr><td>"+workerStats[i].worker+"</td><td>"+convert2MH(workerStats[i].currentHashrate)+"</td><td>"+convert2MH(workerStats[i].reportedHashrate)+"</td></tr>");
    }

    workersComplete = true;
  } else {
    clearInterval(interval);
  }
}

function populatePayoutStats() {
  if (payoutStats) {
    $('#payouts').children().each(function(i) {

      if (this.id.length != 0) {
        property = payoutStats[i];
        property = property[this.id];

        property *= 1000;
        $(this).find(".loading").remove();
        $(this).find("span").append(new Date(property));
      } else {
        date = new Date();
        dateToday = date.getDate();

        $(this).find(".loading").remove();
        if (dateToday == 28) {
          payoutMessage = "<span style='font-size: 48px;'>today</span>";
          $(this).find("#nextPayoutContent").html(payoutMessage);
        } else if (dateToday > 28) {
          payoutMessage = parseFloat(new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()) - parseFloat(dateToday) + 28;
          $(this).find("span").append(payoutMessage);
        } else {
          payoutMessage = 28 - parseFloat(dateToday);
          $(this).find("span").append(payoutMessage);
        }

      }
    });

    payoutComplete = true;
  } else {
    clearInterval(interval);
  }
}

// ***************************************************************************

let decimalIndex, cleansedInput;

function convert2MH(hashRate) {
  hashRate = hashRate.toString();
  if (hashRate.indexOf(".") > -1) {
    decimalIndex = hashRate.indexOf(".");
    hashRate = hashRate.substr(0, decimalIndex) + hashRate.substr(decimalIndex + 1, hashRate.length);
    cleansedInput = hashRate.substr(0, decimalIndex - 6) + "." + hashRate.substr(decimalIndex - 6, hashRate.length);
  } else {
    cleansedInput = hashRate.substr(0, hashRate.length - 6) + "." + hashRate.substr(hashRate.length - 6, hashRate.length);
  }

  return parseFloat(cleansedInput).toFixed(2);
}

function cycleUnits(el) {
  let lastUnit = 0;
  let unitCount = 1;
  let unit = $(el).children();

  $(el).click(function() {
    $(this).children().eq(lastUnit).hide();
    $(this).children().eq(unitCount).show();
    lastUnit = unitCount;
    if (((unitCount + 1) % unit.length) == 0) {
      unitCount = 0;
    } else {
      unitCount++;
    }
  });
}

// ***************************************************************************
