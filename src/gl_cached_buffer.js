import { make_event_dispatcher } from './event_dispatcher'


function gl_cached_buffer ( gl, buffer, cache, num_datasets, dataset_size ) {

    var _accessor = function ( d ) { return d; };

    var _current_id = cache.current();
    var _start_id = cache.current();
    var _shift_size = 1;
    var _padding_left = 1;
    var _padding_right = 2;

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

        // If the dataset is somewhere in the gl_buffer, returns the range to render
        if ( dataset_id >= _start_id && dataset_id < _start_id + num_datasets ) {

            // Check if we need to do a local shift
            if ( dataset_id < _start_id + _padding_left ) {
                _shift_left();
            }
            if ( dataset_id > _start_id + num_datasets - _padding_right ) {
                _shift_right();
            }

            cache.current( dataset_id );
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

    _cached_buffer.left_padding = function ( padding ) {

        // If we load a dataset within padding datasets of the left edge,
        // shift the gl_buffer cache to the left

    };

    _cached_buffer.right_padding = function ( padding ) {

        // If we load a dataset within padding datasets of the right edge,
        // shift the gl_buffer cache to the right

    };

    _cached_buffer.shift_size = function ( shift_size ) {

        if ( !arguments.length ) return _shift_size;

        if ( shift_size > buffer.shift_size() ) {
            console.warn( 'Maximum shift size is ' + buffer.shift_size() + '. Using maximum.' );
            shift_size = buffer.shift_size();
        }

        _shift_size = shift_size;
        return _cached_buffer;

    };

    function _debug () {

        _cached_buffer.dispatchEvent({
            type: 'debug',
            from: 'gl',
            current: _current_id,
            cache_range: [ _start_id, _start_id + num_datasets ]
        });

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

    function _index ( dataset_id ) {}
    function _shift_left () {
        console.log( 'shift left' );
    }
    function _shift_right () {
        console.log( 'shift right' );
    }


    return _cached_buffer;
    
}

export { gl_cached_buffer }