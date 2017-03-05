import { make_event_dispatcher } from './event_dispatcher'


function cache ( num_datasets, total_datasets, getter, is_async ) {

    // Getter is a callback that can be passed an index range and loads the datasets in that range.
    // If getter is not asynchronous, it must return a list of datasets.
    // If getter is asynchronous, is_async should be set to true and the _cache.set function should be called
    // externally for each individual dataset.

    var _current_id = 0;
    var _start_id = 0;
    var _shift_size = 1;
    var _padding_left = 1;
    var _padding_right = 2;

    var _data = new Array( num_datasets );
    var _valid = new Array( num_datasets ).fill( false );

    var _cache = function () {};
    make_event_dispatcher( _cache );

    // Get the current id or sets the current id, shifting buffer as needed
    _cache.current = function ( dataset_id ) {

        if ( !arguments.length ) return _current_id;

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

            // Check that the dataset has not been invalidated
            if ( _valid[ _index( dataset_id ) ] ) {

                return _data[ _index(dataset_id) ];

            }

        } else {

            console.error('Dataset ' + dataset_id + ' is not in the cache');

        }

    };

    // Returns all data currently in the cache without triggering shifts
    _cache.data = function () {
        return _data;
    };

    // Get or set the current left padding
    _cache.padding_left = function ( padding ) {

        if ( !arguments.length ) return _padding_left;

        if ( padding >= 0 && padding <= num_datasets-_padding_right-1) {
            _padding_left = padding;
        } else {
            console.warn( 'Invalid left padding' );
        }
        return _cache;
    };

    // Get or set the current right padding
    _cache.padding_right = function ( padding ) {

        if ( !arguments.length ) return _padding_right;

        if ( padding >= 0 && padding <= num_datasets-_padding_left-1 ) {
            _padding_right = padding+1;
        } else {
            console.warn( 'Invalid right padding' );
        }
        return _cache;
    };

    // Prints the data to the console
    _cache.print = function () {
        console.log( 'Cache: ' + _data );
        return _cache;
    };

    // Gets the current range or sets the range and fills the buffer
    _cache.range = function ( range ) {

        if ( !arguments.length ) return [ _start_id, _start_id + num_datasets ];

        if ( range[1]-range[0] == num_datasets ) {

            // Fills cache with data from file, datasets [start,end)
            _start_id = range[0];
            if ( is_async ) {
                getter( range );
            } else {
                _data = getter( range );
                _valid.fill( true );
            }

        } else {

            console.error( 'Must fill cache with ' + num_datasets + ' datasets' );

        }

        _debug();
        return _cache;

    };

    // Get or set the current shift size
    _cache.shift_size = function ( shift_size ) {

        if ( !arguments.length ) return _shift_size;

        // Defines the number of datasets to shift by. Maximum
        // is the total number of datasets minus 1.
        if ( shift_size > num_datasets ) {
            console.warn( 'Maximum shift size is ' + num_datasets + '. Using maximum.' );
            shift_size = num_datasets;
        }

        _shift_size = shift_size;
        return _cache;

    };

    // Initialize
    _cache.range( [ 0, num_datasets ] );
    _cache.current( 0 );

    return _cache;

    function _debug () {
        _cache.dispatchEvent({
            type: 'debug',
            from: 'cache',
            current: _current_id,
            cache_range: [ _start_id, _start_id + num_datasets ],
            data_range: [ 0, total_datasets ],
            padding: [ _start_id + _padding_left, _start_id + num_datasets - _padding_right ]
        });
    }

    function _fetch ( range ) {

        if ( is_async ) {
            getter( range, _set );
        } else {
            var data = getter( range );
            for ( var i=0; i<range[1]-range[0]; ++i ) {
                _set( range[0] + i, data[i] );
            }
        }

    }

    function _index ( dataset_id ) {

        return dataset_id % num_datasets;

    }

    function _invalidate ( range ) {

        for ( var i=0; i<range[1]-range[0]; ++i ) {
            _valid[ _index( range[0] + i ) ] = false;
        }

    }

    function _set ( dataset_id, data ) {

        if ( typeof _start_id === 'undefined' ) {
            console.error( 'Unable to cache dataset, cache has not yet been initialized' );
            return _cache;
        }

        if ( dataset_id >= _start_id && dataset_id < _start_id + num_datasets ) {
            _data[ _index( dataset_id ) ] = data;
            _valid[ _index( dataset_id ) ] = true;
        } else {
            console.warn( 'Unable to cache dataset, it does not fall into the cache range' );
        }

        return _cache;

    }

    function _shift_left () {

        if ( typeof _shift_size === 'undefined' ) {
            console.error( 'Unable to shift, shift size undefined.' );
            return _cache;
        }

        if ( _start_id == 0 ) return _cache;

        var num_to_read = _shift_size;
        var start = _start_id - num_to_read;

        if ( start < 0 ) {
            num_to_read += start;
            start = 0;
        }

        var end = start + num_to_read;
        var range = [ start, end ];
        var range_invalidate = [ _start_id+num_datasets-num_to_read, _start_id+num_datasets ];

        _start_id -= num_to_read;
        _invalidate( range_invalidate );
        _fetch( range );

        _debug();

    }

    function _shift_right () {

        if ( typeof _shift_size === 'undefined' ) {
            console.error( 'Unable to shift, shift size undefined.' );
            return;
        }

        if ( _start_id + num_datasets == total_datasets ) return;

        var num_to_read = _shift_size;
        var end = _start_id + num_datasets + _shift_size;

        if ( end > total_datasets ) {

            num_to_read -= ( end - total_datasets );
            end = total_datasets;

        }

        var start = end - num_to_read;
        var range = [ start, end ];
        var range_invalidate = [ _start_id, _start_id+num_to_read ];

        _start_id += num_to_read;
        _invalidate( range_invalidate );
        _fetch( range );

        _debug();

    }



    // _cache.has = function ( dataset_id ) {
    //
    //     return dataset_id >= _start_id &&
    //         dataset_id < _start_id + _num_datasets &&
    //         _valid[ _index( dataset_id ) ];
    //
    // };

}

export { cache };