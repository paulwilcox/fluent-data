async function serve(req, res) {

    let data = await sample();

    let json = 
        $$(data.customers)
        .toJsonString();

    res.writeHead(200, 'ok');
    res.end(json);

}