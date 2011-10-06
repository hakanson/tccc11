/*global OpenAjax*/
// questionable if should be plugin  https://github.com/cowboy/talks/blob/master/jquery-plugin-authoring.js
(function( $ ) {
    var hubOptions = {},
        readylist = null;

    $.hub = function( options ) {
        if ( options.ready === false ) {
            // http://api.jquery.com/category/deferred-object/
            readylist = $._Deferred();
            hubOptions.ready = false;
        }
        if ( options.ready ) {
            if ( readylist ) {
                // execute any callbacks that were added
                readylist.resolve();
            }
        }
        if ( options.debug ) {
            hubOptions.debug = ( options.debug === true );
        }
        return hubOptions;
    };


    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
    $.hub.guid = function() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function( c ) {
            var r = Math.random() * 16 | 0,
                v = ( c === "x" ? r : ( r & 0x3 | 0x8 ) );

            return v.toString( 16 );
        } );
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

    $.hub.subscribe = function( channel, callback, scope, subscriberData, filter ) {
        var callbackProxy = callback,
            filterProxy = filter;

        if ( scope ) {
            callbackProxy = $.proxy( callback, scope );
        }
        if ( filter && hubOptions.stringify ) {
            filterProxy = function( channel, message ) {
                return filter( channel, JSON.parse( message ) );
            };
        }
        return OpenAjax.hub.subscribe( channel /*name*/,
            function( channel, message ) { callbackProxy( channel, ( hubOptions.stringify ? JSON.parse( message ) : message ) ); },
            null,  /* null scope because of $.proxy */
            subscriberData,
            filterProxy );
    };

    $.hub.unsubscribe = function( subscription ) {
        OpenAjax.hub.unsubscribe( subscription );
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
            // add a callback to be executed when the deferred is resolved
            readylist.done( function() {
                _publish( channel, message );
            } );
        } else {
            _publish( channel, message );
        }
    };

    $.hub.createVersionFilter = function( version ) {
        var major, minor;

        version = /(\d+)\.?(\d+)?\.?(\d+)?/.exec( version );
        major = parseInt( version[1], 10 ) || 0;
        minor = parseInt( version[2], 10 ) || 0;

        var filter = function( channel, message ) {
            var messageVersion = /(\d+)\.?(\d+)?\.?(\d+)?/.exec( ( message ? message.formatVersion : "" ) ),
                messageMajor = parseInt( messageVersion[1], 10 ) || 0,
                messageMinor = parseInt( messageVersion[2], 10 ) || 0;
            return ( major === messageMajor && ( minor ? minor === messageMinor : true ) );
        };

        return filter;
    };

    $.hub.createIdempotentFilter = function() {
        var messageIds = {};
        var filter = function( channel, message ) {
            if ( message && message.messageId ) {
                if ( messageIds[message.messageId] ) {
                    return false;
                } else {
                    messageIds[message.messageId] = message.timestamp;
                }
            }

            return true;
        };

        return filter;
    };

    $.hub.reply = function( message, replyMessage ) {
        if ( message && replyMessage && message.replyTo ) {
            replyMessage.correlationId = message.messageId;
            $.hub.publish( message.replyTo, replyMessage );
            return true;
        }

        return false;
    };

    $.hub.requestReply = function( channel, message, callback ) {
        var replyChannel = $.hub.guid(),
            subscription = $.hub.subscribe( replyChannel, function( channel, message ) {
                callback( channel, message );
                $.hub.unsubscribe( subscription );
            } );

        message.replyTo = replyChannel;
        $.hub.publish( channel, message );
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

    // before returning, initialize the hubOptions
    $.hub._reset();

} )( jQuery );