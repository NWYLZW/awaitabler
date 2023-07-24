await ['u0']
await ['u0', 'u1']
await ['u0', `u1${2}`]
await ['u0', 'u1', 'u2']
await ['u0', ['u1', ['u2', 'u3']], 'u4']
await ('u0')
await ('u0', 'u1')
await ('u0', `u1${2}`)
await ('u0', 'u1', 'u2')
await ('u0', ('u1', ('u2', 'u3')), 'u4')
await ('u0' || 'u1')
await ('u0' && 'u1')
await ['u0' || 'u1']
await ['u0' && 'u1']
