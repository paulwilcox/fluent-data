async function serve(req, res) {

    let json = '';
    req.on('data', chunk => json += chunk);

    req.on('end', () => {
        let db = $$.fromJson(json);
        let c = db.sort(c => c.id).get(c => c);
        let result = c.length > 0 && c[0].id == 1;
        res.writeHead(200, 'ok');
        res.end(result.toString());
    });

}