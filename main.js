/*******************************************************************************
 *  Dependencies
 */
var fs      = require('fs');
var path    = require('path');
var plist   = require('plist');
var CSSJSON = require('CSSJSON');
var supportedScopes = require('./supportedScopes');


/*******************************************************************************
 *  Parsying styles TODO????????
 */
function parseStyles(styles) {
    var css = [];
    console.log(styles);
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

function buildClass(themeClass, selector) {
    return [convertClass(themeClass), convertClass(selector)].join(' ');
}

function print(json) {
    console.log(JSON.stringify(json, null, 4));
}

function generateThemeInfo(themeInfo, theme) {
    var root = {};

    for(var themeInfo in theme) {
        if (themeInfo.toLowerCase() !== 'settings') {
            var info = theme[themeInfo];
            root[themeInfo] = info;
        }
    }

    root.children = {};
    root.unsupported = {};
    return root;
}

function generateGlobalStyles(global, root, themeName, theme) {
    var styles = root.children;

    for(var scope in global) {
        var codeMirrorScope = supportedScopes[scope];
        if (codeMirrorScope) {
            var selector = buildClass(themeName, codeMirrorScope.selector);
            var property = codeMirrorScope.property;
            var value = global[scope];
            styles[selector] = {};
            styles[selector].attributes = {};
            styles[selector].attributes[property] = value;
        } else {
            root.unsupported[scope] = 'Global';
        }
    }
}

/*******************************************************************************
 *  Extarcting styles from a theme
 */
function extractStyles(themeName, theme) {
    var root = generateThemeInfo(themeName, theme);
    var settings = theme.settings;

    for(var i = 0; i < settings.length; i++) {
        if (!(settings[i].name || settings[i].scope)) {
            // generateGlobalStyles(settings[i].settings, root, themeName, theme);
        } else {
            // now onto applying the correct styling to the rest of the elements
            parseStyles(settings[i].settings);
        }

    }

    print(root)
    return root;
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
    // console.log('Converting ' + name);
    var srcTheme = fs.readFileSync(themePath, 'utf8');
    parseTheme(srcTheme, function(theme) {
        styles = extractStyles(name, theme);
        writeFile(styles);
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



