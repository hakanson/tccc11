/*global amplify,QUnit,test,module,equal,deepEqual*/
var triggerData = { "key" : "value" };

module( "AmplifyJS Pub/Sub" );

test( "amplify.publish", function() {
    var a = null;
    
    amplify.subscribe( "custom", function( data ) {
        a = data;
    } );
    amplify.publish( "custom", triggerData );
    
    deepEqual( a, triggerData );
} );

test( "amplify.publish with two subscribers", function() {
    var count = 0;
    
    amplify.subscribe( "custom", function( data ) {
        count++;
    } );
    amplify.subscribe( "custom", function( data ) {
        count++;
    } );
    amplify.publish( "custom", triggerData );
    
    equal( count, 2 );
} );

// Returning false from a subscription will prevent any additional subscriptions
// from being invoked and will cause amplify.publish to return false.
test( "amplify.publish with two subscribers that return false", function() {
    var count = 0;
    
    amplify.subscribe( "custom", function( data ) {
        count++;
        return false;
    } );
    amplify.subscribe( "custom", function( data ) {
        count++;
        return false;
    } );
    amplify.publish( "custom", triggerData );
    
    equal( count, 1 );
} );