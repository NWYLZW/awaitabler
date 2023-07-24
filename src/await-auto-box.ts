import type { PluginObj, types } from '@babel/core'
import type { SpreadElement, Expression } from '@babel/types'
import { declare } from '@babel/helper-plugin-utils'

// argument = ArrayExpression (string | template | BinaryExpression)
// argument = SequenceExpression (string | template | BinaryExpression)
// argument = BinaryExpression
function multipleExpressionsResolve(t: typeof types, expr: Expression) {
  if (
    expr.type === 'ArrayExpression'
    || expr.type === 'SequenceExpression'
  ) {
    let elements: (SpreadElement | Expression | null)[] = []
    if (expr.type === 'ArrayExpression') {
      elements = expr.elements
    }
    if (expr.type === 'SequenceExpression') {
      elements = expr.expressions
    }
    const newElements = elements.map(ele => {
      if (ele?.type === 'StringLiteral' || ele?.type === 'TemplateLiteral') {
        return t.newExpression(t.identifier('String'), [ele])
      }
      return ele
    })
    let identifierName: string | undefined = undefined
    if (elements.length > 1) {
      identifierName = {
        ArrayExpression: 'all',
        SequenceExpression: 'allSettled'
      }[expr.type]
    }
    if (identifierName) {
      return (func: (e: Expression) => void) => func(t.awaitExpression(
        t.callExpression(
          t.memberExpression(t.identifier('Promise'), t.identifier(identifierName!)),
          [t.arrayExpression(newElements)]
        )
      ))
    }
  }
}

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
    multipleExpressionsResolve(t, argument)?.(path.replaceWith.bind(path))
  }
  return { visitor }
})

export default awaitAutoBox
