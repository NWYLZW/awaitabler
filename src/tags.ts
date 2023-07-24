export interface Tags {
}

export let tags: Readonly<Partial<Tags>>

export function defineTags<N extends keyof Tags, T extends Tags[N]>(
  namespace: N,
  tagsParam: T
) {
  if(tags === undefined) tags = {}

  // @ts-ignore
  return (tags[namespace] = tagsParam)
}
