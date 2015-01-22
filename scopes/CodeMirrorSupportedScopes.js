/*******************************************************************************
 *  Current supported scopes between Sublime/TextMate and CodeMirror
 */
module.exports = {
    /*
     *  Special cases for the values as the globals
     *  don't have an associated css property
     */
    'background': 'background',
    'foreground': 'color',
    'selection': ['CodeMirror-selected', 'background'],
    /*
     *  Specific styling with their associated CodeMirror
     *  selectors as the values
     */
    'comment': 'cm-comment',
    'string': 'cm-string',
    'constant.numeric': 'cm-number',
    'constant.language': 'cm-atom',
    'keyword': 'cm-keyword',
    'entity.name.function': 'cm-variable',
    'variable.parameter': 'cm-def',
    'support.function': 'cm-property'
};
