/*******************************************************************************
 *  Current supported scopes between Sublime + CodeMirror
 */
module.exports = {
    background: {
        selector: 'CodeMirror',
        property: 'background'
    },
    foreground: {
        selector: 'cm-variable',
        property: 'color'
    },
    selection: {
        selector: 'CodeMirror-selected',
        property: 'background'
    },
    comment: {
        selector: '...',
        property: ''
    }
};
