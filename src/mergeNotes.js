// Syntax possibilities:

  a.joinNull(b, 'id', true) // distinct inner join on 'id'
  a.joinLeft(b, ['id','aId']) // left join on a.id == b.aId
  a.joinBoth(b, '=') // union all

  // distinct inner join on id
  a.merge({
    other: b,
    matcher: (a,b) => a.id == b.id,
    mapper: (a,b) => !a ? undefined : { ...b, ...a },
    singular: true,
    algo: 'hash'
  })


// Possible function names:

  a.joinBoth(b, (a,b) => a.id == b.id) // joinThob, joinStack
  a.joinRight(b, (a,b) => a.id == b.id)
  a.joinFull(b, (a,b) => a.id == b.id)
  a.joinNull(b, (a,b) => a.id == b.id)

  a.existsLeft(b, (a,b) => a.id == b.id)
  a.existsRight(b, (a,b) => a.id == b.id)
  a.upsertLeft(b, (a,b) => a.id == b.id)
  a.upsertRight(b, (a,b) => a.id == b.id)
  a.updateLeft(b, (a,b) => a.id == b.id)
  a.updateRight(b, (a,b) => a.id == b.id)
  // preserveLeft (useless)
  // preserveRight (useless)

  a.notExistsBoth(b, (a,b) => a.id == b.id)
  a.notExistsLeft(b, (a,b) => a.id == b.id)
  a.notExistsRight(b, (a,b) => a.id == b.id)
  // clear (useless)

