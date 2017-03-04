import { EventDispatcher } from './event_dispatcher'


function gl_cached_buffer ( gl, buffer, cache, num_datasets, dataset_size ) {
    
    var _gl = gl;
    var _buffer = buffer;
    var _cache = cache;
    var _num_datasets = num_datasets;
    var _dataset_size = dataset_size;
    var _accessor = function ( d ) { return d; };

    var _start_id;
    var _shift_size;
    var _padding_left;
    var _padding_right;

    var _cached_buffer = function () {};
    Object.assign( _cached_buffer, EventDispatcher.prototype );


    _cached_buffer.accessor = function ( accessor ) {

        // Given a dataset, accessor will return the arraybuffer from the dataset

        if ( typeof accessor === 'function' ) _accessor = accessor;
        return _cached_buffer;
    };

    _cached_buffer.dataset = function ( dataset_id ) {

        // Sets the currently in use dataset

        // If the dataset is somewhere in the gl_buffer, returns the range to render
        if ( dataset_id >= _start_id && dataset_id < _start_id + _num_datasets ) {

            // Check if we need to do a local shift
            if ( dataset_id < _start_id + _padding_left ) {
                _shift_left();
            }
            if ( dataset_id > _start_id + _num_datasets - _padding_right ) {
                _shift_right();
            }

            return [ _index( dataset_id ), _index( dataset_id ) + _dataset_size ];
        }

        // If the dataset is not in the gl_buffer range, but is within the cache,
        // move to that position in the cache and load data to gl_buffer

        // If the dataset is not in the gl_buffer range or in the cache,
        // move the cache to that position in the file, load from the file
        // into the cache and from the cache into the gl_buffer

    };

    _cached_buffer.fill = function ( range ) {

        if ( range[1] - range[0] == _num_datasets ) {

            _gl.bindBuffer( _gl.ARRAY_BUFFER, _buffer );

            for ( var i=0; i<_num_datasets; ++i ) {
                if ( _cache.has( range[0] + i ) ) {
                    var data = _accessor( _cache.get( range[0] + i ) );
                    _gl.bufferSubData( _gl.ARRAY_BUFFER, _index( range[0] + i ), data )
                } else {
                    console.error( 'Dataset ' + (range[0] + i) + ' not in cache, unable to transfer to GPU' );
                }
            }

        } else {

            console.error( 'Must fill cache with ' + _num_datasets + ' datasets' );

        }

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

        if ( shift_size > _buffer.shift_size() ) {
            console.warn( 'Maximum shift size is ' + _buffer.shift_size() + '. Using maximum.' );
            shift_size = _buffer.shift_size();
        }

        _shift_size = shift_size;
        return _cached_buffer;

    };

    function _index ( dataset_id ) {}
    function _shift_left () {}
    function _shift_right () {}


    return _cached_buffer;
    
}