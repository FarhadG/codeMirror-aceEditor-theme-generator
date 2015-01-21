/*******************************************************************************
 *  Dependencies
 */
var fs           = require('fs');
var path         = require('path');
var plist        = require('plist');

/*******************************************************************************
 *  TODO SCOPES
 */
var supportedScopes = {
    activeGuide: '',
    background: '',
    bracketContentsForeground: '',
    bracketContentsOptions: '',
    bracketsForeground: '',
    bracketsOptions: '',
    caret: '',
    findHighlight: '',
    findHighlightForeground: '',
    foreground: '',
    inactiveSelection: '',
    inactiveSelectionForeground: '',
    invisibles: '',
    lineHighlight: '',
    selection: '',
    selectionBorder: '',
    selectionForeground: '',
    tagsOptions: '',
};

/*******************************************************************************
 *  Parsying styles
 */
function parseStyles(styles) {
    var css = [];

    var fontStyle = styles.fontStyle || '';

    if (fontStyle.indexOf('underline') !== -1) {
        css.push('text-decoration:underline;');
    }

    if (fontStyle.indexOf('italic') !== -1) {
        css.push('font-style:italic;');
    }

    if (styles.foreground) {
        css.push('color:' + styles.foreground + ';');
    }

    if (styles.background) {
        css.push('background-color:' + styles.background + ';');
    }

    return css.join('\n');
}

/*******************************************************************************
 *  Extarcting styles from a theme
 */
function extractStyles(theme) {
    var styles = {};

    // Global styling
    var globalSettings = theme.settings[0];
    console.log(globalSettings);

    for(var i = 0; i < theme.settings.length; i++) {

        var element = theme.settings[i];
        // if (!element.scope || !element.settings) continue;

        // console.log(element.settings);
        // var scopes = element.scope.split(/\s*[|,]\s*/g);
        // for(var j = 0; j < scopes.length; j++) {
        //     var scope = scopes[i];
        //     var style = parseStyles(element.settings);
        //     var codeMirrorScope = supportedScopes[scope];
        //     if (codeMirrorScope) {
        //         colors[codeMirrorScope] = style;
        //     }
        // }
    }

    return styles;
}

/*******************************************************************************
 *  Parsing the theme
 */
function parseTheme(themeXml, callback) {
    var theme = plist.parse(themeXml);
    callback(theme);
}

/*******************************************************************************
 *  Converting the theme
 */
function convertTheme(name, themePath, outputDirectory) {
    console.log('Converting ' + name);
    var srcTheme = fs.readFileSync(themePath, 'utf8');
    parseTheme(srcTheme, function(theme) {
        var styles = extractStyles(theme);
        styles.cssClass = 'codeMirror-' + name.toLowerCase();
        styles.uuid = theme.uuid;
        // var css = fillTemplate(cssTemplate, styles);
    });
}

/*******************************************************************************
 *  Processing the arguments from terminal
 */
if (process.argv.length > 1) {
    var args = process.argv.splice(2);
    if (args.length < 3) {
        console.error('Usage: node main.js [theme_name, path/to/theme.tmTheme path/to/output/directory]');
        process.exit(1);
    }
    var name = args[0];
    var themePath = args[1];
    var outputDirectory = args[2];
    convertTheme(name, themePath, outputDirectory);
}



