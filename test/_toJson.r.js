async function serve(req, res) {

    let data = await sample();

    let json = 
        $$({
            c: data.customers,
            o: data.orders
        })
        .toJson();

    res.writeHead(200, 'ok');
    res.end(json);

}