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
      if (path.parent.type === 'SequenceExpression') {
        const [expr0, expr1] = path.parent.expressions
        if (expr0.type === 'AwaitExpression' && expr1.type === 'ObjectExpression') {
          path.parentPath.replaceWith(t.awaitExpression(
            t.callExpression(
              t.callExpression(t.identifier('StringFunction'), [expr0.argument]),
              [expr1]
            )
          ))
        }
      } else {
        path.replaceWith(t.awaitExpression(
          t.newExpression(t.identifier('String'), [argument]),
        ))
      }
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
