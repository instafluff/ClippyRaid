var token = "";
var tuid = "";

var twitch = window.Twitch.ext;

function setAuth(token) {
  Object.keys(requests).forEach((req) => {
      twitch.rig.log('Setting auth headers');
      requests[req].headers = { 'Authorization': 'Bearer ' + token }
  });
}

twitch.onContext(function(context) {
  twitch.rig.log(context);
});

twitch.onAuthorized(function(auth) {
  // save our credentials
  token = auth.token;
  tuid = auth.userId;

  // enable the button
  $('#cycle').removeAttr('disabled');

  setAuth(token);
});

$(function() {
    $("#copysuccess").hide();
    var clipboard = new ClipboardJS('.btn');

    clipboard.on('success', function(e) {
        console.info('Action:', e.action);
        // console.info('Text:', e.text);
        // console.info('Trigger:', e.trigger);
        e.clearSelection();
        $("#copysuccess").show();
        setTimeout(function() {
             $("#copysuccess").hide();
        }, 2000);
    });
    
    clipboard.on('error', function(e) {
        console.error("Error trying to copy message to clipboard");
        // console.error('Action:', e.action);
        // console.error('Trigger:', e.trigger);
    });
});
