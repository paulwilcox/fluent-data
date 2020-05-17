async function serve(req, res) {

    let data = await sample();

    let json = 
        $$(data.customers)
        .toJson();

    res.writeHead(200, 'ok');
    res.end(json);

}