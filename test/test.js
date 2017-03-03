
var cache = adcirc
    .cache( 5, 10, dummy, false )
    .shift_size( 3 );

var cache_async = adcirc
    .cache( 5, 10, dummy_async, true )
    .shift_size( 3 );


console.log( 'Fill caches' );
cache
    .fill( [0, 5] )
    .print( ' sync' );

cache_async
    .fill( [0, 5] )
    .print( 'async' );

console.log( 'Shift right' );
cache
    .shift_right()
    .print( ' sync' );

cache_async
    .shift_right()
    .print( 'async' );


function dummy ( range ) {
    var data = [];
    for ( var i=range[0]; i<range[1]; ++i ) {
        data.push( i );
    }
    return data;
}

function dummy_async ( range ) {
    for ( var i=range[0]; i<range[1]; ++i ) {
        cache_async.set( i, i );
    }
}

render();

function render () {

    var num_data_points = 27;
    var cache_names = [ 'cache', 'gl-cache', 'cache' ];
    var cache_bounds = [ [0, 9], [9, 18], [18, 27] ];
    var cache_colors = [ 'lightsteelblue', 'steelblue', 'lightsteelblue' ];
    var cache_active = [ 11, 16 ];
    var current = 13;

    var data = [];
    for ( var i=0; i<num_data_points; ++i ) {
        data.push( i );
    }
    var bar = d3.select( '#bar' );

    bar.selectAll( '.bar-section' )
        .data( cache_names )
        .enter()
        .append( 'div' )
        .attr( 'class', 'bar-section' )
        .each( function ( d, i ) {
            d3.select( this )
                .selectAll( '.bar' )
                .data( data.slice( cache_bounds[i][0], cache_bounds[i][1] ) )
                .enter()
                .append( 'div' )
                .attr( 'class', 'bar' )
                .text( function ( d ) { return d; } )
                .style( 'background-color', cache_colors[i] );
        });

    bar.selectAll( '.bar' )
        .filter( function ( d ) { return d >= cache_active[0] && d < cache_active[1] } )
        .classed( 'special', true );

    bar.selectAll( '.bar' )
        .filter( function ( d ) { return d == current; })
        .classed( 'active', true );

    bar.selectAll( '.bar' )
        .on( 'click', function ( d ) {
            d3.selectAll( '.bar.active' )
                .classed( 'active', false );
            d3.select( this )
                .classed( 'active', true );
        });


}