/*******************************************************************************
 *  Dependencies
 */
var fs      = require('fs');
var path    = require('path');
var plist   = require('plist');
var CSSJSON = require('CSSJSON');


/*******************************************************************************
 *  Current supported scopes between Sublime/TextMate and CodeMirror.
 *  Various references will not look the same, as CodeMirror
 *  and Sublime have different and limited ways of refering to the code syntax.
 */
var supportedScopes = require('./scopes/CodeMirrorSupportedScopes');


// The root JSON that gets parsed to CSS after populated.
var root = {};


/*******************************************************************************
 *  Basic parsing of CSS styles provided by the XML format form Sublime.
 */
function parseStyles(styles) {
    var css = [];

    var fontStyle = styles.fontStyle || '';

    if (fontStyle.indexOf('underline') !== -1) {
        css.push(['text-decoration', 'underline']);
    }

    if (fontStyle.indexOf('italic') !== -1) {
        css.push(['font-style', 'italic']);
    }

    if (styles.foreground) {
        css.push(['color', styles.foreground]);
    }

    if (styles.background) {
        css.push(['background', styles.background]);
    }

    return css;
}


/*******************************************************************************
 *  Convert a given JSON to CSS and then display message after file has
 *  been written.
 */
function writeFile(json, themeName, outputDirectory, callback) {
    var data = CSSJSON.toCSS(json);
    var destination = [__dirname];

    if (outputDirectory) {
        destination.push(outputDirectory);
    }

    fs.writeFile(destination.join(''), data, function(err) {
        if (err) console.log(err);
        callback(themeName);
    });
}


/*******************************************************************************
 *  Given a string, turn it into a CSS class.
 */
function convertClass(string) {
    return '.' + string;
}


/*******************************************************************************
 *  A simple way of namespacing the entire CSS on top of CodeMirror's base styling.
 *  NOTE: The theme class is applied to the code editor via
 *  CodeMirror's API.
 */
function nameSpace(themeName) {
    return convertClass('cm-s-' + themeName);
}


/*******************************************************************************
 *  Build a CSS selector with namespacing.
 */
function buildClass(themeName, selector) {
    return [nameSpace(themeName), convertClass(selector)].join(' ');
}


/*******************************************************************************
 *  A helper function for printing our the entire root JSON.
 */
function print(json) {
    console.log(JSON.stringify(json, null, 4));
}


/*******************************************************************************
 *  Constructs the root JSON with the necessary keys and information.
 */
function generateThemeInfo(themeInfo, theme) {
    for(var themeInfo in theme) {
        if (themeInfo.toLowerCase() !== 'settings') {
            var info = theme[themeInfo];
            root[themeInfo] = info;
        }
    }
    root.children = {};
    root.unsupported = {};
}


/*******************************************************************************
 *  If a given scope is not yet supported, add it to the root's unsupported key.
 */
function addToUnsupported(scope, info) {
    root.unsupported[scope] = info;
}


/*******************************************************************************
 *  Given the necessary information for the CSS values,
 *  write the information to the root JSON.
 */
function writeToRoot(selector, property, value) {
    root.children[selector] = root.children[selector] || {};
    root.children[selector].attributes = root.children[selector].attributes || {};
    root.children[selector].attributes[property] = value;
}


/*******************************************************************************
 *  The global styles are a special treatment as they are formatted differently
 *  within Sublime's markup.
 */
function generateGlobalStyles(styles, themeName, theme) {
    for(var scope in styles) {
        var codeMirror = supportedScopes[scope];
        if (codeMirror) {
            var selector, property, value;
            // Has extra information for a more complex selector
            if (Array.isArray(codeMirror)) {
                selector = buildClass(themeName, codeMirror[0]);
                property = codeMirror[1];
                value = styles[scope];
            }
            // The selector sits at the top of the theme
            else {
                selector = nameSpace(themeName),
                property = codeMirror;
                value = styles[scope];
            }
            writeToRoot(selector, property, value);
        }
        else {
            addToUnsupported(scope, 'Global styling');
        }
    }
}


/*******************************************************************************
 *  If the style's scope is supportted, write it to the root JSON.
 *  If not, add it to the unsupported key under the root JSON.
 */
function generateStyles(styles, themeName, theme) {
    var codeMirror = supportedScopes[styles.scope];
    if (codeMirror) {
        var selector = buildClass(themeName, codeMirror);
        var cssStyles = parseStyles(styles.settings);
        for(var i = 0; i < cssStyles.length; i++) {
            var property = cssStyles[i][0];
            var value = cssStyles[i][1];
            writeToRoot(selector, property, value);
        }
    }
    else {
        addToUnsupported(styles.scope, styles);
    }
}


/*******************************************************************************
 *  Iterate over the theme settings and write them off into the root JSON
 *  as either global styling or normal styling.
 */
function extractStyles(themeName, theme) {
    generateThemeInfo(themeName, theme);
    var settings = theme.settings;

    for(var i = 0; i < settings.length; i++) {
        if (!(settings[i].name || settings[i].scope)) {
            generateGlobalStyles(settings[i].settings, themeName, theme);
        }
        else {
            generateStyles(settings[i], themeName, theme);
        }
    }
}

/*******************************************************************************
 *  Parse the XML structure
 */
function parseTheme(themeXml, callback) {
    var theme = plist.parse(themeXml);
    callback(theme);
}


/*******************************************************************************
 *  Let the user know that the theme has been generated
 */
function printCompletedMessage(themeName) {
    console.log([
        '',
        '          __________________________________   ',
        ' ________|                                     ',
        ' \\       |    Converted theme: '+ themeName +'',
        '  \\      |                                    ',
        '  /      |__________________________________   ',
        ' /___________)                                 ',
        '',
        ''
    ].join('\n'));
}


/*******************************************************************************
 *  Read the given theme file and send it off to be parsed.
 *  Once completed, send off the root JSON to be written to CSS.
 */
function convertTheme(themeName, themePath, outputDirectory, debug) {
    var srcTheme = fs.readFileSync(__dirname + themePath, 'utf8');
    parseTheme(srcTheme, function(theme) {
        extractStyles(themeName, theme);
        if (debug) print(root);
        writeFile(root, themeName, outputDirectory, printCompletedMessage);
    });
}


/*******************************************************************************
 *  Helper function for cleaning up the beginning slash
 */
function cleanPath(path) {
    return '/' + path.replace(/^\//g, '');
}


/*******************************************************************************
 *  Processing the arguments from terminal
 */
if (process.argv.length > 1) {
    var args = process.argv.splice(2);
    if (args.length < 2) {
        console.error('Usage: [themeName] [pathToSrcFile] [pathToDestinationFile(optional)]');
        process.exit(1);
    }
    var themeName = args[0];
    var themePath = cleanPath(args[1]);
    var outputDirectory = cleanPath(args[2]);
    var debug = args[3] ? true : false;
    convertTheme(themeName, themePath, outputDirectory, debug);
}



