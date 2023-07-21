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
      let shouldSequenceExpression = false
      checkShouldSequenceExpression: if (path.parent.type === 'SequenceExpression') {
        const [expr0, ...rest] = path.parent.expressions

        if (expr0.type !== 'AwaitExpression') break checkShouldSequenceExpression
        const lastExpr = rest[rest.length - 1]
        // the last expression of sequence expression should be a string literal or object expression
        if (!['ObjectExpression', 'StringLiteral'].includes(lastExpr.type))
          break checkShouldSequenceExpression
        const stringLiterals = [expr0.argument]
        const configureExpression = lastExpr.type === 'ObjectExpression'
          ? lastExpr
          : undefined
        for (const expr of rest) {
          if (expr.type !== 'StringLiteral') {
            if (expr === lastExpr && expr.type === 'ObjectExpression') break
            break checkShouldSequenceExpression
          }
          stringLiterals.push(expr)
        }
        shouldSequenceExpression = true
        const stringBinaryExpression = stringLiterals.reduce((prev, cur) => {
          return t.binaryExpression('+',
            prev,
            t.binaryExpression('+',
              t.stringLiteral(' '),
              cur
            )
          )
        })

        if (configureExpression) {
          path.parentPath.replaceWith(t.awaitExpression(
            t.callExpression(
              t.callExpression(t.identifier('StringFunction'), [stringBinaryExpression]),
              [configureExpression]
            )
          ))
        } else {
          path.parentPath.replaceWith(t.awaitExpression(
            t.callExpression(
              t.callExpression(t.identifier('StringFunction'), [stringBinaryExpression]),
              []
            )
          ))
        }
      }
      if (!shouldSequenceExpression) {
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
