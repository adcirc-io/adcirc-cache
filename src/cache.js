
function cache ( num_datasets, total_datasets, getter, is_async ) {

    // Getter is a callback that can be passed an index range and loads the datasets in that range.
    // If getter is not asynchronous, it must return a list of datasets.
    // If getter is asynchronous, is_async should be set to true and the _cache.set function should be called
    // externally for each individual dataset.

    var _getter = getter;
    var _async = !!is_async;

    var _num_datasets = num_datasets;
    var _total_datasets = total_datasets;
    var _start_id;
    var _shift_size;

    var _data = new Array( _num_datasets );
    var _valid = new Array( _num_datasets ).fill( false );

    var _cache = function () {};

    _cache.fill = function ( range ) {

        if ( range[1]-range[0] == _num_datasets ) {

            // Fills cache with data from file, datasets [start,end)
            _start_id = range[0];
            if ( _async ) {
                _getter( range );
            } else {
                _data = _getter( range );
                _valid.fill( true );
            }

        } else {

            console.error( 'Must fill cache with ' + _num_datasets + ' datasets' );

        }

        return _cache;

    };

    _cache.get = function ( dataset_id ) {

        if ( dataset_id >= _start_id && dataset_id < _start_id + _num_datasets ) {
            return _data[ _index( dataset_id ) ];
        }

        console.error( 'Dataset ' + dataset_id + ' is not in the cache' );

    };

    _cache.has = function ( dataset_id ) {

        return dataset_id >= _start_id &&
            dataset_id < _start_id + _num_datasets &&
            _valid[ _index( dataset_id ) ];

    };

    _cache.set = function ( dataset_id, data ) {

        if ( typeof _start_id === 'undefined' ) {
            console.error( 'Unable to cache dataset, cache has not yet been initialized' );
            return _cache;
        }

        if ( dataset_id >= _start_id && dataset_id < _start_id + _num_datasets ) {
            _data[ _index( dataset_id ) ] = data;
            _valid[ _index( dataset_id ) ] = true;
            console.log( _data );
            console.log( _valid );
        } else {
            console.warn( 'Unable to cache dataset, it does not fall into the cache range' );
        }

        return _cache;

    };

    _cache.shift_left = function () {

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
        var range_invalidate = [ _start_id+_num_datasets-num_to_read, _start_id+_num_datasets ];

        _start_id -= num_to_read;
        _invalidate( range_invalidate );
        _fetch( range );

        return _cache;

    };

    _cache.shift_size = function ( shift_size ) {

        // Defines the number of datasets to shift by. Maximum
        // is the total number of datasets minus 1.
        if ( shift_size > _num_datasets ) {
            console.warn( 'Maximum shift size is ' + _num_datasets + '. Using maximum.' );
            shift_size = _num_datasets;
        }

        _shift_size = shift_size;
        return _cache;

    };

    _cache.shift_right = function () {

        if ( typeof _shift_size === 'undefined' ) {
            console.error( 'Unable to shift, shift size undefined.' );
            return _cache;
        }

        if ( _start_id + _num_datasets == _total_datasets ) return _cache;

        var num_to_read = _shift_size;
        var end = _start_id + _num_datasets + _shift_size;

        if ( end > _total_datasets ) {

            num_to_read -= ( end - _total_datasets );
            end = _total_datasets;

        }

        var start = end - num_to_read;
        var range = [ start, end ];
        var range_invalidate = [ _start_id, _start_id+num_to_read ];

        _start_id += num_to_read;
        _invalidate( range_invalidate );
        _fetch( range );

        return _cache;

    };

    _cache.print = function ( label ) {
        console.log( label + ': ' + _data );
        return _cache;
    };

    return _cache;

    function _fetch ( range ) {

        if ( _async ) {
            _getter( range );
        } else {
            var data = _getter( range );
            for ( var i=0; i<range[1]-range[0]; ++i ) {
                _cache.set( range[0] + i, data[i] );
            }
        }

    }

    function _index ( dataset_id ) {

        return dataset_id % _num_datasets;

    }

    function _invalidate ( range ) {

        for ( var i=0; i<range[1]-range[0]; ++i ) {
            _valid[ _index( range[0] + i ) ] = false;
        }

    }

}

export { cache };