async function test () {

    // TODO: Just wrap it up.  It's looking good.

    let json = await
        fetch('./_jsonSender.r.js', { body: 'initial', method: 'post' })
        .then(data => data.text());

    console.log({json});

    let db = $$.fromJson(json);

    console.log({db});

    json = await
        fetch('./_jsonReciever.r.js', { body: json, method: 'post' })
        .then(data => data.text());

    console.log({recievedJson: json})

}