import { cache } from '../src/cache_new'

var gl_buffer_size = 100;

var left = cache()
    .size( 10 )
    .max_size( 100 )
    .getter( load_dataset );

var right = cache()
    .size( 10 )
    .max_size( 100 )
    .getter( load_dataset );

var gl_cache = cache()
    .size( 10 )
    .max_size( 100 )
    .cache_left( left )
    .cache_right( right )
    .transform( gl_transform );


function load_dataset ( dataset_id, callback ) {

    var random_load_time = Math.random() * 500;

    setTimeout( function () {

        callback( dataset_id, dataset_id );

    }, random_load_time);

}

function gl_transform ( index, dataset ) {

    var start_index = gl_buffer_size * index;
    var end_index = start_index + gl_buffer_size;

    // Transfer the data buffer to gl here.
    console.log( 'GL buffer range [' + start_index + ', ' + end_index + '] contains data from dataset ' + dataset );

    return [ start_index, end_index ];

}