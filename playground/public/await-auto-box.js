function awaitAutoBox({ types: t }) {
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
}
