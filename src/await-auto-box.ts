import { declare } from '@babel/helper-plugin-utils'

export const awaitAutoBox = declare(({ types: t }) => {
  return {
    visitor: {
      AwaitExpression(path) {
        const { node } = path
        const { argument } = node
        // console.log('node', node)
        // console.log('argument', argument)
        if (
          argument.type === 'StringLiteral'
          || argument.type === 'TemplateLiteral'
        ) {
          path.replaceWith(t.awaitExpression(
            t.newExpression(t.identifier('String'), [argument]),
          ))
        }
      },
    }
  }
})

export default awaitAutoBox
