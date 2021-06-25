let pillIndex = 0;
let loadDelay = 10;
let unloadDelay = 25;

$(window).on('load', function() {

  $('#big-close-btn').hover(function() {
    $('.grill-wrapper').children(".pill").each(function(index) {
      setTimeout(function() {
        $('.grill-wrapper .pill').eq(index).css({"background": "#d8623e"});
        pillIndex = index;
        console.log("pillIndex: " + pillIndex);
      }, loadDelay * index);
    });

  }, function() {
    $('.grill-wrapper .pill').css({"background": "#3892c2"});
    for (let i = pillIndex; i > -1; i--) {
      console.log("i: " + i);
      setTimeout(function() {
        $('.grill-wrapper .pill').eq(pillIndex).css({"background": "#8921af"});
        pillIndex--;
      }, unloadDelay * i);
    }
  });

});
