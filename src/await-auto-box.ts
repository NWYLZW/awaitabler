import type { PluginObj } from '@babel/core'
import { declare } from '@babel/helper-plugin-utils'

export const awaitAutoBox = declare(({ types: t }) => {
  const visitor: PluginObj['visitor'] = {}
  visitor.AwaitExpression = function (path) {
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
    if (
      argument.type === 'CallExpression'
      && argument.callee.type === 'StringLiteral'
    ) {
      path.replaceWith(t.awaitExpression(
        // await StringFunction(<callee>)(<arguments>)
        t.callExpression(
          t.callExpression(t.identifier('StringFunction'), [argument.callee]),
          argument.arguments
        ),
      ))
    }
  }
  return { visitor }
})

export default awaitAutoBox
