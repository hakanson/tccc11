/*global amplify,QUnit,test,module,equal,deepEqual*/

module( "AmplifyJS Pub/Sub" );

test( "amplify.publish", function() {
    var actualData = null,
        additionalParameter = { "key" : "value" };
    
    amplify.subscribe( "custom", function( data ) {
        actualData = data;
    });

    amplify.publish( "custom", additionalParameter );
    
    deepEqual( actualData, additionalParameter );
});

test( "amplify.publish with two subscribers", function() {
    var count = 0;
    
    amplify.subscribe( "custom", function( data ) {
        count++;
    });
    amplify.subscribe( "custom", function( data ) {
        count++;
    });

    amplify.publish( "custom" );
    
    equal( count, 2, "both subscribe callbacks will be invoked" );
});

// Returning false from a subscription will prevent any additional subscriptions
// from being invoked and will cause amplify.publish to return false.
test( "amplify.publish with two subscribers that return false", function() {
    var count = 0;
    
    amplify.subscribe( "custom", function( data ) {
        count++;
        return false;
    });
    amplify.subscribe( "custom", function( data ) {
        count++;
        return false;
    });

    amplify.publish( "custom" );
    
    equal( count, 1, "only one subscribe callback will be invoked" );
});