async function serve(req, res) {

    let json = '';
    req.on('data', chunk => json += chunk);

    req.on('end', () => {
        let ds = $$.fromJson(json);
        let c = ds.sort(c => c.id).get();
        let result = c.length > 0 && c[0].id == 1;
        res.writeHead(200, 'ok');
        res.end(result.toString());
    });

}