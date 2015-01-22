/*******************************************************************************
 *  Dependencies
 */
var fs      = require('fs');
var path    = require('path');
var plist   = require('plist');
var CSSJSON = require('CSSJSON');
var supportedScopes = require('./supportedScopes');

var root = {};

/*******************************************************************************
 *  Parsying styles TODO????????
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
 *  Write to the file
 */
function writeFile(styles) {
    var data = CSSJSON.toCSS(styles);
    fs.writeFile(__dirname + '/codemirror/famous.css', data, function(err) {
        if(err) console.log(err);
    });
}

function convertClass(string) {
    return '.' + string;
}

function nameSpace(themeName) {
    return convertClass('cm-s-' + themeName);
}

function buildClass(themeName, selector) {
    return [
        nameSpace(themeName),
        convertClass(selector)
    ].join(' ');
}

function print(json) {
    console.log(JSON.stringify(json, null, 4));
}

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

function addToUnsupported(scope, info) {
    root.unsupported[scope] = info;
}

function writeToRoot(selector, property, value) {
    root.children[selector] = root.children[selector] || {};
    root.children[selector].attributes = root.children[selector].attributes || {};
    root.children[selector].attributes[property] = value;
}

function generateGlobalStyles(styles, themeName, theme) {
    for(var scope in styles) {
        var codeMirror = supportedScopes[scope];
        if (codeMirror) {
            var selector, property, value;
            if (Array.isArray(codeMirror)) {
                selector = buildClass(themeName, codeMirror[0]);
                property = codeMirror[1];
                value = styles[scope];
            }
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
        addToUnsupported(styles.scope, 'Specific styling');
    }
}

/*******************************************************************************
 *  Extarcting styles from a theme
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
 *  Parsing the theme
 */
function parseTheme(themeXml, callback) {
    var theme = plist.parse(themeXml);
    callback(theme);
}

function printLoadingMessage(name) {
    console.log([
        '',
        '          __________________________________   ',
        ' ________|                                     ',
        ' \\       |    Converting theme: '+ name +'    ',
        '  \\      |                                    ',
        '  /      |__________________________________   ',
        ' /___________)                                 ',
        '',
        ''
    ].join('\n'));
}

/*******************************************************************************
 *  Converting the theme
 */
function convertTheme(name, themePath, outputDirectory) {
    printLoadingMessage(name);
    var srcTheme = fs.readFileSync(themePath, 'utf8');
    parseTheme(srcTheme, function(theme) {
        extractStyles(name, theme);
        writeFile(root);
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



