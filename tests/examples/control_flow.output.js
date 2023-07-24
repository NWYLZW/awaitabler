await new String('u0');
await Promise.all([new String('u0'), new String('u1')]);
await Promise.all([new String('u0'), new String(`u1${2}`)]);
await Promise.all([new String('u0'), new String('u1'), new String('u2')]);
await Promise.all([new String('u0'), Promise.all([new String('u1'), Promise.all([new String('u2'), new String('u3')])]), new String('u4')]);
await new String('u0');
await Promise.allSettled([new String('u0'), new String('u1')]);
await Promise.allSettled([new String('u0'), new String(`u1${2}`)]);
await Promise.allSettled([new String('u0'), new String('u1'), new String('u2')]);
await Promise.allSettled([new String('u0'), Promise.allSettled([new String('u1'), Promise.allSettled([new String('u2'), new String('u3')])]), new String('u4')]);
await Promise.any([new String('u0'), new String('u1')]);
await new String('u0'), await new String('u1');
await Promise.resolve(new String('u0')).catch(() => new String('u1'));
[await new String('u0'), await new String('u1')];
// no string
await Promise.any([Promise.reject(1), new String('u0')]);
