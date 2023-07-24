import type { PluginObj, types } from '@babel/core'
import type { SpreadElement, Expression, SequenceExpression } from '@babel/types'
import { declare } from '@babel/helper-plugin-utils'

function getIdentifierName(expr: Expression) {
  return {
    ArrayExpression: 'all',
    SequenceExpression: 'allSettled'
  }[expr.type as string]
}

function wrapStringSecure(t: typeof types, expr: Expression) {
  if (expr.type === 'StringLiteral' || expr.type === 'TemplateLiteral') {
    return t.newExpression(t.identifier('String'), [expr])
  }
  return expr
}

// argument = ArrayExpression (string | template | BinaryExpression)
// argument = SequenceExpression (string | template | BinaryExpression)
// argument = LogicalExpression
function multipleExpressionsResolve(t: typeof types, expr: Expression):
  | undefined
  | ((func: (e: Expression, noAwait?: boolean) => void) => void) {
  if (expr.type === 'LogicalExpression' && ['&&', '||'].includes(expr.operator)) {
    switch (expr.operator) {
      // ('123' || '456')
      // Promise.any([new String('123'), new String('456')])
      case '||':
        return func => func(t.callExpression(
          t.memberExpression(t.identifier('Promise'), t.identifier('any')),
          [t.arrayExpression([
            wrapStringSecure(t, expr.left),
            wrapStringSecure(t, expr.right)
          ])]
        ))
      // ('123' && '456')
      // await new String('123'), await new String('456')
      case '&&':
        return func => func(t.sequenceExpression([
          t.awaitExpression(wrapStringSecure(t, expr.left)),
          t.awaitExpression(wrapStringSecure(t, expr.right))
        ]), true)
    }
  }
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
      if (!ele) return ele

      if (ele.type === 'StringLiteral' || ele.type === 'TemplateLiteral') {
        return t.newExpression(t.identifier('String'), [ele])
      }
      if (
        ele.type === 'ArrayExpression'
        || ele.type === 'SequenceExpression'
      ) {
        multipleExpressionsResolve(t, ele)?.(ne => ele = ne)
      }
      return ele
    })
    let identifierName: string | undefined = undefined
    if (elements.length > 1) {
      identifierName = getIdentifierName(expr)
    }
    const firstElement = elements[0]
    if (
      elements.length === 1
      && firstElement !== null
      && firstElement.type !== 'SpreadElement'
    ) {
      if (firstElement.type === 'LogicalExpression') {
        let tempEle: Expression = firstElement
        // ['123' && '456']
        // [await new String('123'), await new String('456')]
        if (firstElement.operator === '&&') {
          multipleExpressionsResolve(t, firstElement)?.(ne => tempEle = ne)
          const computedEle = tempEle as unknown as SequenceExpression
          return func => func(t.arrayExpression(computedEle.expressions), true)
        }
        // ['123' || '456']
        // Promise
        //   .resolve(new String('u0'))
        //   .catch(() => new String('u1'))
        if (firstElement.operator === '||') {
          const first = t.callExpression(
            t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
            [wrapStringSecure(t, firstElement.left)]
          )
          return func => func(t.callExpression(
            t.memberExpression(first, t.identifier('catch')),
            [t.arrowFunctionExpression(
              [],
              wrapStringSecure(t, firstElement.right)
            )]
          ))
        }
      }
      return func => func(firstElement)
    }
    if (identifierName) {
      return func => func(t.callExpression(
        t.memberExpression(t.identifier('Promise'), t.identifier(identifierName!)),
        [t.arrayExpression(newElements)]
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
    multipleExpressionsResolve(t, argument)
      ?.((ne, noAwait) => path.replaceWith(
        noAwait
          ? ne
          : t.awaitExpression(ne)
      ))
  }
  return { visitor }
})

export default awaitAutoBox
