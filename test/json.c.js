async function test () {

    // fromJson(resp)
        
        let db = await
            fetch('./_jsonSender.r.js')
            .then(resp => $$.fromJson(resp));

        let json = db.toJson();

        await runServerTests(json, 'toJson');

    // fromJson(resp.json())

        db = await
            fetch('./_jsonSender.r.js')
            .then(resp => resp.json())
            .then(protoDb => $$.fromJson(protoDb));

        json = db.toJson();

        await runServerTests(json, 'toJson');

    // fromJson(resp.text())

        db = await
            fetch('./_jsonSender.r.js')
            .then(resp => resp.text())
            .then(protoDb => $$.fromJson(protoDb));

        json = db.toJson();

        await runServerTests(json, 'toJson');

    return true;

}

async function runServerTests (json, prefix) {

    checkJson(json, prefix);

    return await 
        fetch('./_jsonReciever.r.js', { body: json, method: 'post' })
        .then(resp => resp.text()) 
        .then(result => {
            if (result !== 'true')
                throw `${prefix}: test did not pass on server.`;
        });

}

function checkJson(json, prefix) {
    try {
        let parsed = JSON.parse(json);
        let test = parsed['c'].data.sort(c => c.id)[0].id == 1;
        if (!test)
            throw `${prefix}: parsed json sorted by customer id ` +
                `did not produce a first record with id == 1`;
    } 
    catch (err) {
        err.message = `${prefix}: ${err.message}`;
        throw (err);
    }
}
