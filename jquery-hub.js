/*global OpenAjax*/
// probably shouldn't be plugin  https://github.com/cowboy/talks/blob/master/jquery-plugin-authoring.js
(function ( $ ) {
    var hubOptions = {},
        readylist = null;

    $.hub = function( options ) {
        if ( options.ready === false ) {
            readylist = $._Deferred();
            hubOptions.ready = false;
        }
        if ( options.ready ) {
            if ( readylist ) {
                readylist.resolve();
            }
        }
        if ( options.debug ) {
            hubOptions.debug = ( options.debug === true );
        }
        return hubOptions;
    };

    // exposed for automated testing purposes
    $.hub._reset = function() {
        hubOptions.ready = true;
        hubOptions.debug = false;
        hubOptions.stringify = true;
        readylist = null;
        if ( OpenAjax.hub.reinit ) {
            OpenAjax.hub.reinit();
        }
    };

    $.hub.subscribe = function( channel, callback, scope, subscriberData, filter ) {
        var callbackProxy = callback,
            filterProxy = filter;

        if (scope) {
            callbackProxy = $.proxy( callback, scope );
        }
        if ( filter && hubOptions.stringify ) {
            filterProxy = function ( channel, message ) {
                return filter( channel, JSON.parse( message ) );
            };
        }
        return OpenAjax.hub.subscribe( channel /*name*/,
            function ( channel, message ) { callbackProxy( channel, ( hubOptions.stringify ? JSON.parse( message ) : message ) ); },
            null,  /* null scope because of $.proxy */
            subscriberData,
            filterProxy );
    };

    var _publish = function( channel, message ) {
        try {
            if ( hubOptions.stringify ) {
                message = JSON.stringify( message );
            }
            OpenAjax.hub.publish( channel /*name*/, message /*data*/ );
        } catch ( e ) {
            if ( hubOptions.debug ) {
                debugger;
            }
        }
    };
    $.hub.publish = function( channel, message ) {
        if ( readylist ) {
            readylist.done(function () {
                _publish( channel, message );
            });
        } else {
            _publish( channel, message );
        }
    };

    $.hub.unsubscribe = function( subscription ) {
        OpenAjax.hub.unsubscribe( subscription );
    };

    $.hub.message = function( body, options ) {
        var message = {},
            messageOptions = options || {};

        message.body = body;
        message.timestamp = ( new Date() ).getTime();
        message.messageId = $.hub.guid();
        message.formatVersion = messageOptions.formatVersion || "0";

        return message;
    };

    $.hub.createVersionFilter = function( version ) {
        var major, minor; 
        
        version = /(\d+)\.?(\d+)?\.?(\d+)?/.exec( version );
        major = parseInt( version[ 1 ] ) || 0;
        minor = parseInt( version[ 2 ] ) || 0;

        var filter = function( channel, message ) {
            var messageVersion = /(\d+)\.?(\d+)?\.?(\d+)?/.exec( ( message ? message.formatVersion : "" ) ),
                messageMajor = parseInt( messageVersion[ 1 ], 10 ) || 0,
                messageMinor = parseInt( messageVersion[ 2 ], 10 ) || 0;
            return ( major === messageMajor && ( minor ? minor === messageMinor : true ) );
        };

        return filter;
    };

    $.hub.guid = function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function ( c ) {
            var r = Math.random() * 16 | 0,
                v = (c === "x" ? r : (r & 0x3 | 0x8));

            return v.toString( 16 );
        });
    };

    $.hub.reply = function( message, replyMessage ) {
        if ( message.replyTo ) {
            replyMessage.correlationId = message.messageId;
            $.hub.publish( message.replyTo, replyMessage );
        }
    };

    $.hub.requestReply = function( channel, message, replyChannel, callback ) {
        var subscription = $.hub.subscribe( replyChannel, function( channel, message ) {
            callback( channel, message );
            $.hub.unsubscribe( subscription );
        });

        message.replyTo = replyChannel;
        $.hub.publish( channel, message );
    };
    
    // before returning, initialize the hubOptions
    $.hub._reset();

})( jQuery );