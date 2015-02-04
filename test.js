/*******************************************************************************
 *  Dependencies
 */
var fs      = require('fs');
var path    = require('path');
var plist   = require('plist');
var CSSJSON = require('CSSJSON');
var glob = require('glob');


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
function writeFile(json, themeName, callback) {
    var data = CSSJSON.toCSS(json);
    var themeName = themeName.toLowerCase().split(' ').join('-');
    var destination = __dirname+ '/' +themeName+ '.css';
    fs.writeFile(destination, data, function(err) {
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
    var themeName = themeName.toLowerCase().split(' ').join('-');
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
var base = null;
var mainBackground = null;
var mainColor = null;

var extra = {
    propertyColor: null,
    keyword: null,
    operatorColor: null,
    commentColor: null,
};

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
                base = base || selector;
                var name = themeName.toLowerCase().split(' ').join('-');
                selector = nameSpace(name),
                property = codeMirror;
                value = styles[scope];
                if (property === 'background') {
                    mainBackground = mainBackground || value;
                }
                if (property === 'color') {
                    mainColor = mainColor || value;
                }
                var options = {
                    'font-size': '1em',
                    'line-height': '1.5em',
                    'font-family': 'inconsolata, monospace',
                    'letter-spacing': '0.3px',
                    'word-spacing': '1px',
                };
                for(option in options) {
                    writeToRoot(selector, option, options[option]);
                }
            }
            writeToRoot(selector, property, value);
            var more = {};
            more[base + ' .CodeMirror-lines'] = {
                'padding': '8px 0'
            }

            more[base + ' .CodeMirror-gutters'] = {
                'box-shadow': '1px 0 2px 0 rgba(0, 0, 0, 0.5)',
                '-webkit-box-shadow': '1px 0 2px 0 rgba(0, 0, 0, 0.5)',
                'background-color': mainBackground,
                'padding-right': '10px',
                'z-index': '3',
                'border': 'none'
            };

            more[base + ' div.CodeMirror-cursor'] = {
                'border-left': '3px solid '+ mainColor,
            };

            for(klass in more) {
                for(props in more[klass]) {
                    var prop = props;
                    var value = more[klass][prop];
                    if (klass.indexOf('undefined') === -1) {
                        writeToRoot(klass, prop, value);
                    }
                }
            }
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

        if (cssStyles[0] && cssStyles[0][1]) {
            if (codeMirror === 'cm-comment') {
                extra.commentColor = extra.commentColor || cssStyles[0][1];
            }

            if (codeMirror === 'cm-keyword') {
                extra.keyword = extra.keyword || cssStyles[0][1];
            }

            if (codeMirror === 'cm-property') {
                extra.propertyColor = extra.propertyColor || cssStyles[0][1];
            }

            if (codeMirror === 'cm-operator') {
                extra.operatorColor = extra.operatorColor || cssStyles[0][1];
            }

            for(var i = 0; i < cssStyles.length; i++) {
                var property = cssStyles[i][0];
                var value = cssStyles[i][1];
                writeToRoot(selector, property, value);
            }
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
    for(prop in extra) {
        if (prop === 'propertyColor') {
            writeToRoot(base + ' .cm-property', 'color', extra[prop]);
            writeToRoot(base + ' .cm-atom', 'color', extra[prop]);
            writeToRoot(base + ' .cm-number', 'color', extra[prop]);
        }
        if (prop === 'keyword') {
            writeToRoot(base + ' .cm-keyword', 'color', extra[prop]);
            writeToRoot(base + ' .cm-operator', 'color', extra[prop]);
        }
        // if (prop === 'operatorColor') {
        //     writeToRoot(base + ' .cm-keyword', 'color', extra[prop]);
        //     writeToRoot(base + ' .cm-operator', 'color', extra[prop]);
        // }
        if (prop === 'commentColor') {
            writeToRoot(base + ' .CodeMirror-linenumber', 'color', extra[prop]);
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
function convertTheme(themeName, themePath, debug) {
    var srcTheme = fs.readFileSync(__dirname + themePath, 'utf8');
    parseTheme(srcTheme, function(theme) {
        extractStyles(themeName, theme);
        // print(root);
        writeFile(root, themeName, printCompletedMessage);
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
    var needTo = 0;
    var themeName = args[0];
    glob('themes/**', null, function(err, files) {
        files.forEach(function(file, i) {
            var path = file.split('/')[1];
            if (path) {
                var name = path.split('.')[0];
                var themePath = '/themes/'+ path;
                convertTheme(name, themePath, false);
                needTo++;
                base = null;
                mainBackground = null;
                mainColor = null;
                extra.propertyColor = null;
                extra.keyword = null;
                extra.operatorColor = null;
                extra.commentColor = null;
            }
        });
    });
}
