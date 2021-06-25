const {getCurrentWindow} = require('electron').remote;
const fs = require('fs');
let miningStats, workerStats, payoutStats;
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
      // interval = setInterval(function() { reload(); }, 60000);
    } else {
      clearInterval(interval);
    }

  }, 500));

  if (miningComplete && workersComplete && payoutComplete) {
    $('.loading').hide();
  }
});

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

    $('#content_wrapper #currencyRates').children().each(function() {
      property = miningStats[this.id];

      property = (property * 60 * 24).toFixed(6);
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

        if (dateToday == 28) {
          payoutMessage = "~ pay today ~";
        } else if (dateToday > 28) {
          payoutMessage = parseFloat(new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()) - parseFloat(dateToday) + 28;
        } else {
          payoutMessage = 28 - parseFloat(dateToday);
        }

        $(this).find(".loading").remove();
        $(this).find("span").append(payoutMessage);
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
