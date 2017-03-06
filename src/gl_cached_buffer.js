import { make_event_dispatcher } from './event_dispatcher'


function gl_cached_buffer ( gl, buffer, cache, num_datasets, dataset_size ) {

    var _accessor = function ( d ) { return d; };

    var _current_id = cache.current();
    var _start_id = cache.current();
    var _shift_size = 1;
    var _padding_left = 1;
    var _padding_right = 2;
    var _total_datasets = cache.total_datasets();

    var dbg_data = new Array( num_datasets );

    var _cached_buffer = function () {};
    make_event_dispatcher( _cached_buffer );

    // Get or set the current data accessor
    _cached_buffer.accessor = function ( accessor ) {

        if ( !arguments.length ) return _accessor;

        // Given a dataset, accessor will return the arraybuffer from the dataset
        if ( typeof accessor === 'function' ) _accessor = accessor;
        return _cached_buffer;

    };

    // Get the current id range or sets the current id, shifting the buffer as needed
    _cached_buffer.current = function ( dataset_id ) {

        // Sets the currently in use dataset

        // Return if no change
        if ( dataset_id == _current_id ) return [ _index( dataset_id ), _index( dataset_id ) + dataset_size ];

        // Set the current dataset in the cache as early as possible
        cache.current( dataset_id );

        // If the dataset is somewhere in the gl_buffer, returns the range to render
        if ( dataset_id >= _start_id && dataset_id < _start_id + num_datasets ) {

            // Check if we need to do a local shift
            if ( dataset_id < _start_id + _padding_left ) {
                _shift_left();
            }
            if ( dataset_id > _start_id + num_datasets - _padding_right ) {
                _shift_right();
            }

            _current_id = dataset_id;
            _debug();

            return [ _index( dataset_id ), _index( dataset_id ) + dataset_size ];
        }

        // If the dataset is not in the gl_buffer range, but is within the cache,
        // move to that position in the cache and load data to gl_buffer

        // If the dataset is not in the gl_buffer range or in the cache,
        // move the cache to that position in the file, load from the file
        // into the cache and from the cache into the gl_buffer

    };

    // Get or set the left padding
    _cached_buffer.padding_left = function ( padding ) {

        if ( !arguments.length ) return _padding_left;

        if ( padding >= 0 && padding <= num_datasets-_padding_right-1 ) {
            _padding_left = padding;
        } else {
            console.warn( 'Invalid left padding' );
        }

        return _cached_buffer;

    };

    // Get or set the right padding
    _cached_buffer.padding_right = function ( padding ) {

        if ( !arguments.length ) return _padding_right;

        if ( padding >= 0 && padding <= num_datasets-_padding_left-1 ) {
            _padding_right = padding+1;
        } else {
            console.warn( 'Invalid right padding' );
        }

        return _cached_buffer;

    };

    // Gets the current range of datasets or sets the current range and fills the buffer
    _cached_buffer.range = function ( range ) {

        if ( !arguments.length ) return [ _start_id, _start_id + num_datasets ];

        var cache_range = cache.range();
        if ( !( range[0] >= cache_range[0] && range[1] <= cache_range[1] ) ) {

            console.error( 'Buffer range must fall within the cache range' );
            return;

        }

        if ( range[1] - range[0] == num_datasets ) {

            // Fill buffer with data from cache
            // TODO: Switch from debugging to gl
            var cache_data = cache.data();
            _start_id = range[0];
            for ( var i=_start_id-cache_range[0]; i<num_datasets; ++i ) {

                dbg_data[ _index( i ) ] = _accessor( cache_data[i] );

            }

        } else {

            console.error( 'Must fill cache with ' + num_datasets + ' datasets' );

        }

    };

    _cached_buffer.shift_size = function ( shift_size ) {

        if ( !arguments.length ) return _shift_size;

        if ( shift_size > cache.shift_size() ) {
            console.warn( 'Maximum shift size is ' + cache.shift_size() + '. Using maximum.' );
            shift_size = cache.shift_size();
        }

        _shift_size = shift_size;
        return _cached_buffer;

    };

    _cached_buffer.range( [0, num_datasets] );
    _cached_buffer.current( 0 );
    return _cached_buffer;

    function _debug () {

        _cached_buffer.dispatchEvent({
            type: 'debug',
            from: 'gl',
            current: _current_id,
            cache_range: [ _start_id, _start_id + num_datasets ],
            padding: [ _start_id + _padding_left, _start_id + num_datasets - _padding_right ]
        });

    }

    function _fetch ( range ) {

        // var data = cache.data( range );
        // for ( var i=0; i<range[1]-range[0]; ++i ) {
        //     _set( range[0] + i, data[i] );
        // }

        for ( var i=range[0]; i<range[1]; ++i ) {
            var data = cache.current( i );
            _set( i, data );
        }

    }

    function _fill ( range ) {

        if ( range[1] - range[0] == num_datasets ) {

            gl.bindBuffer( gl.ARRAY_BUFFER, buffer );

            for ( var i=0; i<num_datasets; ++i ) {
                if ( cache.has( range[0] + i ) ) {
                    var data = _accessor( cache.get( range[0] + i ) );
                    gl.bufferSubData( gl.ARRAY_BUFFER, _index( range[0] + i ), data )
                } else {
                    console.error( 'Dataset ' + (range[0] + i) + ' not in cache, unable to transfer to GPU' );
                }
            }

        } else {

            console.error( 'Must fill cache with ' + num_datasets + ' datasets' );

        }

    }

    function _index ( dataset_id ) {

        return dataset_id % num_datasets;

    }

    function _set ( dataset_id, data ) {

        dbg_data[ _index( dataset_id ) ] = data;

    }

    function _shift_left () {

        if ( typeof _shift_size === 'undefined' ) {
            console.error( 'Unable to shift, shift size undefined' );
            return;
        }

        if ( _start_id == 0 ) return;

        var num_to_read = _shift_size;
        var start = _start_id - num_to_read;

        if ( start < 0 ) {
            num_to_read += start;
            start = 0;
        }

        var end = start + num_to_read;
        var range = [ start, end ];

        _start_id -= num_to_read;
        _fetch( range );

    }

    function _shift_right () {

        if ( typeof _shift_size === 'undefined' ) {
            console.error( 'Unable to shift, shift size undefined' );
            return;
        }

        if ( _start_id + num_datasets == _total_datasets ) return;

        var num_to_read = _shift_size;
        var end = _start_id + num_datasets + _shift_size;

        if ( end > _total_datasets ) {

            num_to_read -= ( end - _total_datasets );
            end = _total_datasets;

        }

        var start = end - num_to_read;
        var range = [ start, end ];

        _start_id += num_to_read;
        _fetch( range );

    }
    
}

export { gl_cached_buffer }