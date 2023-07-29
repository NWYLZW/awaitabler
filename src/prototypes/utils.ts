export function safeChangePrototype<T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
  const oldDesc = Object.getOwnPropertyDescriptor(o, p)
  if (oldDesc?.configurable === false) {
    throw new Error(`Cannot change prototype property ${p.toString()} of ${o}`)
  }
  Object.defineProperty(o, p, attributes)
  return () => {
    if (oldDesc === undefined)
      // @ts-ignore
      delete o[p]
    else
      Object.defineProperty(o, p, oldDesc!)
  }
}
