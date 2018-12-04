var twitch = window.Twitch.ext;

var userAuth = {
  channelId: "", // Channel ID of the page where the extension is iframe embedded
  clientId: "", // Client ID of the extension
  token: null, // JWT that should be passed to any EBS call for authentication.
  userId: "" // Opaque user ID (a globally unique ID that isn't the user's actual twitch ID)
             //    this will be called again with the actual Twitch ID after calling twitch.actions.requestIdShare()
};
var channelInfo = {};

twitch.onAuthorized(function(auth) {
  // This callback is fired each time the JWT is refreshed.
  userAuth = auth;
  console.log( "The JWT that will be passed to the EBS is", auth.token );
  console.log( "The channel ID is", auth.channelId );
  // WARNING: logging this object is not recommended in production
  // console.log( "UserAuth:", userAuth );

  // Retrieve info about the stream
  if( userAuth[ "clientId" ] ) {
    $.ajax({
      url: "https://api.twitch.tv/helix/users?id=" + userAuth[ "channelId" ],
      type: "GET",
      headers: {
        "Client-ID": userAuth[ "clientId" ]
      },
      success: function( result ) {
        if( result[ "data" ].length > 0 ) {
          channelInfo = result[ "data" ][ 0 ];
          console.log( "Channel:", channelInfo );
        }
      }
    });
  }

  $("#save-config").click(function () {
    console.log( "Saving Config!");
    setChannelConfig("0.0.1", JSON.stringify({
      message: DOMPurify.sanitize( $("#msg").val() ),
      submessage: DOMPurify.sanitize( $("#submsg").val() )
    }));
    $("#clippy_savesuccess").show();
    setTimeout(function() {
      $("#clippy_savesuccess").hide();
    }, 2000);
  });

  $("#clippy_savesuccess").hide();
  $("#clippy_copysuccess").hide();
  var clipboard = new ClipboardJS('.myButton');

  clipboard.on('success', function(e) {
      console.info('Action:', e.action);
      // console.info('Text:', e.text);
      // console.info('Trigger:', e.trigger);
      e.clearSelection();
      $("#clippy_copysuccess").show();
      setTimeout(function() {
           $("#clippy_copysuccess").hide();
      }, 2000);
  });

  clipboard.on('error', function(e) {
      console.error("Error trying to copy message to clipboard");
      // console.error('Action:', e.action);
      // console.error('Trigger:', e.trigger);
  });

  // Calls to your custom server can use the JWT token like this:
  // var EBSPath = "/YourServerURL"; // URL Endpoint to your custom "Extension Backend Service" if you set up your own backend server
  // $.ajax({
  //   url: EBSPath,
  //   type: 'GET',
  //   headers: {
  //     'x-extension-jwt': auth.token,
  //   }
  // });
});

var userContext = {
  arePlayerControlsVisible: false, // If true, player controls are visible (e.g., due to mouseover).
  bitrate: 0, // Bitrate of the broadcast.
  bufferSize: 0, // Buffer size of the broadcast.
  displayResolution: "", // Display size of the player.
  game: "", // Game being broadcast.
  hlsLatencyBroadcaster: 0, // Number of seconds of latency between the broadcaster and viewer.
  hostingInfo: { hostedChannelId: 0, hostingChannelId: 0 }, // Information about the current channel’s hosting status, or undefined if the channel is not currently hosting.
  isFullScreen: false, // If true, the viewer is watching in fullscreen mode.
  isMuted: false, // If true, the viewer has muted the stream.
  isPaused: false, // If true, the viewer has paused the stream.
  isTheatreMode: false, // If true, the viewer is watching in theater mode.
  language: "en", // Language of the broadcast (e.g., "en").
  mode: "viewer", // Valid Mode Values:
                  //    - viewer (viewer page, such as the Twitch channel page)
                  //    - dashboard (opened in Twitch dashboard page)
                  //    - config (opened in extension config page)
  playbackMode: "video", // video, audio, remote (e.g. Chromecast), chat-only
  theme: "light", // light / dark
  videoResolution: "", // Resolution of the broadcast.
  volume: 1, // Currently selected player volume between 0 and 1
};

twitch.onContext(function(context, props) {
  // "props" contains an array of strings naming the context properties that were changed.
  userContext = context;
  // console.log( "Context:", userContext );
  if( userContext.theme == "dark" ) {
    $("body").css("color", "white");
  }
  else {
    $("body").css("color", "black");
  }

  if( userContext.arePlayerControlsVisible ) {
    // $("#clippy").show();
    $("#clippy_component").fadeIn(500);
  }
  else {
    // $("#clippy").hide();
    $("#clippy_component").fadeOut(500);
  }
});

twitch.onError(function(error) {
  console.error( "Extension Error:", error );
});

twitch.onHighlightChanged(function(isHighlighted) {
  console.log( "Extension hover highlight:", isHighlighted );
  // TODO: Implement this!
});

twitch.onPositionChanged(function(position) {
  console.log( "Extension position in % from the top-left:", position.x / 100.0, position.y  / 100.0 );
});

// Required and only applies to for Mobile extensions
twitch.onVisibilityChanged(function(isVisible, context) {
  console.log( "Extension visibility:", isVisible );
});

// --- Available Actions ---
// twitch.actions.requestIdShare(); // opens a prompt for users to share their identity
// twitch.actions.minimize(); // causes your video-component or video-overlay extension to be minimized
// twitch.actions.onFollow(function(didFollow, channelName) {
//
// }); // invoked whenever a user completes an interaction prompted by the followChannel action
// twitch.actions.followChannel("ChannelName"); // prompts users to follow the specified channel, with a dialog controlled by Twitch



const environment = twitch.environment;
const version = twitch.version;
console.log( "Environment:", environment );
console.log( "Version:", version );

// --- Twitch Ext Configurations ---
// Configurations in format: {version: string, content: string}|undefined
const configGlobal = twitch.configuration[ "global" ];
const configDev = twitch.configuration[ "developer" ];
const configChannel = twitch.configuration[ "broadcaster" ];
twitch.configuration.onChanged( function() {
  // Called when Ext Configuration is updated
  console.log( "Configuration Updated" );
  try {
    let config = twitch.configuration.broadcaster ?
      JSON.parse(twitch.configuration.broadcaster.content) : {};
    console.log( config );
    if( !config["message"] ) {
      $("#clippy_raid").hide();
    }
    if( !config["submessage"] ) {
      $("#clippy_subraid").hide();
    }
    $("#msg").val( DOMPurify.sanitize( config["message"] || "" ) );
    $("#submsg").val( DOMPurify.sanitize( config["submessage"] || "" ) );
    $("#clippy_raid").attr( "data-clipboard-text", DOMPurify.sanitize( config["message"] || "" ) );
    $("#clippy_subraid").attr( "data-clipboard-text", DOMPurify.sanitize( config["submessage"] || "" ) );
  }
  catch( e ) {
    console.log( "no config" );
  }
});
console.log( "Global Config:", configGlobal );
console.log( "Developer Config:", configDev );
console.log( "Channel Config:", configChannel );

// "version" - 1.1.1 semantic string
// "content" - string-encoded configuration
function setChannelConfig( version, content ) {
  console.log( "Updating Configuration:", version, content );
  twitch.configuration.set(
    "broadcaster", // This is the only valid value
    version,
    content
  );
}



// --- Twitch Ext Feature Flags ---
const isChatEnabled = twitch.features.isChatEnabled;
twitch.features.onChanged( function( changed ) {
  // Called when Ext Features is changed
  // "changed" is a string-array of feature flags
});
console.log( "isChatEnabled:", isChatEnabled );




// twitch.bits - Bits in Ext
