self.addEventListener( 'message', function ( message ) {

    var dataset = message.data.dataset;
    var random_load_time = Math.random() * 500;

    setTimeout( function () {

        self.postMessage({
            dataset: dataset,
            value: dataset
        });

    }, random_load_time );

});