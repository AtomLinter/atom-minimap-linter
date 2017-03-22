'use babel';

export default {
  provideLinter() {
    return {
      name: 'Minimap Linter Test',
      scope: 'file',
      lintsOnChange: true,
      grammarScopes: ['*'],
      lint(textEditor) {
        return [{
          severity: 'info',
          location: {
            file: textEditor.getPath(),
            position: [[0, 0], [0, Infinity]],
          },
          excerpt: 'Test message',
        }];
      },
    };
  },
};
