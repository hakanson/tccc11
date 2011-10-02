/*global QUnit,test,module,equal,deepEqual*/
QUnit.testStart = function( name ) {
    $.hub._reset();
};

module( "Publish-Subscribe Channel" );

test( "subscribe will get message", function() {
    var channel = "a",
        message = { "a": "a" },
        actualMessage,
        actualChannel;

    var subscription = $.hub.subscribe( channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
    });

    $.hub.publish( channel, message );

    equal( actualChannel, channel );
    deepEqual( actualMessage, message );

    $.hub.unsubscribe( subscription);
});

test( "wildcard subscribers", function() {
    var message = $.hub.message({});
    var subscriber1, subscriber2, subscriber3, subscriber4, subscriber5, subscriber6;
    var countA = 0,
        countAstar = 0,
        countAstarstar = 0,
        countA1 = 0,
        countA1a = 0,
        countA2 = 0;

    subscriber1 = $.hub.subscribe( "A", function( channel, message ) {
        countA++;
    });
    subscriber2 = $.hub.subscribe( "A.*", function( channel, message ) {
        countAstar++;
    });
    subscriber3 = $.hub.subscribe( "A.**", function( channel, message ) {
        countAstarstar++;
    });
    subscriber4 = $.hub.subscribe( "A.1", function( channel, message ) {
        countA1++;
    });
    subscriber5 = $.hub.subscribe( "A.1.a", function( channel, message ) {
        countA1a++;
    });
    subscriber6 = $.hub.subscribe( "A.2", function( channel, message ) {
        countA2++;
    });

    $.hub.publish( "A", message );
    $.hub.publish( "A.1", message );
    $.hub.publish( "A.1.a", message );
    $.hub.publish( "A.1.b", message );
    $.hub.publish( "A.2", message );

    equal( countA, 1, "should match A" );
    equal( countAstar, 2, "should match A.1 and A.2" );
    equal( countAstarstar, 4, "should match A.1, A.1.a, A.1.b and A.2" );
    equal( countA1, 1, "should match A.1" );
    equal( countA1a, 1, "should match A.1.a" );
    equal( countA2, 1, "should match A.2" );

    $.hub.unsubscribe( subscriber1 );
    $.hub.unsubscribe( subscriber2 );
    $.hub.unsubscribe( subscriber3 );
    $.hub.unsubscribe( subscriber4 );
    $.hub.unsubscribe( subscriber5 );
    $.hub.unsubscribe( subscriber6 );
});

test( "handle thrown exception", function() {
    //$.hub({ debug: true });  //only enable if you want your javascript debugger to breakpoint

    var channel = "a",
        message = { "a": "a" },
        actualMessage,
        actualChannel;

    var subscription = $.hub.subscribe( channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
        throw new Error();
    });

    $.hub.publish( channel, message );

    equal( actualChannel, channel );
    deepEqual( actualMessage, message );

    $.hub.unsubscribe( subscription );
});

module( "Durable Subscriber" );

test( "subscribe will not get message", function() {
    var channel = "a",
        message = { "a": "a" },
        actualMessage,
        actualChannel;

    $.hub.publish( channel, message );

    var subscription = $.hub.subscribe(channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
    });

    equal( actualChannel, null, "Subscribe happened after publish; message should have been missed" );
    equal( actualMessage, null, "Subscribe happened after publish; message should have been missed" );

    $.hub.unsubscribe( subscription );
});

test( "create a hub that is not ready for publishing until triggered", function() {
    var channelA = "a",
        channelB = "b",
        messageA = { "a": "a" },
        messageB = { "b": "b" },
        actualMessage,
        actualChannel;

    // tell hub to save messages
    $.hub({ ready: false });

    // publish before any active subscribers
    $.hub.publish( channelA, messageA );

    var subscriptionA = $.hub.subscribe(channelA, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
    });

    // tell hub to delivery saved messages
    $.hub({ ready: true });

    equal( actualChannel, channelA );
    deepEqual( actualMessage, messageA );

    $.hub.publish( channelA, messageB );

    equal( actualChannel, channelA );
    deepEqual( actualMessage, messageB );

    $.hub({ ready: false });  // suspend the hub after it already had been active

    $.hub.publish( channelB, messageB );

    var subscriptionB = $.hub.subscribe( channelB, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
    });

    $.hub({ ready: true });

    equal( actualChannel, channelB );
    deepEqual( actualMessage, messageB );

    $.hub.unsubscribe( subscriptionA );
    $.hub.unsubscribe( subscriptionB );
});

module( "Message" );

test( "subscribe using message builder", function() {
    var channel = "namea",
        messageBody = { "key1": "value1", "key2": "value2" },
        actualMessage,
        actualChannel;

    var subscription = $.hub.subscribe( channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
    });

    var message = $.hub.message( messageBody );
    $.hub.publish( channel, message );

    equal( actualChannel, channel );
    equal( actualChannel, channel );
    deepEqual( actualMessage.body, messageBody );

    $.hub.unsubscribe( subscription );
});

module( "Request-Reply" );

test( "subscribe using message builder with replyTo set", function() {
    var channel = "a",
        replyChannel = "b",
        messageBody = { "a": "a" },
        message = $.hub.message( messageBody ),
        replyMessage = $.hub.message({ "c": "c" }),
        correlationId,
        actualMessage,
        actualChannel,
        actualReplyMessage,
        actualReplyChannel;

    var subscription = $.hub.subscribe(channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
        $.hub.reply(message, replyMessage );
    });

    var replySubscription = $.hub.subscribe(replyChannel, function( channel, message ) {
        actualReplyChannel = channel;
        actualReplyMessage = message;
        correlationId = message.correlationId;
    });

    message.replyTo = replyChannel;
    $.hub.publish( channel, message );

    equal( actualChannel, channel );
    deepEqual( actualMessage.body, messageBody );

    equal( actualReplyChannel, replyChannel);
    equal( message.messageId, correlationId);
    deepEqual( actualReplyMessage.body, replyMessage.body );

    $.hub.unsubscribe( subscription );
    $.hub.unsubscribe( replySubscription );
});

test( "subscribe using message builder requestReply", function() {
    var channel = "a",
        replyChannel = "b",
        messageBody = { "a": "a" },
        message = $.hub.message( messageBody ),
        replyMessage = $.hub.message({ "c": "c" }),
        correlationId,
        actualMessage,
        actualChannel,
        actualReplyMessage,
        actualReplyChannel;

    var subscription = $.hub.subscribe(channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
        $.hub.reply( message, replyMessage );
    });

    $.hub.requestReply(channel, message, replyChannel, function( channel, message ) {
        actualReplyChannel = channel;
        actualReplyMessage = message;
        correlationId = message.correlationId;
    });

    equal( actualChannel, channel );
    deepEqual( actualMessage.body, messageBody );

    equal( actualReplyChannel, replyChannel );
    equal( message.messageId, correlationId );
    deepEqual( actualReplyMessage.body, replyMessage.body );

    $.hub.unsubscribe( subscription);
});

test( "subscribe using message builder with replyTo not set", function() {
    var channel = "a",
        replyChannel = "b",
        messageBody = { "a": "a" },
        replyMessage = $.hub.message({ "c": "c" }),
        actualMessage,
        actualChannel,
        actualReplyMessage = null,
        actualReplyChannel = null;

    $.hub.subscribe(channel, function( channel, message ) {
        actualChannel = channel;
        actualMessage = message;
        $.hub.reply( message, replyMessage );
    });

    var correlationId = null;
    $.hub.subscribe( replyChannel, function( channel, message ) {
        actualReplyChannel = channel;
        actualReplyMessage = message;
        correlationId = message.correlationId;
    });

    var message = $.hub.message( messageBody );
    $.hub.publish( channel, message );

    equal( actualChannel, channel );
    deepEqual( actualMessage.body, messageBody );

    equal( actualReplyChannel, null );
    equal( correlationId, null );
    deepEqual( actualReplyMessage, null );
});

module( "Selective Consumer" );

test( "filter", function() {
    var m1 = $.hub.message({ name: "Kevin Hakanson" }, { formatVersion: "1" });
    var m2 = $.hub.message({ firstname: "Kevin", lastname: "Hakanson" }, { formatVersion: "2" });
    var subscriber1, subscriber2, subscriber3;
    var countV1 = 0, countV2 = 0, countBoth = 0;

    function callbackV1( channel, message ) {
        countV1++;
    }
    function callbackV2( channel, message ) {
        countV2++;
    }
    function callbackBoth( channel, message ) {
        countBoth++;
        if ( message.formatVersion === "1" ) {
            countV1++;
        }
        if ( message.formatVersion === "2" ) {
            countV2++;
        }
    }

    subscriber1 = $.hub.subscribe( "Person.*", callbackBoth );

    $.hub.publish( "Person.Cool", m1 );
    $.hub.publish( "Person.Cool", m2 );
    $.hub.unsubscribe( subscriber1 );

    subscriber2 = $.hub.subscribe( "Person.*", callbackV1, null, null, $.hub.createVersionFilter( "1" ) );
    subscriber3 = $.hub.subscribe( "Person.*", callbackV2, null, null, $.hub.createVersionFilter( "2" ) );

    $.hub.publish( "Person.Cool", m1 );
    $.hub.publish( "Person.Cool", m2 );

    equal( countV1, 2 );
    equal( countV2, 2 );
    equal( countBoth, 2 );

    $.hub.unsubscribe( subscriber2 );
    $.hub.unsubscribe( subscriber3 );
});

test( "createVersionFilter", function() {
    var filter1 = $.hub.createVersionFilter( "1" ),
        filter2 = $.hub.createVersionFilter( "2" ),
        filter11 = $.hub.createVersionFilter( "1.1" ),
        filter12 = $.hub.createVersionFilter( "1.2" ),
        filter22 = $.hub.createVersionFilter( "2.2" ),
        message1 = $.hub.message({}, { formatVersion: "1" }),
        message2 = $.hub.message({}, { formatVersion: "2" }),
        message11 = $.hub.message({}, { formatVersion: "1.1" }),
        message12 = $.hub.message({}, { formatVersion: "1.2" }),
        message22 = $.hub.message({}, { formatVersion: "2.2" });

    var is1 = filter1( "", message1 );
    var is2 = filter2( "", message2 );

    equal( is1, true, "1 is version 1" );
    equal( is2, true, "2 is version 2" );

    is1 = filter1( "", message2 );
    is2 = filter2( "", message1 );

    equal( is1, false, "2 is not version 1" );
    equal( is2, false, "1 is not version 2" );

    is1 = filter1( "", message11 );
    is2 = filter2( "", message22 );

    equal( is1, true, "1.1 is version 2" );
    equal( is2, true, "2.2 is version 2" );

    var is11 = filter11( "", message11 );
    var is12 = filter12( "", message12 );
    var is22 = filter22( "", message22 );

    equal( is11, true, "1.1 is version 1.1" );
    equal( is12, true, "1.2 is version 1.2" );
    equal( is22, true, "2.2 is version 2.2" );

    is11 = filter11( "", message1 );
    is12 = filter12( "", message11 );
    is22 = filter22( "", message2 );

    equal( is11, false, "1.1 is not version 1" );
    equal( is12, false, "1.2 is not version 1.1" );
    equal( is22, false, "2.2 is not version 2" );
});

module( "Message Translator" );

test( "filter and translate", function() {
    var m2 = $.hub.message({ firstname: "Kevin", lastname: "Hakanson" }, { formatVersion: "2" });
    var subscriber1, subscriber2, subscriber3;
    var countV1 = 0, countV2 = 0;

    function callbackV1(channel, message ) {
        countV1++;
    }
    function callbackV2(channel, message ) {
        countV2++;
        var name = message.body.firstname + " " + message.body.lastname;
        var translatedMessage = $.hub.message( { name: name }, { formatVersion: "1" } );
        $.hub.publish( channel, translatedMessage );
    }

    subscriber1 = $.hub.subscribe( "Person.*", callbackV1, null, null, $.hub.createVersionFilter( "1" ) );
    subscriber2 = $.hub.subscribe( "Person.*", callbackV2, null, null, $.hub.createVersionFilter( "2" ) );

    $.hub.publish( "Person.Cool", m2 );

    equal( countV1, 1 );
    equal( countV2, 1 );

    $.hub.unsubscribe( subscriber1 );
    $.hub.unsubscribe( subscriber2 );
});

module( "Command Message" );

test( "command message and message endpoint", function() {
    var commandMessage = $.hub.message( {} ),
        channel = "increment";

    var counter = ( function() {
        var count = 0,
            obj = {
                increment: function( value ) {
                    var i = ( typeof value === "number" ? value : 1 );
                    count += i;
                },
                count: function() {
                    return count;
                }
            };
        return obj;
    } )();

    // construct a message endpoint to call counter.increment()
    var subscription = $.hub.subscribe( channel, function( channel, message ) {
        counter.increment( message );
    } );

    counter.increment();
    $.hub.publish( channel, null );

    equal( counter.count(), 2, "counter.count will be incremented two times" );

    counter.increment( 2 );
    $.hub.publish( channel, 2 );

    equal( counter.count(), 6, "counter.count will be incremented six times" );

    $.hub.unsubscribe( subscription );
} );

test( "this and scope", function() {
    var m1 = $.hub.message( { name: "Kevin Hakanson" }, { formatVersion: "1" } );
    var m2 = $.hub.message( { firstname: "Kevin", lastname: "Hakanson" }, { formatVersion: "2" } );
    var subscriber1, subscriber2, subscriber3, subscriber4;

    window.count = 100;  // bad this.count will leak out to window.count
    var counter1 = {
        count: 0,
        increment: function( channel, message ) {
            this.count++;
        }
    };
    var counter2 = (function() {
        var count = 200,
            obj = {
                increment: function( channel, message ) {
                    count++;
                },
                count: function() {
                    return count;
                }
            };
        return obj;
    })();

    subscriber1 = $.hub.subscribe( "Person.*", counter1.increment );
    subscriber2 = $.hub.subscribe( "Person.*", counter1.increment, counter1 );
    subscriber3 = $.hub.subscribe( "Person.*", $.proxy( counter1.increment, counter1 ) );
    subscriber4 = $.hub.subscribe( "Person.*", counter2.increment );

    $.hub.publish( "Person.Cool", m1 );

    equal( window.count, 101, "window.count will be incremented one times" );
    equal( counter1.count, 2, "counter1.count will be incremented two times" );
    equal( counter2.count(), 201, "counter2.count will be incremented one times" );

    $.hub.publish( "Person.Cool", m2 );

    equal( window.count, 102, "window.count will be incremented two times" );
    equal( counter1.count, 4, "counter1.count will be incremented four times" );
    equal( counter2.count(), 202, "counter2.count will be incremented two times" );

    $.hub.unsubscribe( subscriber1 );
    $.hub.unsubscribe( subscriber2 );
    $.hub.unsubscribe( subscriber3 );
    $.hub.unsubscribe( subscriber4 );
});

